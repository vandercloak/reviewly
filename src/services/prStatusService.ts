// PR Status persistence service using localStorage
interface PRStatus {
  id: number;
  spicy: boolean;
  delayed: boolean;
  completed: boolean;
  timestamp: number;
}

class PRStatusService {
  private readonly STORAGE_KEY = 'reviewly_pr_statuses';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Get all PR statuses from localStorage
  getAllStatuses(): Map<number, PRStatus> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return new Map();

      const data: Record<string, PRStatus> = JSON.parse(stored);
      const statusMap = new Map<number, PRStatus>();
      
      // Filter out expired entries and convert to Map
      const now = Date.now();
      Object.entries(data).forEach(([id, status]) => {
        if (now - status.timestamp < this.CACHE_DURATION) {
          statusMap.set(Number(id), status);
        }
      });

      return statusMap;
    } catch (error) {
      console.warn('Failed to load PR statuses from localStorage:', error);
      return new Map();
    }
  }

  // Get specific PR status
  getStatus(prId: number): PRStatus | null {
    const allStatuses = this.getAllStatuses();
    return allStatuses.get(prId) || null;
  }

  // Update PR status
  updateStatus(prId: number, updates: Partial<Omit<PRStatus, 'id' | 'timestamp'>>): void {
    try {
      const allStatuses = this.getAllStatuses();
      const existing = allStatuses.get(prId) || {
        id: prId,
        spicy: false,
        delayed: false,
        completed: false,
        timestamp: Date.now()
      };

      const updated: PRStatus = {
        ...existing,
        ...updates,
        timestamp: Date.now()
      };

      allStatuses.set(prId, updated);
      this.saveAllStatuses(allStatuses);
    } catch (error) {
      console.warn('Failed to update PR status:', error);
    }
  }

  // Mark PR as spicy
  setSpicy(prId: number, isSpicy: boolean): void {
    this.updateStatus(prId, { spicy: isSpicy });
  }

  // Mark PR as delayed
  setDelayed(prId: number, isDelayed: boolean): void {
    this.updateStatus(prId, { delayed: isDelayed });
  }

  // Mark PR as completed
  setCompleted(prId: number, isCompleted: boolean): void {
    this.updateStatus(prId, { completed: isCompleted });
  }

  // Get Sets for easy checking (compatible with existing code)
  getSpicyPRs(): Set<number> {
    const allStatuses = this.getAllStatuses();
    const spicyPRs = new Set<number>();
    
    allStatuses.forEach((status, id) => {
      if (status.spicy) spicyPRs.add(id);
    });
    
    return spicyPRs;
  }

  getDelayedPRs(): Set<number> {
    const allStatuses = this.getAllStatuses();
    const delayedPRs = new Set<number>();
    
    allStatuses.forEach((status, id) => {
      if (status.delayed) delayedPRs.add(id);
    });
    
    return delayedPRs;
  }

  getCompletedPRs(): Set<number> {
    const allStatuses = this.getAllStatuses();
    const completedPRs = new Set<number>();
    
    allStatuses.forEach((status, id) => {
      if (status.completed) completedPRs.add(id);
    });
    
    return completedPRs;
  }

  // Save all statuses to localStorage
  private saveAllStatuses(statusMap: Map<number, PRStatus>): void {
    try {
      const data: Record<string, PRStatus> = {};
      statusMap.forEach((status, id) => {
        data[id.toString()] = status;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save PR statuses to localStorage:', error);
    }
  }

  // Clear old entries (called periodically)
  cleanup(): void {
    const allStatuses = this.getAllStatuses();
    // getAllStatuses already filters out expired entries
    this.saveAllStatuses(allStatuses);
  }

  // Clear all statuses (for testing or reset)
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const prStatusService = new PRStatusService();