// Real-time state synchronization utility

export class StateSynchronizer {
  private static instance: StateSynchronizer;
  private listeners: Set<() => void> = new Set();
  private lastStateHash: string = '';

  static getInstance(): StateSynchronizer {
    if (!StateSynchronizer.instance) {
      StateSynchronizer.instance = new StateSynchronizer();
    }
    return StateSynchronizer.instance;
  }

  private constructor() {
    this.startMonitoring();
  }

  private getStateHash(): string {
    const acceptances = localStorage.getItem('challengeHub_acceptances') || '[]';
    const submissions = localStorage.getItem('challengeHub_submissions') || '[]';
    const reviews = localStorage.getItem('challengeHub_reviews') || '[]';
    
    return btoa(acceptances + submissions + reviews);
  }

  private startMonitoring() {
    // Check for state changes every 100ms
    setInterval(() => {
      const currentHash = this.getStateHash();
      if (currentHash !== this.lastStateHash) {
        console.log('🔄 State change detected - notifying listeners');
        this.lastStateHash = currentHash;
        this.notifyListeners();
      }
    }, 100);

    // Also listen for storage events from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('challengeHub_')) {
        console.log('🔄 Storage event detected:', e.key);
        this.notifyListeners();
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in state sync listener:', error);
      }
    });
  }

  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Force sync localStorage data to contexts
  forceSyncToContexts() {
    console.log('🔄 Force syncing localStorage to contexts...');
    
    // Trigger custom events that contexts can listen to
    window.dispatchEvent(new CustomEvent('challengeHub:forceSync', {
      detail: {
        acceptances: JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]'),
        submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]'),
        reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]')
      }
    }));
  }

  // Get current state summary
  getCurrentState() {
    return {
      acceptances: JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]'),
      submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]'),
      reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]')
    };
  }
}

// Initialize and make available globally
const stateSynchronizer = StateSynchronizer.getInstance();

if (typeof window !== 'undefined') {
  (window as any).stateSynchronizer = stateSynchronizer;
  
  console.log('🔄 State synchronizer initialized - real-time sync active');
}

export default stateSynchronizer;
