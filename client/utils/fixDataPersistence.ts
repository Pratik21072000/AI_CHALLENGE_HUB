// Emergency fix for data persistence issues

import { localStorageService } from '@/services/localStorageService';

export class DataPersistenceFix {
  static ensureDataPersistence(): void {
    console.log('🔧 Running data persistence fix...');
    
    // Force initialize localStorage
    localStorageService.getStorageSummary();
    
    // Override storage service methods to use localStorage directly
    const originalAddAcceptance = (window as any).storageService?.addAcceptance;
    const originalUpdateAcceptanceStatus = (window as any).storageService?.updateAcceptanceStatus;
    const originalGetAcceptances = (window as any).storageService?.getAcceptances;
    
    if ((window as any).storageService) {
      // Override with localStorage-first approach
      (window as any).storageService.addAcceptance = (acceptance: any) => {
        console.log('🔧 Fixed addAcceptance called:', acceptance);
        return localStorageService.addAcceptance(acceptance);
      };
      
      (window as any).storageService.updateAcceptanceStatus = (username: string, challengeId: string, status: string) => {
        console.log('🔧 Fixed updateAcceptanceStatus called:', { username, challengeId, status });
        return localStorageService.updateAcceptanceStatus(username, challengeId, status);
      };
      
      (window as any).storageService.getAcceptances = () => {
        return localStorageService.getAcceptances();
      };
      
      (window as any).storageService.getCurrentUser = () => {
        return localStorageService.getCurrentUser();
      };
      
      (window as any).storageService.getUserActiveChallenge = (username: string) => {
        return localStorageService.getUserActiveChallenge(username);
      };
      
      (window as any).storageService.canUserAcceptNewChallenge = (username: string) => {
        return localStorageService.canUserAcceptNewChallenge(username);
      };
      
      console.log('✅ Storage service methods overridden with localStorage-first approach');
    }
    
    // Also make localStorage service available globally for debugging
    (window as any).fixedStorage = localStorageService;
    
    console.log('✅ Data persistence fix applied - use fixedStorage for debugging');
  }
  
  static forceRefreshData(): void {
    console.log('🔄 Force refreshing data from localStorage...');

    // Don't auto-reload - this was causing infinite reload loops
    console.log('✅ Use manual browser refresh if needed');
  }
  
  static debugDataState(): void {
    console.log('🔍 Current data state:');
    localStorageService.getStorageSummary();
    
    const acceptances = localStorageService.getAcceptances();
    const user = localStorageService.getCurrentUser();
    
    console.log('Current user:', user);
    console.log('All acceptances:', acceptances);
    
    if (user) {
      const userAcceptances = acceptances.filter(acc => acc.username === user.username);
      const activeChallenge = localStorageService.getUserActiveChallenge(user.username);
      const canAcceptNew = localStorageService.canUserAcceptNewChallenge(user.username);
      
      console.log('User acceptances:', userAcceptances);
      console.log('Active challenge:', activeChallenge);
      console.log('Can accept new:', canAcceptNew);
    }
  }
}

// Auto-apply fix when loaded
if (import.meta.env.DEV || window.location.hostname.includes('fly.dev')) {
  // Apply fix for both development and production
  setTimeout(() => {
    DataPersistenceFix.ensureDataPersistence();
  }, 1000);
}

// Make it available globally
(window as any).DataPersistenceFix = DataPersistenceFix;

console.log('🔧 Data persistence fix loaded - use DataPersistenceFix methods in console');
