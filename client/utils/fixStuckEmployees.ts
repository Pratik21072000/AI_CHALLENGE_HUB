// Utility to fix stuck employee states where they can't accept new challenges
import { storageService } from '@/services/storageService';

class StuckEmployeeFixer {
  
  fixStuckEmployees(usernames: string[] = ['employee02', 'employee03']): void {
    console.log('🔧 Fixing stuck employee states...');
    
    usernames.forEach(username => {
      console.log(`\n🔍 Checking ${username}:`);
      
      // Get all acceptances for this user
      const allAcceptances = storageService.getAcceptances();
      const userAcceptances = allAcceptances.filter(acc => acc.username === username);
      
      console.log(`  - Found ${userAcceptances.length} acceptances`);
      
      userAcceptances.forEach(acc => {
        console.log(`    * ${acc.challengeId}: ${acc.status}`);
        
        // If status is active but should be completed, fix it
        const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
        if (activeStatuses.includes(acc.status)) {
          // Force mark as completed (withdrawn) to free up the user
          const success = storageService.updateAcceptanceStatus(username, acc.challengeId, 'Withdrawn');
          if (success) {
            console.log(`    ✅ Reset ${acc.challengeId} to Withdrawn for ${username}`);
          } else {
            console.log(`    ❌ Failed to reset ${acc.challengeId} for ${username}`);
          }
        }
      });
      
      // Verify the user can now accept new challenges
      const canAcceptNew = storageService.canUserAcceptNewChallenge(username);
      console.log(`  - Can accept new challenges: ${canAcceptNew ? '✅ YES' : '❌ NO'}`);
      
      if (!canAcceptNew) {
        // Force clear by removing all acceptances for this user
        console.log(`  - Force clearing all acceptances for ${username}`);
        const remainingAcceptances = allAcceptances.filter(acc => acc.username !== username);
        localStorage.setItem('challengeHub_acceptances', JSON.stringify(remainingAcceptances));
        console.log(`  ✅ Cleared all acceptances for ${username}`);
      }
    });
    
    console.log('\n🎉 Fixed stuck employee states! Please refresh the page.');
  }
  
  resetAllEmployeeStates(): void {
    console.log('🔧 Resetting ALL employee states...');
    
    // Clear all acceptances
    localStorage.removeItem('challengeHub_acceptances');
    console.log('✅ Cleared all acceptances');
    
    // Clear all submissions  
    localStorage.removeItem('challengeHub_submissions');
    console.log('✅ Cleared all submissions');
    
    // Clear all reviews
    localStorage.removeItem('challengeHub_reviews');
    console.log('✅ Cleared all reviews');
    
    console.log('\n🎉 All employee states reset! Please refresh the page.');
  }
  
  quickDiagnosis(): void {
    const employees = ['employee01', 'employee02', 'employee03'];
    
    console.log('\n🔍 QUICK DIAGNOSIS');
    console.log('='.repeat(40));
    
    employees.forEach(emp => {
      const activeChallenge = storageService.getUserActiveChallenge(emp);
      const canAccept = storageService.canUserAcceptNewChallenge(emp);
      const allAcceptances = storageService.getAcceptances().filter(acc => acc.username === emp);
      
      console.log(`\n${emp}:`);
      console.log(`  Active Challenge: ${activeChallenge ? activeChallenge.challengeId + ' (' + activeChallenge.status + ')' : 'None'}`);
      console.log(`  Can Accept New: ${canAccept ? '✅ Yes' : '❌ No'}`);
      console.log(`  Total Acceptances: ${allAcceptances.length}`);
      
      if (allAcceptances.length > 0) {
        allAcceptances.forEach(acc => {
          console.log(`    - ${acc.challengeId}: ${acc.status}`);
        });
      }
    });
    
    console.log('='.repeat(40));
  }
}

// Create instance and add to window for immediate use
const fixer = new StuckEmployeeFixer();

// Add to window for browser console access
(window as any).fixStuckEmployees = () => fixer.fixStuckEmployees(['employee02', 'employee03']);
(window as any).resetAllEmployees = () => fixer.resetAllEmployeeStates();
(window as any).quickDiagnosis = () => fixer.quickDiagnosis();

// Auto-run diagnosis when loaded
setTimeout(() => {
  console.log('🔧 STUCK EMPLOYEE FIXER LOADED');
  console.log('Available commands:');
  console.log('  fixStuckEmployees() - Fix employee02 and employee03');
  console.log('  resetAllEmployees() - Reset all employee data');
  console.log('  quickDiagnosis() - Check current state');
  console.log('');
  
  // Run automatic diagnosis
  fixer.quickDiagnosis();
}, 1000);

export { StuckEmployeeFixer };
