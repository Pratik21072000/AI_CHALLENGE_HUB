// API Health Monitor - Detects and handles persistent API issues

interface ApiHealthStatus {
  bodyConflictCount: number;
  lastBodyConflict: number;
  networkFailureCount: number;
  lastNetworkFailure: number;
  isHealthy: boolean;
  autoFallbackEnabled: boolean;
}

class ApiHealthMonitor {
  private status: ApiHealthStatus = {
    bodyConflictCount: 0,
    lastBodyConflict: 0,
    networkFailureCount: 0,
    lastNetworkFailure: 0,
    isHealthy: true,
    autoFallbackEnabled: false
  };

  private readonly MAX_BODY_CONFLICTS = 3;
  private readonly MAX_NETWORK_FAILURES = 2;
  private readonly CONFLICT_RESET_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly FALLBACK_DURATION = 10 * 60 * 1000; // 10 minutes

  recordBodyConflict() {
    const now = Date.now();

    // Reset count if enough time has passed since last conflict
    if (now - this.status.lastBodyConflict > this.CONFLICT_RESET_TIME) {
      this.status.bodyConflictCount = 0;
    }

    this.status.bodyConflictCount++;
    this.status.lastBodyConflict = now;

    console.log(`🚨 Body conflict #${this.status.bodyConflictCount} detected`);

    // Enable auto-fallback if too many conflicts
    if (this.status.bodyConflictCount >= this.MAX_BODY_CONFLICTS) {
      this.enableAutoFallback();
    }
  }

  recordNetworkFailure() {
    const now = Date.now();

    // Reset count if enough time has passed since last failure
    if (now - this.status.lastNetworkFailure > this.CONFLICT_RESET_TIME) {
      this.status.networkFailureCount = 0;
    }

    this.status.networkFailureCount++;
    this.status.lastNetworkFailure = now;

    console.log(`🌐 Network failure #${this.status.networkFailureCount} detected`);

    // Enable auto-fallback if too many network failures
    if (this.status.networkFailureCount >= this.MAX_NETWORK_FAILURES) {
      this.enableAutoFallback();
    }
  }

  private enableAutoFallback() {
    this.status.autoFallbackEnabled = true;
    this.status.isHealthy = false;
    
    console.log('🚨 Too many body conflicts detected. Enabling auto-fallback mode for 10 minutes.');
    localStorage.setItem('skipApiCalls', 'true');
    localStorage.setItem('apiFallbackUntil', String(Date.now() + this.FALLBACK_DURATION));
    
    // Auto-recovery
    setTimeout(() => {
      this.recoverFromFallback();
    }, this.FALLBACK_DURATION);
  }

  private recoverFromFallback() {
    this.status.autoFallbackEnabled = false;
    this.status.isHealthy = true;
    this.status.bodyConflictCount = 0;
    this.status.networkFailureCount = 0;

    localStorage.removeItem('skipApiCalls');
    localStorage.removeItem('apiFallbackUntil');

    console.log('✅ API health monitor: Attempting recovery from fallback mode');
  }

  shouldSkipApiCalls(): boolean {
    // Check if we're in manual fallback mode
    const manualSkip = localStorage.getItem('skipApiCalls') === 'true';
    
    // Check if we're in timed fallback mode
    const fallbackUntilStr = localStorage.getItem('apiFallbackUntil');
    const timedSkip = fallbackUntilStr && Date.now() < parseInt(fallbackUntilStr);
    
    return manualSkip || !!timedSkip || this.status.autoFallbackEnabled;
  }

  getStatus(): ApiHealthStatus {
    return { ...this.status };
  }

  forceRecovery() {
    console.log('🔄 Forcing API health recovery');
    this.recoverFromFallback();
  }

  getStatusMessage(): string {
    if (this.status.autoFallbackEnabled) {
      const bodyConflicts = this.status.bodyConflictCount > 0 ? `${this.status.bodyConflictCount} body conflicts` : '';
      const networkFailures = this.status.networkFailureCount > 0 ? `${this.status.networkFailureCount} network failures` : '';
      const reasons = [bodyConflicts, networkFailures].filter(Boolean).join(' and ');
      return `Auto-fallback enabled due to ${reasons}`;
    }
    if (!this.status.isHealthy) {
      return 'API experiencing issues';
    }
    return 'API healthy';
  }
}

// Global instance
export const apiHealthMonitor = new ApiHealthMonitor();

// Export for browser console debugging
(window as any).apiHealthMonitor = apiHealthMonitor;
(window as any).forceApiRecovery = () => apiHealthMonitor.forceRecovery();
