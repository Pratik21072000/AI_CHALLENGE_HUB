// API Troubleshooting Utility - Helps debug and fix API connectivity issues

import { apiHealthMonitor } from './apiHealthMonitor';

class ApiTroubleshoot {
  
  async checkConnectivity(): Promise<{ success: boolean; details: string[] }> {
    const details: string[] = [];
    let success = true;

    try {
      // Test basic connectivity
      details.push('🔄 Testing basic connectivity...');
      const response = await fetch(window.location.origin + '/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        details.push('✅ Basic connectivity: OK');
      } else {
        details.push(`❌ Basic connectivity: Failed (${response.status})`);
        success = false;
      }
    } catch (error) {
      details.push(`❌ Basic connectivity: Failed (${error})`);
      success = false;
    }

    // Check API health monitor status
    const healthStatus = apiHealthMonitor.getStatus();
    details.push(`📊 Health Monitor Status: ${apiHealthMonitor.getStatusMessage()}`);
    details.push(`   - Body Conflicts: ${healthStatus.bodyConflictCount}`);
    details.push(`   - Network Failures: ${healthStatus.networkFailureCount}`);
    details.push(`   - Auto Fallback: ${healthStatus.autoFallbackEnabled ? 'Enabled' : 'Disabled'}`);

    // Check localStorage fallback data
    const challenges = localStorage.getItem('challenges');
    const acceptances = localStorage.getItem('challengeHub_acceptances');
    const submissions = localStorage.getItem('challengeHub_submissions');

    details.push(`💾 localStorage Data:`);
    details.push(`   - Challenges: ${challenges ? JSON.parse(challenges).length : 0} records`);
    details.push(`   - Acceptances: ${acceptances ? JSON.parse(acceptances).length : 0} records`);
    details.push(`   - Submissions: ${submissions ? JSON.parse(submissions).length : 0} records`);

    return { success, details };
  }

  async fixConnectivity(): Promise<{ success: boolean; actions: string[] }> {
    const actions: string[] = [];

    try {
      // Force recovery from health monitor
      actions.push('🔄 Forcing API health recovery...');
      apiHealthMonitor.forceRecovery();
      actions.push('✅ API health monitor reset');

      // Clear any problematic localStorage flags
      localStorage.removeItem('skipApiCalls');
      localStorage.removeItem('apiFallbackUntil');
      actions.push('✅ Cleared API fallback flags');

      // Try to reload challenges
      if ((window as any).reloadChallenges) {
        actions.push('🔄 Attempting to reload challenges...');
        await (window as any).reloadChallenges();
        actions.push('✅ Challenges reloaded successfully');
      }

      return { success: true, actions };
    } catch (error) {
      actions.push(`❌ Fix attempt failed: ${error}`);
      return { success: false, actions };
    }
  }

  showInstructions(): void {
    console.log(`
🔧 API TROUBLESHOOTING GUIDE

Available Commands:
  apiTroubleshoot.check()     - Check connectivity and status
  apiTroubleshoot.fix()       - Attempt automatic fixes
  apiTroubleshoot.manual()    - Show manual troubleshooting steps
  reloadChallenges()          - Manually reload challenge data
  forceApiRecovery()          - Reset API health monitor

Common Issues & Solutions:
  
1. "Failed to fetch" errors:
   - Check network connectivity
   - Run: apiTroubleshoot.fix()
   - Refresh the page

2. Data not updating:
   - Run: reloadChallenges()
   - Check if working offline (cached data)
   
3. API in fallback mode:
   - Run: forceApiRecovery()
   - Wait a few minutes and refresh

4. Persistent issues:
   - Clear browser cache
   - Disable browser extensions
   - Check browser console for specific errors
    `);
  }

  showManualSteps(): void {
    console.log(`
🛠️ MANUAL TROUBLESHOOTING STEPS

1. Check Network Connection:
   - Ensure internet connectivity
   - Try accessing other websites
   - Disable VPN if using one

2. Browser Issues:
   - Clear browser cache (Ctrl+Shift+Del)
   - Disable browser extensions temporarily  
   - Try incognito/private mode
   - Check if CORS is blocked

3. Application Issues:
   - Refresh the page (Ctrl+F5)
   - Check browser console for errors
   - Run apiTroubleshoot.check() for details

4. Development Issues:
   - Check if dev server is running
   - Verify API endpoints are accessible
   - Look for proxy configuration issues

5. Data Issues:
   - App will use cached data when API fails
   - Check localStorage for backup data
   - Force refresh: reloadChallenges()
    `);
  }

  async generateReport(): Promise<string> {
    const { success, details } = await this.checkConnectivity();
    
    const report = `
API TROUBLESHOOTING REPORT
Generated: ${new Date().toLocaleString()}

STATUS: ${success ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}

${details.join('\n')}

BROWSER INFO:
- User Agent: ${navigator.userAgent}
- Online: ${navigator.onLine}
- Location: ${window.location.href}

RECOMMENDATIONS:
${success ? 
  '- System appears healthy\n- Monitor for any intermittent issues' : 
  '- Run apiTroubleshoot.fix() to attempt automatic repair\n- Check network connectivity\n- Review browser console for errors'
}
    `;

    console.log(report);
    return report;
  }
}

// Create global instance
const apiTroubleshoot = new ApiTroubleshoot();

// Export for browser console
(window as any).apiTroubleshoot = {
  check: () => apiTroubleshoot.checkConnectivity().then(result => {
    console.log('📊 CONNECTIVITY CHECK RESULTS:');
    result.details.forEach(detail => console.log(detail));
    return result;
  }),
  fix: () => apiTroubleshoot.fixConnectivity().then(result => {
    console.log('🔧 FIX ATTEMPT RESULTS:');
    result.actions.forEach(action => console.log(action));
    return result;
  }),
  manual: () => apiTroubleshoot.showManualSteps(),
  instructions: () => apiTroubleshoot.showInstructions(),
  report: () => apiTroubleshoot.generateReport()
};

console.log('🔧 API Troubleshooting utility loaded. Type "apiTroubleshoot.instructions()" for help.');

export default apiTroubleshoot;
