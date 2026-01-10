// services/completionTracker.ts

interface CompletionRecord {
  id: number;
  type: 'plant' | 'chore';
  completedAt: number; // Unix timestamp
}

interface CompletionStorage {
  completions: CompletionRecord[];
  lastReset: string; // ISO date string (YYYY-MM-DD)
}

class CompletionTracker {
  private storageKey = 'taskCompletions';

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Load completions from localStorage and reset if it's a new day
   */
  private loadCompletions(): CompletionStorage {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.createEmptyStorage();
      }

      const data: CompletionStorage = JSON.parse(stored);
      const today = this.getTodayString();

      // Reset if it's a new day
      if (data.lastReset !== today) {
        console.log('New day detected, resetting completions');
        return this.createEmptyStorage();
      }

      return data;
    } catch (error) {
      console.error('Error loading completions:', error);
      return this.createEmptyStorage();
    }
  }

  /**
   * Create empty storage for today
   */
  private createEmptyStorage(): CompletionStorage {
    return {
      completions: [],
      lastReset: this.getTodayString(),
    };
  }

  /**
   * Save completions to localStorage
   */
  private saveCompletions(storage: CompletionStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('Error saving completions:', error);
    }
  }

  /**
   * Mark a task as completed
   */
  markCompleted(id: number, type: 'plant' | 'chore'): void {
    const storage = this.loadCompletions();

    // Remove existing completion for this task (if any)
    storage.completions = storage.completions.filter((c) => !(c.id === id && c.type === type));

    // Add new completion
    storage.completions.push({
      id,
      type,
      completedAt: Math.floor(Date.now() / 1000),
    });

    this.saveCompletions(storage);
  }

  /**
   * Check if a task was completed today
   */
  isCompletedToday(id: number, type: 'plant' | 'chore'): boolean {
    const storage = this.loadCompletions();
    return storage.completions.some((c) => c.id === id && c.type === type);
  }

  /**
   * Get completion timestamp for a task (if completed today)
   */
  getCompletionTime(id: number, type: 'plant' | 'chore'): number | null {
    const storage = this.loadCompletions();
    const completion = storage.completions.find((c) => c.id === id && c.type === type);
    return completion ? completion.completedAt : null;
  }

  /**
   * Get all completions for today
   */
  getTodayCompletions(): CompletionRecord[] {
    const storage = this.loadCompletions();
    return [...storage.completions];
  }

  /**
   * Clear all completions (useful for testing)
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get time until midnight (for UI feedback)
   */
  getTimeUntilMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  /**
   * Check if we need to reset (for periodic checks)
   */
  shouldReset(): boolean {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return false;

      const data: CompletionStorage = JSON.parse(stored);
      return data.lastReset !== this.getTodayString();
    } catch {
      return false;
    }
  }

  /**
   * Force reset (useful for debugging)
   */
  forceReset(): void {
    this.saveCompletions(this.createEmptyStorage());
  }
}

// Export singleton instance
export const completionTracker = new CompletionTracker();
