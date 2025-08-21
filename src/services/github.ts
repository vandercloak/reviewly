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
      // Return cached data immediately
      const cachedRepos = cached.data;
      
      // Fetch fresh data in background
      this.fetchAndUpdateReposInBackground(cacheKey, page, perPage).catch(error => {
        console.warn('Background repo update failed:', error);
      });
      
      return cachedRepos;
    }
    
    // No cache, fetch fresh data
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
    
    // If we have cached data, return it immediately
    // Then fetch fresh data in the background
    if (cached && cached.data.length > 0) {
      // Return cached data immediately
      const cachedPRs = cached.data;
      
      // Fetch fresh data in background
      this.fetchAndUpdatePRsInBackground(cacheKey).catch(error => {
        console.warn('Background PR update failed:', error);
      });
      
      return cachedPRs;
    }
    
    // No cache, fetch fresh data
    return this.fetchFreshPRsAwaitingReview(cacheKey);
  }

  private async fetchFreshPRsAwaitingReview(cacheKey: string): Promise<GitHubPullRequest[]> {
    try {
      console.log('Fetching PRs awaiting review...');
      
      // Get all PRs where the current user is requested as a reviewer
      const { data: reviewRequests } = await this.octokit!.rest.search.issuesAndPullRequests({
        q: `type:pr state:open review-requested:@me`,
        sort: 'updated',
        order: 'desc',
        per_page: 100,
      });
      
      console.log(`Found ${reviewRequests.items.length} PRs with review requests`);

      // Get current user
      const user = await this.getCurrentUser();
      
      // If no review requests found, get PRs from user's repos
      if (reviewRequests.items.length === 0) {
        console.log('No review requests found, fetching from user repos...');
        
        // Get user's repos first
        const repos = await this.getRepositories(1, 20);
        const pullRequests: GitHubPullRequest[] = [];
        
        // Get open PRs from each repo
        for (const repo of repos.slice(0, 5)) { // Limit to first 5 repos for performance
          try {
            const prs = await this.getPullRequests(repo.owner.login, repo.name, 'open');
            pullRequests.push(...prs);
          } catch (error) {
            console.warn(`Failed to fetch PRs from ${repo.full_name}:`, error);
          }
        }
        
        console.log(`Found ${pullRequests.length} total PRs from user repos`);
        
        // Cache and return
        repoCacheService.cachePullRequests('_all_', cacheKey, pullRequests);
        return pullRequests;
      }
      
      // Get all PRs authored by others that might need review
      const { data: otherPRs } = await this.octokit!.rest.search.issuesAndPullRequests({
        q: `type:pr state:open -author:${user.login} involves:${user.login}`,
        sort: 'updated',
        order: 'desc',
        per_page: 50,
      });
      
      console.log(`Found ${otherPRs.items.length} PRs involving user`);

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
    } catch (error) {
      console.error('Failed to fetch PRs awaiting review:', error);
      throw new Error('Failed to fetch PRs awaiting review');
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