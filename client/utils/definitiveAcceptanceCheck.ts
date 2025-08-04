// Definitive acceptance check that bypasses all other logic

export function getDefinitiveAcceptanceStatus(username: string, challengeId: string): {
  isAccepted: boolean;
  hasSubmitted: boolean;
  status: string;
} {
  console.log('🎯 DEFINITIVE CHECK:', { username, challengeId });
  
  // Direct localStorage check - no dependencies
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  
  // Find user's acceptance for this challenge
  const acceptance = acceptances.find((acc: any) => 
    acc.username === username && acc.challengeId === challengeId
  );
  
  // Find user's submission for this challenge
  const submission = submissions.find((sub: any) => 
    sub.username === username && sub.challengeId === challengeId && sub.submitted
  );
  
  // Determine status
  const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
  const isAccepted = acceptance && activeStatuses.includes(acceptance.status);
  const hasSubmitted = !!submission;
  const status = acceptance?.status || 'Not Accepted';
  
  const result = {
    isAccepted: !!isAccepted,
    hasSubmitted,
    status
  };
  
  console.log('✅ DEFINITIVE RESULT:', result);
  console.log('   Raw acceptance:', acceptance);
  console.log('   Raw submission:', submission);
  
  return result;
}

// Force override function
export function forceAcceptanceOverride(username: string, challengeId: string): void {
  console.log('🚨 FORCING ACCEPTANCE OVERRIDE');
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Remove any existing acceptance
  const filtered = acceptances.filter((acc: any) => 
    !(acc.username === username && acc.challengeId === challengeId)
  );
  
  // Add new acceptance
  const newAcceptance = {
    id: `acc_${username}_${challengeId}_${Date.now()}`,
    username: username,
    challengeId: challengeId,
    status: 'Accepted',
    committedDate: '2024-12-31',
    acceptedAt: new Date().toISOString()
  };
  
  filtered.push(newAcceptance);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ ACCEPTANCE FORCED:', newAcceptance);
  
  // Trigger refresh
  window.location.reload();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).getDefinitiveAcceptanceStatus = getDefinitiveAcceptanceStatus;
  (window as any).forceAcceptanceOverride = forceAcceptanceOverride;
}

export default getDefinitiveAcceptanceStatus;
