// Immediate execution of localStorage fix for stuck employees
import { storageService } from '@/services/storageService';

// Execute the fix immediately when this file loads
console.log('🔧 EXECUTING IMMEDIATE STORAGE FIX...');

// Function to fix the current state
function executeImmediateFix() {
  try {
    console.log('📋 Current localStorage state:');
    
    // Check current acceptances
    const allAcceptances = storageService.getAcceptances();
    console.log('Total acceptances found:', allAcceptances.length);
    
    // Show current problematic acceptances
    allAcceptances.forEach(acc => {
      console.log(`  - ${acc.username}: ${acc.challengeId} (${acc.status})`);
    });
    
    // Focus on employee02 and employee03 who are stuck
    const problematicUsers = ['employee02', 'employee03'];
    
    problematicUsers.forEach(username => {
      console.log(`\n🔧 Fixing ${username}:`);
      
      const userAcceptances = allAcceptances.filter(acc => acc.username === username);
      console.log(`  Found ${userAcceptances.length} acceptances for ${username}`);
      
      userAcceptances.forEach(acc => {
        const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
        if (activeStatuses.includes(acc.status)) {
          console.log(`  ❌ Problematic: ${acc.challengeId} (${acc.status})`);
          
          // Force update to Withdrawn status
          const success = storageService.updateAcceptanceStatus(username, acc.challengeId, 'Withdrawn');
          if (success) {
            console.log(`  ✅ Fixed: Set ${acc.challengeId} to Withdrawn`);
          } else {
            console.log(`  ❌ Failed to fix ${acc.challengeId}`);
          }
        }
      });
      
      // Verify the fix
      const canAcceptAfterFix = storageService.canUserAcceptNewChallenge(username);
      console.log(`  Final status: Can accept new challenges = ${canAcceptAfterFix ? '✅ YES' : '❌ NO'}`);
      
      // If still can't accept, do nuclear option
      if (!canAcceptAfterFix) {
        console.log(`  🔥 Nuclear option: Clearing all acceptances for ${username}`);
        const cleanedAcceptances = allAcceptances.filter(acc => acc.username !== username);
        localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));
        console.log(`  ✅ Cleared all data for ${username}`);
      }
    });
    
    console.log('\n🎉 Fix completed! The page should refresh automatically...');
    
    // Force a page refresh to reload the clean state
    setTimeout(() => {
      console.log('🔄 Refreshing page to apply changes...');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    
    // Fallback: Complete reset
    console.log('🔥 Fallback: Complete localStorage reset');
    localStorage.removeItem('challengeHub_acceptances');
    localStorage.removeItem('challengeHub_submissions');
    localStorage.removeItem('challengeHub_reviews');
    
    console.log('✅ Complete reset done. Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Execute immediately
executeImmediateFix();

// Also expose for manual execution if needed
(window as any).executeStorageFix = executeImmediateFix;

export { executeImmediateFix };
