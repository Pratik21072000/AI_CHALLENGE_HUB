// Debug utility for Challenge portal functionality
import { storageService } from '@/services/storageService';

interface UserDebugInfo {
  username: string;
  acceptances: any[];
  activeChallenge: any;
  canAcceptNew: boolean;
  submissions: any[];
  reviews: any[];
}

class ChallengeDebugger {
  
  debugUser(username: string): UserDebugInfo {
    const acceptances = storageService.getAcceptances().filter(acc => acc.username === username);
    const activeChallenge = storageService.getUserActiveChallenge(username);
    const canAcceptNew = storageService.canUserAcceptNewChallenge(username);
    
    // Get submissions from localStorage
    const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]')
      .filter((sub: any) => sub.username === username);
    
    // Get reviews from localStorage
    const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]')
      .filter((rev: any) => rev.username === username);
    
    return {
      username,
      acceptances,
      activeChallenge,
      canAcceptNew,
      submissions,
      reviews
    };
  }
  
  debugAllUsers(): UserDebugInfo[] {
    const users = ['employee01', 'employee02', 'employee03', 'manager01'];
    return users.map(user => this.debugUser(user));
  }
  
  printUserDebug(username: string): void {
    const info = this.debugUser(username);
    
    console.log(`\n🔍 DEBUG INFO FOR ${username.toUpperCase()}`);
    console.log('='.repeat(40));
    console.log('Acceptances:', info.acceptances.length);
    info.acceptances.forEach((acc, i) => {
      console.log(`  ${i + 1}. ${acc.challengeId}: ${acc.status} (${acc.acceptedAt})`);
    });
    
    console.log('\nActive Challenge:', info.activeChallenge ? 
      `${info.activeChallenge.challengeId} (${info.activeChallenge.status})` : 'None');
    
    console.log('Can Accept New:', info.canAcceptNew ? '✅ Yes' : '❌ No');
    
    console.log('\nSubmissions:', info.submissions.length);
    info.submissions.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.challengeId}: ${sub.status} (${sub.submittedAt})`);
    });
    
    console.log('\nReviews:', info.reviews.length);
    info.reviews.forEach((rev, i) => {
      console.log(`  ${i + 1}. ${rev.challengeId}: ${rev.status} (${rev.submissionDate})`);
    });
    
    console.log('='.repeat(40));
  }
  
  printSystemOverview(): void {
    console.log('\n🌐 SYSTEM OVERVIEW');
    console.log('='.repeat(50));
    
    const allAcceptances = storageService.getAcceptances();
    const allSubmissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
    const allReviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
    
    console.log('Total Acceptances:', allAcceptances.length);
    console.log('Total Submissions:', allSubmissions.length);
    console.log('Total Reviews:', allReviews.length);
    
    // Group by challenge
    const challengeGroups = allAcceptances.reduce((groups: any, acc) => {
      if (!groups[acc.challengeId]) {
        groups[acc.challengeId] = {
          acceptances: [],
          submissions: [],
          reviews: []
        };
      }
      groups[acc.challengeId].acceptances.push(acc);
      return groups;
    }, {});
    
    // Add submissions and reviews to groups
    allSubmissions.forEach((sub: any) => {
      if (challengeGroups[sub.challengeId]) {
        challengeGroups[sub.challengeId].submissions.push(sub);
      }
    });
    
    allReviews.forEach((rev: any) => {
      if (challengeGroups[rev.challengeId]) {
        challengeGroups[rev.challengeId].reviews.push(rev);
      }
    });
    
    console.log('\nChallenge Breakdown:');
    Object.entries(challengeGroups).forEach(([challengeId, data]: [string, any]) => {
      console.log(`\n📋 ${challengeId}:`);
      console.log(`  Acceptances: ${data.acceptances.length}`);
      console.log(`  Submissions: ${data.submissions.length}`);
      console.log(`  Reviews: ${data.reviews.length}`);
      
      data.acceptances.forEach((acc: any) => {
        console.log(`    - ${acc.username}: ${acc.status}`);
      });
    });
    
    console.log('='.repeat(50));
  }
  
  fixCommonIssues(): void {
    console.log('🔧 Running automated fixes...');
    
    const allAcceptances = storageService.getAcceptances();
    let fixCount = 0;
    
    // Fix missing IDs
    allAcceptances.forEach(acc => {
      if (!acc.id) {
        acc.id = `acc_${acc.username}_${acc.challengeId}_${Date.now()}`;
        fixCount++;
      }
    });
    
    if (fixCount > 0) {
      localStorage.setItem('challengeHub_acceptances', JSON.stringify(allAcceptances));
      console.log(`✅ Fixed ${fixCount} missing acceptance IDs`);
    }
    
    console.log('🔧 Automated fixes completed');
  }
}

// Export for browser console usage
const challengeDebugger = new ChallengeDebugger();

// Add to window for easy debugging
(window as any).debugUser = (username: string) => challengeDebugger.printUserDebug(username);
(window as any).debugSystem = () => challengeDebugger.printSystemOverview();
(window as any).debugAllUsers = () => {
  challengeDebugger.debugAllUsers().forEach(info => {
    challengeDebugger.printUserDebug(info.username);
  });
};
(window as any).fixChallengeIssues = () => challengeDebugger.fixCommonIssues();

export { ChallengeDebugger };
