// Data sync utility for transferring data between devices
import { storageService } from '@/services/storageService';

class DataSyncUtility {
  
  exportAllData(): string {
    const data = {
      acceptances: storageService.getAcceptances(),
      submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]'),
      reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]'),
      user: storageService.getCurrentUser(),
      timestamp: new Date().toISOString()
    };
    
    const exportString = JSON.stringify(data, null, 2);
    
    console.log('📤 Data exported successfully');
    console.log('Copy this data to transfer to another device:');
    console.log('='.repeat(50));
    console.log(exportString);
    console.log('='.repeat(50));
    
    // Also download as file
    this.downloadAsFile(exportString);
    
    return exportString;
  }
  
  importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      
      // Validate data structure
      if (!data.acceptances || !Array.isArray(data.acceptances)) {
        throw new Error('Invalid data format: missing acceptances');
      }
      
      // Import all data
      localStorage.setItem('challengeHub_acceptances', JSON.stringify(data.acceptances));
      localStorage.setItem('challengeHub_submissions', JSON.stringify(data.submissions || []));
      localStorage.setItem('challengeHub_reviews', JSON.stringify(data.reviews || []));
      
      if (data.user) {
        localStorage.setItem('challengeHub_user', JSON.stringify(data.user));
      }
      
      console.log('📥 Data imported successfully');
      console.log(`  - ${data.acceptances.length} acceptances`);
      console.log(`  - ${(data.submissions || []).length} submissions`);
      console.log(`  - ${(data.reviews || []).length} reviews`);
      console.log(`  - Imported at: ${data.timestamp}`);
      
      // Refresh page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Import failed:', error);
      return false;
    }
  }
  
  downloadAsFile(data: string): void {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `challenge-hub-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 Data also saved as file for download');
  }
  
  syncStatus(): void {
    const acceptances = storageService.getAcceptances();
    const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
    const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
    const user = storageService.getCurrentUser();
    
    console.log('\n📊 CURRENT DEVICE DATA STATUS');
    console.log('='.repeat(40));
    console.log(`Current User: ${user?.displayName || 'None'} (${user?.username || 'None'})`);
    console.log(`Acceptances: ${acceptances.length}`);
    console.log(`Submissions: ${submissions.length}`);
    console.log(`Reviews: ${reviews.length}`);
    
    // Show breakdown by user
    const userBreakdown = acceptances.reduce((breakdown: any, acc) => {
      if (!breakdown[acc.username]) {
        breakdown[acc.username] = { acceptances: 0, submissions: 0, reviews: 0 };
      }
      breakdown[acc.username].acceptances++;
      return breakdown;
    }, {});
    
    submissions.forEach((sub: any) => {
      if (userBreakdown[sub.username]) {
        userBreakdown[sub.username].submissions++;
      }
    });
    
    reviews.forEach((rev: any) => {
      if (userBreakdown[rev.username]) {
        userBreakdown[rev.username].reviews++;
      }
    });
    
    console.log('\nUser Breakdown:');
    Object.entries(userBreakdown).forEach(([username, data]: [string, any]) => {
      console.log(`  ${username}: ${data.acceptances}A ${data.submissions}S ${data.reviews}R`);
    });
    
    console.log('='.repeat(40));
  }
}

// Create instance and add to window
const syncUtil = new DataSyncUtility();

// Add to window for browser console access
(window as any).exportData = () => syncUtil.exportAllData();
(window as any).importData = (dataString: string) => syncUtil.importData(dataString);
(window as any).syncStatus = () => syncUtil.syncStatus();

// Show available commands
console.log('\n🔄 DATA SYNC UTILITY LOADED');
console.log('Available commands:');
console.log('  exportData() - Export all data from this device');
console.log('  importData("...") - Import data from another device');
console.log('  syncStatus() - Check current device data status');

export { DataSyncUtility };
