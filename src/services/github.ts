import { Octokit } from '@octokit/rest';
import { GitHubRepository, GitHubPullRequest, GitHubFile, GitHubUser, GitHubReviewComment, GitHubReview } from '../types/github';
import { repoCacheService } from './repoCache';

class GitHubService {
  private octokit: Octokit | null = null;

  initialize(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  private ensureInitialized() {
    if (!this.octokit) {
      throw new Error('GitHub service not initialized. Please provide an access token.');
    }
  }

  async getCurrentUser(): Promise<GitHubUser> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.users.getAuthenticated();
    return response.data as GitHubUser;
  }

  async getRepositories(page = 1, perPage = 30): Promise<GitHubRepository[]> {
    this.ensureInitialized();
    
    // Try to get current user for caching key
    const user = await this.getCurrentUser();
    const cacheKey = `${user.login}_p${page}_pp${perPage}`;
    
    // Check cache first
    const cached = repoCacheService.getCachedUserRepos(cacheKey);
    if (cached && cached.data.length > 0) {
      const cacheAge = Date.now() - (cached.timestamp || 0);
      const fifteenMinutes = 15 * 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      
      // Return cached data if it's less than 15 minutes old
      if (cacheAge < fifteenMinutes) {
        // Only fetch fresh data in background if cache is older than 5 minutes
        if (cacheAge > fiveMinutes) {
          this.fetchAndUpdateReposInBackground(cacheKey, page, perPage).catch(error => {
            console.warn('Background repo update failed:', error);
          });
        }
        return cached.data;
      }
    }
    
    // No cache or cache too old, fetch fresh data
    const response = await this.octokit!.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page,
    });
    
    const repos = response.data as GitHubRepository[];
    
    // Cache the response
    repoCacheService.cacheUserRepos(cacheKey, repos, response.headers.etag);
    
    return repos;
  }

  private async fetchAndUpdateReposInBackground(cacheKey: string, page: number, perPage: number): Promise<void> {
    try {
      const response = await this.octokit!.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        direction: 'desc',
        per_page: perPage,
        page,
      });
      
      const repos = response.data as GitHubRepository[];
      repoCacheService.cacheUserRepos(cacheKey, repos, response.headers.etag);
      
      console.log(`Background update: fetched ${repos.length} repositories`);
    } catch (error) {
      console.error('Background repo fetch failed:', error);
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    this.ensureInitialized();
    
    // Check cache first
    const cached = repoCacheService.getCachedRepository(owner, repo);
    if (cached) {
      return cached.data;
    }
    
    const response = await this.octokit!.rest.repos.get({
      owner,
      repo,
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
    });
    
    const repository = response.data as GitHubRepository;
    
    // Cache the response
    repoCacheService.cacheRepository(owner, repo, repository, response.headers.etag);
    
    return repository;
  }

  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubPullRequest[]> {
    this.ensureInitialized();
    
    // Check cache first
    const cached = repoCacheService.getCachedPullRequests(owner, repo);
    if (cached && state === 'open') { // Only cache open PRs for now
      return cached.data;
    }
    
    const response = await this.octokit!.rest.pulls.list({
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      per_page: 50,
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : undefined,
    });
    
    const pullRequests = response.data as GitHubPullRequest[];
    
    // Cache open PRs
    if (state === 'open') {
      repoCacheService.cachePullRequests(owner, repo, pullRequests, response.headers.etag);
    }
    
    return pullRequests;
  }

  async getAllPullRequestsAwaitingReview(onUpdate?: (prs: GitHubPullRequest[]) => void): Promise<GitHubPullRequest[]> {
    this.ensureInitialized();
    
    const cacheKey = 'all_prs_awaiting_review';
    const cached = repoCacheService.getCachedPullRequests('_all_', cacheKey);
    
    // Eager loading: Always return cached data immediately if available
    if (cached && cached.data.length > 0) {
      const cacheAge = Date.now() - (cached.timestamp || 0);
      const fiveMinutes = 5 * 60 * 1000;
      
      // Start background refresh if cache is older than 5 minutes
      if (cacheAge > fiveMinutes && onUpdate) {
        console.log('🔄 Showing cached data, fetching fresh PRs in background...');
        this.fetchAndUpdatePRsInBackground(cacheKey, onUpdate).catch(error => {
          console.warn('Background PR update failed:', error);
        });
      }
      
      return cached.data;
    }
    
    // No cache available, fetch fresh data
    console.log('📥 No cached data, fetching fresh PRs...');
    return this.fetchFreshPRsAwaitingReview(cacheKey);
  }

  private async fetchFreshPRsAwaitingReview(cacheKey: string): Promise<GitHubPullRequest[]> {
    try {
      console.log('🔍 Fetching PRs awaiting review...');
      
      // Get current user first to handle any auth issues early
      const user = await this.getCurrentUser();
      console.log(`✅ Authenticated as: ${user.login}`);
      
      let allPRs: any[] = [];
      
      // Try to get PRs where the current user is requested as a reviewer
      try {
        const response = await this.octokit!.rest.search.issuesAndPullRequests({
          q: `type:pr state:open review-requested:@me`,
          sort: 'updated',
          order: 'desc',
          per_page: 50,
        });
        allPRs.push(...response.data.items);
        console.log(`📋 Found ${response.data.items.length} PRs with review requests`);
      } catch (searchError: any) {
        console.warn('❌ Failed to search for review requests:', searchError.message);
        
        if (searchError.status === 403 && searchError.message.includes('rate limit')) {
          throw new Error('GitHub rate limit exceeded. Please wait a few minutes before trying again.');
        }
      }
      
      // Get additional PRs involving the user (if we don't have many yet)
      if (allPRs.length < 20) {
        try {
          await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit protection
          
          const response = await this.octokit!.rest.search.issuesAndPullRequests({
            q: `type:pr state:open -author:${user.login} involves:${user.login}`,
            sort: 'updated',
            order: 'desc',
            per_page: 30,
          });
          allPRs.push(...response.data.items);
          console.log(`📋 Found ${response.data.items.length} additional PRs involving user`);
        } catch (searchError: any) {
          console.warn('⚠️ Failed to search for additional PRs:', searchError.message);
          // Don't throw here, continue with what we have
        }
      }

      // Deduplicate PRs by ID
      const uniquePRs = allPRs.reduce((acc, pr) => {
        if (!acc.find(existing => existing.id === pr.id)) {
          acc.push(pr);
        }
        return acc;
      }, [] as any[]);

      // ✨ OPTIMIZATION: Use search results directly instead of individual API calls
      const pullRequests: GitHubPullRequest[] = uniquePRs.slice(0, 50).map(pr => {
        // Debug: log the search result structure to understand what we have
        console.log('🔍 Search result structure for PR #' + pr.number + ':', {
          repository: pr.repository,
          repository_url: pr.repository_url,
          html_url: pr.html_url,
          url: pr.url
        });
        
        // Extract repo info from URL if repository object is incomplete
        let repoOwner = 'unknown', repoName = 'unknown';
        
        // Try multiple sources to get repo info
        if (pr.repository?.full_name) {
          console.log(`📝 Using repository.full_name: ${pr.repository.full_name}`);
          [repoOwner, repoName] = pr.repository.full_name.split('/');
        } else if (pr.repository_url) {
          console.log(`📝 Using repository_url: ${pr.repository_url}`);
          // repository_url format: https://api.github.com/repos/owner/repo
          const urlParts = pr.repository_url.split('/');
          repoOwner = urlParts[urlParts.length - 2];
          repoName = urlParts[urlParts.length - 1];
        } else if (pr.html_url) {
          console.log(`📝 Using html_url: ${pr.html_url}`);
          // html_url format: https://github.com/owner/repo/pull/123
          const urlParts = pr.html_url.split('/');
          repoOwner = urlParts[3];
          repoName = urlParts[4];
        } else if (pr.url) {
          console.log(`📝 Using url: ${pr.url}`);
          // url format: https://api.github.com/repos/owner/repo/pulls/123
          const urlParts = pr.url.split('/');
          const repoIndex = urlParts.indexOf('repos');
          if (repoIndex !== -1 && urlParts.length > repoIndex + 2) {
            repoOwner = urlParts[repoIndex + 1];
            repoName = urlParts[repoIndex + 2];
          }
        } else {
          console.log(`📝 Using fallback from repository object or user`);
          repoOwner = pr.repository?.owner?.login || pr.user?.login || 'unknown';
          repoName = pr.repository?.name || 'unknown';
        }
        
        // Validate the extracted values
        if (!repoOwner || repoOwner === '') repoOwner = 'unknown';
        if (!repoName || repoName === '') repoName = 'unknown';
        
        console.log(`📝 Extracted repo info for PR #${pr.number}: ${repoOwner}/${repoName}`);
        
        // Map search result to our PR format - the search API provides most of what we need
        return {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          draft: pr.draft || false,
          html_url: pr.html_url,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          closed_at: pr.closed_at,
          merged_at: pr.merged_at,
          user: pr.user,
          assignees: pr.assignees || [],
          requested_reviewers: pr.requested_reviewers || [],
          requested_teams: pr.requested_teams || [],
          labels: pr.labels || [],
          head: {
            ref: pr.head?.ref || 'unknown',
            sha: pr.head?.sha || '',
            repo: pr.head?.repo || {
              ...pr.repository,
              owner: pr.repository?.owner || { login: repoOwner },
              login: repoOwner,
              name: repoName,
              full_name: `${repoOwner}/${repoName}`
            }
          },
          base: {
            ref: pr.base?.ref || pr.repository?.default_branch || 'main',
            sha: pr.base?.sha || '',
            repo: {
              ...pr.repository,
              owner: pr.repository?.owner || { login: repoOwner },
              login: repoOwner,
              name: repoName,
              full_name: `${repoOwner}/${repoName}`
            }
          },
          // Provide reasonable defaults for fields not in search results
          additions: 0, // Will be updated if/when we fetch full details
          deletions: 0,
          changed_files: 0,
          commits: 1,
          comments: pr.comments || 0,
          review_comments: pr.comments || 0,
          maintainer_can_modify: false,
          rebaseable: null,
          mergeable: null,
          mergeable_state: 'unknown',
          merged: pr.state === 'closed' && pr.merged_at !== null,
          merge_commit_sha: null,
          merged_by: null,
          milestone: pr.milestone || null,
          locked: pr.locked || false,
          active_lock_reason: null,
          auto_merge: null
        } as GitHubPullRequest;
      });

      console.log(`✅ Processed ${pullRequests.length} PRs without individual API calls`);

      // Cache the results
      repoCacheService.cachePullRequests('_all_', cacheKey, pullRequests);
      
      return pullRequests;
    } catch (error: any) {
      console.error('❌ Failed to fetch PRs awaiting review:', error);
      
      if (error.status === 401) {
        throw new Error('GitHub authentication failed. Please check your access token.');
      } else if (error.status === 403) {
        throw new Error('Insufficient GitHub permissions or rate limit exceeded. Please check your token permissions.');
      } else if (error.status === 404) {
        throw new Error('GitHub API endpoint not found. This might be a temporary issue.');
      } else {
        throw new Error(`Failed to fetch PRs: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private async fetchAndUpdatePRsInBackground(cacheKey: string, onUpdate: (prs: GitHubPullRequest[]) => void): Promise<void> {
    try {
      console.log('🔄 Background refresh starting...');
      const freshPRs = await this.fetchFreshPRsAwaitingReview(cacheKey);
      
      // Immediately update the UI with fresh data
      onUpdate(freshPRs);
      console.log(`✅ Background update complete: ${freshPRs.length} PRs`);
    } catch (error) {
      console.error('❌ Background PR fetch failed:', error);
    }
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPullRequest> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return response.data as GitHubPullRequest;
  }

  // Enrich a PR from search results with full details (for file stats, etc.)
  async enrichPullRequest(pr: GitHubPullRequest): Promise<GitHubPullRequest> {
    this.ensureInitialized();
    
    try {
      // Get full PR details to get accurate file stats
      const fullPR = await this.getPullRequest(
        pr.base.repo.owner.login,
        pr.base.repo.name,
        pr.number
      );
      
      // Merge the full details with our existing PR data
      return {
        ...pr,
        additions: fullPR.additions,
        deletions: fullPR.deletions,
        changed_files: fullPR.changed_files,
        commits: fullPR.commits,
        mergeable: fullPR.mergeable,
        mergeable_state: fullPR.mergeable_state,
        rebaseable: fullPR.rebaseable,
        head: {
          ...pr.head,
          repo: fullPR.head.repo
        },
        base: {
          ...pr.base,
          repo: fullPR.base.repo
        }
      };
    } catch (error) {
      console.warn('Failed to enrich PR details:', error);
      return pr; // Return original if enrichment fails
    }
  }

  async getPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<GitHubFile[]> {
    this.ensureInitialized();
    try {
      console.log(`🔍 GitHub API: Fetching files for ${owner}/${repo}#${pullNumber}`);
      const response = await this.octokit!.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });
      console.log(`📁 GitHub API: Found ${response.data.length} files for PR #${pullNumber}`);
      return response.data as GitHubFile[];
    } catch (error: any) {
      console.error(`❌ GitHub API: Failed to fetch files for ${owner}/${repo}#${pullNumber}:`, error);
      if (error.status === 404) {
        console.warn('PR or repository not found - might be private or deleted');
      } else if (error.status === 403) {
        console.warn('Access denied - check GitHub token permissions');
      }
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    this.ensureInitialized();
    
    const sha = ref || 'HEAD';
    
    // Check cache first
    const cached = repoCacheService.getCachedFileContent(owner, repo, path, sha);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.octokit!.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      
      const data = response.data as any;
      if (data.content) {
        const content = atob(data.content.replace(/\s/g, ''));
        
        // Cache the file content
        repoCacheService.cacheFileContent(owner, repo, path, sha, content);
        
        return content;
      }
      throw new Error('File content not found');
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  async getReviewComments(owner: string, repo: string, pullNumber: number): Promise<GitHubReviewComment[]> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return response.data as GitHubReviewComment[];
  }

  async getReviews(owner: string, repo: string, pullNumber: number): Promise<GitHubReview[]> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return response.data as GitHubReview[];
  }

  async createReviewComment(
    owner: string,
    repo: string,
    pullNumber: number,
    comment: {
      body: string;
      commit_id: string;
      path: string;
      line?: number;
      start_line?: number;
      side?: 'LEFT' | 'RIGHT';
      start_side?: 'LEFT' | 'RIGHT';
    }
  ): Promise<GitHubReviewComment> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      ...comment,
    });
    return response.data as GitHubReviewComment;
  }

  async createReview(
    owner: string,
    repo: string,
    pullNumber: number,
    review: {
      body?: string;
      event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
      comments?: Array<{
        path: string;
        line?: number;
        body: string;
        start_line?: number;
        side?: 'LEFT' | 'RIGHT';
        start_side?: 'LEFT' | 'RIGHT';
      }>;
    }
  ): Promise<GitHubReview> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      ...review,
    });
    return response.data as GitHubReview;
  }

  async searchRepositories(query: string, page = 1): Promise<{ repositories: GitHubRepository[]; total: number }> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.search.repos({
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: 30,
      page,
    });
    return {
      repositories: response.data.items as GitHubRepository[],
      total: response.data.total_count,
    };
  }

  async getDiff(owner: string, repo: string, base: string, head: string): Promise<string> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
      mediaType: {
        format: 'diff',
      },
    });
    return response.data as unknown as string;
  }
}

export const githubService = new GitHubService();