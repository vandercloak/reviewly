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

  async getAllPullRequestsAwaitingReview(): Promise<GitHubPullRequest[]> {
    this.ensureInitialized();
    
    // Check cache first and return immediately if available
    const cacheKey = 'all_prs_awaiting_review';
    const cached = repoCacheService.getCachedPullRequests('_all_', cacheKey);
    
    // If we have cached data less than 10 minutes old, return it immediately
    // Then fetch fresh data in the background only if cache is older than 2 minutes
    if (cached && cached.data.length > 0) {
      const cacheAge = Date.now() - (cached.timestamp || 0);
      const tenMinutes = 10 * 60 * 1000;
      const twoMinutes = 2 * 60 * 1000;
      
      // Always return cached data if it's less than 10 minutes old
      if (cacheAge < tenMinutes) {
        // Only fetch fresh data in background if cache is older than 2 minutes
        if (cacheAge > twoMinutes) {
          this.fetchAndUpdatePRsInBackground(cacheKey).catch(error => {
            console.warn('Background PR update failed:', error);
          });
        }
        return cached.data;
      }
    }
    
    // No cache or cache too old, fetch fresh data
    return this.fetchFreshPRsAwaitingReview(cacheKey);
  }

  private async fetchFreshPRsAwaitingReview(cacheKey: string): Promise<GitHubPullRequest[]> {
    try {
      console.log('Fetching PRs awaiting review...');
      
      // Get current user first to handle any auth issues early
      const user = await this.getCurrentUser();
      console.log(`Authenticated as: ${user.login}`);
      
      let reviewRequests: any = { items: [] };
      
      // Try to get PRs where the current user is requested as a reviewer
      try {
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await this.octokit!.rest.search.issuesAndPullRequests({
          q: `type:pr state:open review-requested:@me`,
          sort: 'updated',
          order: 'desc',
          per_page: 30, // Reduced from 100 to avoid rate limits
        });
        reviewRequests = response.data;
        console.log(`Found ${reviewRequests.items.length} PRs with review requests`);
      } catch (searchError: any) {
        console.warn('Failed to search for review requests:', searchError.message);
        
        // Handle rate limiting specifically
        if (searchError.status === 403 && searchError.message.includes('rate limit')) {
          console.log('Rate limited, will use cached data or minimal repo approach');
          throw new Error('GitHub rate limit exceeded. Please wait a few minutes before trying again.');
        } else if (searchError.status === 403) {
          console.log('Search API unavailable (403), falling back to repository-based approach');
        } else {
          console.log('Search failed, falling back to repository-based approach');
        }
      }
      
      // If no review requests found, get PRs from user's repos
      if (reviewRequests.items.length === 0) {
        console.log('No review requests found, fetching from user repos...');
        
        // Get user's repos first (reduced number)
        const repos = await this.getRepositories(1, 10);
        const pullRequests: GitHubPullRequest[] = [];
        
        // Get open PRs from each repo (reduced and with delays)
        for (const repo of repos.slice(0, 3)) { // Limit to first 3 repos to reduce API calls
          try {
            // Add delay between repo requests
            await new Promise(resolve => setTimeout(resolve, 200));
            const prs = await this.getPullRequests(repo.owner.login, repo.name, 'open');
            pullRequests.push(...prs);
          } catch (error: any) {
            console.warn(`Failed to fetch PRs from ${repo.full_name}:`, error);
            // If we hit rate limits, stop trying more repos
            if (error.status === 403) {
              console.log('Rate limited while fetching repo PRs, stopping');
              break;
            }
          }
        }
        
        console.log(`Found ${pullRequests.length} total PRs from user repos`);
        
        // Cache and return
        repoCacheService.cachePullRequests('_all_', cacheKey, pullRequests);
        return pullRequests;
      }
      
      // Get all PRs authored by others that might need review (skip if we already have review requests)
      let otherPRs: any = { items: [] };
      if (reviewRequests.items.length < 10) { // Only fetch if we don't have many review requests
        try {
          // Add delay before second search
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const response = await this.octokit!.rest.search.issuesAndPullRequests({
            q: `type:pr state:open -author:${user.login} involves:${user.login}`,
            sort: 'updated',
            order: 'desc',
            per_page: 20, // Reduced from 50
          });
          otherPRs = response.data;
          console.log(`Found ${otherPRs.items.length} PRs involving user`);
        } catch (searchError: any) {
          console.warn('Failed to search for PRs involving user:', searchError.message);
          // Don't throw here, just continue with what we have
          if (searchError.status === 403 && searchError.message.includes('rate limit')) {
            console.log('Rate limited on second search, continuing with existing results');
          }
        }
      } else {
        console.log('Skipping second search since we have enough review requests');
      }

      // Combine and deduplicate
      const allPRs = [...reviewRequests.items, ...otherPRs.items];
      const uniquePRs = allPRs.reduce((acc, pr) => {
        if (!acc.find(existing => existing.id === pr.id)) {
          acc.push(pr);
        }
        return acc;
      }, [] as any[]);

      // Convert to our format and fetch additional PR details
      const pullRequests: GitHubPullRequest[] = [];
      
      for (const pr of uniquePRs.slice(0, 50)) { // Limit to 50 for performance
        try {
          const [owner, repo] = pr.repository_url.split('/').slice(-2);
          const { data: fullPR } = await this.octokit!.rest.pulls.get({
            owner,
            repo,
            pull_number: pr.number,
          });
          pullRequests.push(fullPR as GitHubPullRequest);
        } catch (error) {
          console.warn(`Failed to fetch PR details for ${pr.number}:`, error);
        }
      }

      // Cache the results
      repoCacheService.cachePullRequests('_all_', cacheKey, pullRequests);
      
      return pullRequests;
    } catch (error: any) {
      console.error('Failed to fetch PRs awaiting review:', error);
      
      // Provide more specific error messages
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

  private async fetchAndUpdatePRsInBackground(cacheKey: string): Promise<void> {
    try {
      const freshPRs = await this.fetchFreshPRsAwaitingReview(cacheKey);
      
      // Optionally trigger a UI update if you have a way to notify the UI
      // For now, the cache is updated and will be used on next load
      console.log(`Background update: fetched ${freshPRs.length} PRs`);
    } catch (error) {
      console.error('Background PR fetch failed:', error);
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

  async getPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<GitHubFile[]> {
    this.ensureInitialized();
    const response = await this.octokit!.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return response.data as GitHubFile[];
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