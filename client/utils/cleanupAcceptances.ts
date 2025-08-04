import { storageService } from '@/services/storageService';

export function cleanupStaleAcceptances(username: string) {
  console.log(`🧹 Cleaning up stale acceptances for ${username}...`);
  
  const allAcceptances = storageService.getAcceptances();
  const userAcceptances = allAcceptances.filter(acc => acc.username === username);
  
  console.log(`Found ${userAcceptances.length} acceptances for ${username}:`, userAcceptances);
  
  // Remove acceptances that are in 'Accepted' state but have no corresponding submission
  // and were created recently (likely false positives)
  const submissions = storageService.getSubmissions();
  const userSubmissions = submissions.filter(sub => sub.username === username);
  
  const problematicAcceptances = userAcceptances.filter(acc => {
    const hasSubmission = userSubmissions.some(sub => 
      sub.challengeId === acc.challengeId && sub.username === acc.username
    );
    
    const acceptedAt = new Date(acc.acceptedAt);
    const now = new Date();
    const hoursAgo = (now.getTime() - acceptedAt.getTime()) / (1000 * 60 * 60);
    
    // Flag as problematic if:
    // - Status is 'Accepted' but no submission exists
    // - Created within last 24 hours (recent activity)
    return acc.status === 'Accepted' && !hasSubmission && hoursAgo < 24;
  });
  
  if (problematicAcceptances.length > 0) {
    console.log(`🔧 Found ${problematicAcceptances.length} problematic acceptances to clean:`, problematicAcceptances);
    
    // Remove problematic acceptances
    const cleanedAcceptances = allAcceptances.filter(acc => 
      !problematicAcceptances.some(prob => 
        prob.username === acc.username && prob.challengeId === acc.challengeId
      )
    );
    
    // Update localStorage
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));
    
    console.log(`✅ Cleaned up ${problematicAcceptances.length} stale acceptances for ${username}`);
    return true;
  } else {
    console.log(`✅ No problematic acceptances found for ${username}`);
    return false;
  }
}

// Auto-run cleanup for current user if in development
if (import.meta.env.DEV) {
  // Make it available globally
  (window as any).cleanupStaleAcceptances = cleanupStaleAcceptances;
  
  console.log('🔧 cleanupStaleAcceptances() available in console for debugging');
}
