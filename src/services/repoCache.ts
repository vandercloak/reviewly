// Repository caching service for improved load times
interface CachedRepository {
  data: any;
  timestamp: number;
  etag?: string;
}

interface CachedPullRequest {
  data: any;
  timestamp: number;
  etag?: string;
}

class RepoCacheService {
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private PR_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for PRs (more dynamic)

  // Repository caching
  cacheRepository(owner: string, repo: string, data: any, etag?: string): void {
    const key = `repo_${owner}_${repo}`;
    const cached: CachedRepository = {
      data,
      timestamp: Date.now(),
      etag
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache repository data:', error);
    }
  }

  getCachedRepository(owner: string, repo: string): CachedRepository | null {
    const key = `repo_${owner}_${repo}`;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const parsed: CachedRepository = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - parsed.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.warn('Failed to retrieve cached repository:', error);
      return null;
    }
  }

  // Pull requests caching
  cachePullRequests(owner: string, repo: string, data: any[], etag?: string): void {
    const key = `prs_${owner}_${repo}`;
    const cached: CachedPullRequest = {
      data,
      timestamp: Date.now(),
      etag
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache PR data:', error);
    }
  }

  getCachedPullRequests(owner: string, repo: string): CachedPullRequest | null {
    const key = `prs_${owner}_${repo}`;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const parsed: CachedPullRequest = JSON.parse(cached);
      
      // Check if cache is still valid
      // For the special "_all_" key, use a longer cache duration for better performance
      const cacheDuration = owner === '_all_' ? 5 * 60 * 1000 : this.PR_CACHE_DURATION;
      
      if (Date.now() - parsed.timestamp > cacheDuration) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.warn('Failed to retrieve cached PRs:', error);
      return null;
    }
  }

  // File content caching (for diff views)
  cacheFileContent(owner: string, repo: string, path: string, sha: string, content: string): void {
    const key = `file_${owner}_${repo}_${path}_${sha}`;
    const cached = {
      content,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache file content:', error);
    }
  }

  getCachedFileContent(owner: string, repo: string, path: string, sha: string): string | null {
    const key = `file_${owner}_${repo}_${path}_${sha}`;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // File content cache is valid for 10 minutes
      if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.content;
    } catch (error) {
      console.warn('Failed to retrieve cached file content:', error);
      return null;
    }
  }

  // User repositories caching (for the repo list)
  cacheUserRepos(username: string, data: any[], etag?: string): void {
    const key = `user_repos_${username}`;
    const cached = {
      data,
      timestamp: Date.now(),
      etag
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to cache user repos:', error);
    }
  }

  getCachedUserRepos(username: string): { data: any[], etag?: string } | null {
    const key = `user_repos_${username}`;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // User repos cache is valid for 10 minutes
      if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }
      
      return { data: parsed.data, etag: parsed.etag };
    } catch (error) {
      console.warn('Failed to retrieve cached user repos:', error);
      return null;
    }
  }

  // Clear all caches
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('repo_') || key.startsWith('prs_') || key.startsWith('file_') || key.startsWith('user_repos_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Clear expired entries
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith('repo_') || key.startsWith('prs_') || key.startsWith('file_') || key.startsWith('user_repos_')) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            let maxAge = this.CACHE_DURATION;
            
            if (key.startsWith('prs_')) {
              maxAge = this.PR_CACHE_DURATION;
            } else if (key.startsWith('file_') || key.startsWith('user_repos_')) {
              maxAge = 10 * 60 * 1000;
            }
            
            if (now - cached.timestamp > maxAge) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired cache entries:', error);
    }
  }

  // Get cache stats
  getStats(): { totalEntries: number; cacheSize: string; expiredEntries: number } {
    let totalEntries = 0;
    let totalSize = 0;
    let expiredEntries = 0;
    const now = Date.now();
    
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('repo_') || key.startsWith('prs_') || key.startsWith('file_') || key.startsWith('user_repos_')) {
          totalEntries++;
          const value = localStorage.getItem(key) || '';
          totalSize += key.length + value.length;
          
          try {
            const cached = JSON.parse(value);
            let maxAge = this.CACHE_DURATION;
            
            if (key.startsWith('prs_')) {
              maxAge = this.PR_CACHE_DURATION;
            } else if (key.startsWith('file_') || key.startsWith('user_repos_')) {
              maxAge = 10 * 60 * 1000;
            }
            
            if (now - cached.timestamp > maxAge) {
              expiredEntries++;
            }
          } catch (error) {
            expiredEntries++;
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
    
    const cacheSize = totalSize < 1024 
      ? `${totalSize} bytes`
      : totalSize < 1024 * 1024
      ? `${(totalSize / 1024).toFixed(2)} KB`
      : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    
    return {
      totalEntries,
      cacheSize,
      expiredEntries
    };
  }
}

export const repoCacheService = new RepoCacheService();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    repoCacheService.clearExpired();
  }, 5 * 60 * 1000);
}