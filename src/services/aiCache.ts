import { AIReviewSummary } from '../types/ai';

interface CacheEntry {
  data: AIReviewSummary;
  timestamp: number;
  expiresAt: number;
}

interface CacheStorage {
  [key: string]: CacheEntry;
}

export class AICacheService {
  private cache: CacheStorage = {};
  private storageKey = 'reviewly_ai_cache';
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.loadFromStorage();
    // Clean expired entries on startup
    this.cleanExpired();
  }

  /**
   * Generate a cache key for a pull request
   */
  private generateKey(prId: number, commitSha?: string): string {
    return `pr_${prId}_${commitSha || 'latest'}`;
  }

  /**
   * Store AI review result in cache
   */
  set(prId: number, data: AIReviewSummary, commitSha?: string, ttl?: number): void {
    const key = this.generateKey(prId, commitSha);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache[key] = {
      data,
      timestamp: now,
      expiresAt
    };

    this.saveToStorage();
  }

  /**
   * Get AI review result from cache
   */
  get(prId: number, commitSha?: string): AIReviewSummary | null {
    const key = this.generateKey(prId, commitSha);
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }

    return entry.data;
  }

  /**
   * Check if AI review exists in cache
   */
  has(prId: number, commitSha?: string): boolean {
    const key = this.generateKey(prId, commitSha);
    const entry = this.cache[key];
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      delete this.cache[key];
      this.saveToStorage();
      return false;
    }
    
    return true;
  }

  /**
   * Remove specific entry from cache
   */
  remove(prId: number, commitSha?: string): void {
    const key = this.generateKey(prId, commitSha);
    delete this.cache[key];
    this.saveToStorage();
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache = {};
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; expired: number; size: string } {
    const now = Date.now();
    const entries = Object.values(this.cache);
    const expired = entries.filter(entry => now > entry.expiresAt).length;
    
    return {
      total: entries.length,
      expired,
      size: this.formatBytes(JSON.stringify(this.cache).length)
    };
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = false;

    for (const [key, entry] of Object.entries(this.cache)) {
      if (now > entry.expiresAt) {
        delete this.cache[key];
        cleaned = true;
      }
    }

    if (cleaned) {
      this.saveToStorage();
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load AI cache from storage:', error);
      this.cache = {};
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save AI cache to storage:', error);
      // If storage is full, try clearing expired entries and retry
      this.cleanExpired();
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
      } catch (retryError) {
        console.error('Failed to save AI cache after cleanup:', retryError);
      }
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get all cached PR IDs
   */
  getCachedPRs(): number[] {
    const prIds = new Set<number>();
    
    Object.keys(this.cache).forEach(key => {
      const match = key.match(/^pr_(\d+)_/);
      if (match) {
        prIds.add(parseInt(match[1]));
      }
    });
    
    return Array.from(prIds);
  }

  /**
   * Get cache entry age in minutes
   */
  getEntryAge(prId: number, commitSha?: string): number | null {
    const key = this.generateKey(prId, commitSha);
    const entry = this.cache[key];
    
    if (!entry) return null;
    
    return Math.floor((Date.now() - entry.timestamp) / (1000 * 60));
  }
}

// Export singleton instance
export const aiCacheService = new AICacheService();