// Acceptance state monitor to ensure demo reliability

class AcceptanceMonitor {
  private static instance: AcceptanceMonitor;
  private intervalId: NodeJS.Timeout | null = null;

  public static getInstance(): AcceptanceMonitor {
    if (!AcceptanceMonitor.instance) {
      AcceptanceMonitor.instance = new AcceptanceMonitor();
    }
    return AcceptanceMonitor.instance;
  }

  public start() {
    if (this.intervalId) return; // Already running

    console.log('🔄 Starting acceptance monitor for demo reliability');
    
    this.intervalId = setInterval(() => {
      this.checkAndFixAcceptances();
    }, 2000); // Check every 2 seconds
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Stopped acceptance monitor');
    }
  }

  private checkAndFixAcceptances() {
    try {
      // Check if we're on a challenge detail page
      const currentPath = window.location.pathname;
      const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
      
      if (!challengeIdMatch) return;
      
      const challengeId = challengeIdMatch[1];
      
      // Check if user has recent acceptance marker
      const usernames = ['employee01', 'employee02', 'employee03'];
      
      usernames.forEach(username => {
        const hasRecentAcceptance = sessionStorage.getItem(`recentAcceptance_${username}_${challengeId}`);
        
        if (hasRecentAcceptance) {
          // Check if acceptance exists in localStorage
          const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
          const acceptances = JSON.parse(acceptancesStr);
          
          const existing = acceptances.find((acc: any) => 
            acc.username === username && acc.challengeId === challengeId
          );
          
          if (!existing) {
            console.log(`🔧 Monitor: Creating missing acceptance for ${username} on ${challengeId}`);
            
            const newAcceptance = {
              id: `acc_${username}_${challengeId}_${Date.now()}`,
              username,
              challengeId,
              status: 'Accepted',
              committedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              acceptedAt: new Date().toISOString()
            };
            
            acceptances.push(newAcceptance);
            localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
            
            // Trigger events
            window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
            window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
            
            console.log('✅ Monitor: Fixed acceptance for', username);
          }
        }
      });
    } catch (error) {
      console.error('Acceptance monitor error:', error);
    }
  }
}

// Auto-start monitor when imported - DISABLED to prevent infinite loops
const monitor = AcceptanceMonitor.getInstance();
// monitor.start(); // DISABLED - was causing infinite loops after submission

// Make available globally for control
if (typeof window !== 'undefined') {
  (window as any).acceptanceMonitor = monitor;
}

export default AcceptanceMonitor;
