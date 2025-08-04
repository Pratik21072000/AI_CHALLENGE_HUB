import { storageService } from '@/services/storageService';
import { ChallengeAcceptance } from '@shared/types';

export class AcceptanceDebugger {
  static debugUserAcceptances(username: string) {
    console.log(`🔍 Debugging acceptances for ${username}:`);
    
    // Get all acceptances
    const allAcceptances = storageService.getAcceptances();
    const userAcceptances = allAcceptances.filter(acc => acc.username === username);
    
    console.log('All acceptances:', allAcceptances);
    console.log('User acceptances:', userAcceptances);
    
    // Check localStorage directly
    const localStorageData = localStorage.getItem('challengeHub_acceptances');
    if (localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData);
        console.log('LocalStorage acceptances:', parsed);
      } catch (e) {
        console.error('Error parsing localStorage acceptances:', e);
      }
    }
    
    // Check storage service active challenge detection
    const activeChallenge = storageService.getUserActiveChallenge(username);
    const canAcceptNew = storageService.canUserAcceptNewChallenge(username);
    
    console.log('Active challenge from storage:', activeChallenge);
    console.log('Can accept new from storage:', canAcceptNew);
    
    return {
      allAcceptances,
      userAcceptances,
      activeChallenge,
      canAcceptNew
    };
  }
  
  static clearUserAcceptances(username: string) {
    console.log(`🧹 Clearing all acceptances for ${username}...`);
    
    const allAcceptances = storageService.getAcceptances();
    const filteredAcceptances = allAcceptances.filter(acc => acc.username !== username);
    
    // Update localStorage
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(filteredAcceptances));
    
    console.log(`✅ Cleared ${allAcceptances.length - filteredAcceptances.length} acceptances for ${username}`);
    
    // Trigger a page refresh to reload contexts
    window.location.reload();
  }
  
  static clearAllAcceptances() {
    console.log('🧹 Clearing ALL acceptances...');
    localStorage.removeItem('challengeHub_acceptances');
    console.log('✅ All acceptances cleared');
    
    // Trigger a page refresh to reload contexts
    window.location.reload();
  }
}

// Make it available globally for debugging
(window as any).AcceptanceDebugger = AcceptanceDebugger;

console.log('🔧 AcceptanceDebugger loaded. Use window.AcceptanceDebugger in console to debug.');
