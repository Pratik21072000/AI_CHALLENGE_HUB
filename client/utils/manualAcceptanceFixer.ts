// Manual acceptance fixer for current session

export function fixCurrentAcceptance(): void {
  console.log('🔧 Manual acceptance fixer running...');
  
  // Get current user
  const userString = localStorage.getItem('challengeHub_user');
  if (!userString) {
    console.log('❌ No user logged in');
    return;
  }
  
  const user = JSON.parse(userString);
  console.log('Current user:', user.username);
  
  // Get challenge ID from current URL
  const currentPath = window.location.pathname;
  const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
  
  if (!challengeMatch) {
    console.log('❌ Not on a challenge page');
    return;
  }
  
  const challengeId = challengeMatch[1];
  console.log('Current challenge:', challengeId);
  
  // Check if acceptance already exists
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const existingAcceptance = acceptances.find((acc: any) => 
    acc.username === user.username && acc.challengeId === challengeId
  );
  
  if (existingAcceptance) {
    console.log('✅ Acceptance already exists:', existingAcceptance);
    return;
  }
  
  console.log('🚨 No acceptance found, creating one...');
  
  // Create new acceptance
  const newAcceptance = {
    id: `acc_${user.username}_${challengeId}_${Date.now()}`,
    username: user.username,
    challengeId: challengeId,
    status: 'Accepted',
    committedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    acceptedAt: new Date().toISOString()
  };
  
  acceptances.push(newAcceptance);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
  
  console.log('✅ Created new acceptance:', newAcceptance);
  
  // Trigger page refresh
  window.location.reload();
}

export function showAcceptanceStatus(): void {
  const userString = localStorage.getItem('challengeHub_user');
  const user = userString ? JSON.parse(userString) : null;
  
  if (!user) {
    console.log('No user logged in');
    return;
  }
  
  const currentPath = window.location.pathname;
  const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
  
  if (!challengeMatch) {
    console.log('Not on a challenge page');
    return;
  }
  
  const challengeId = challengeMatch[1];
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  console.log('📊 ACCEPTANCE STATUS REPORT:');
  console.log('User:', user.username);
  console.log('Challenge:', challengeId);
  console.log('All acceptances:', acceptances);
  console.log('User acceptances:', acceptances.filter((acc: any) => acc.username === user.username));
  console.log('This challenge acceptance:', acceptances.find((acc: any) => 
    acc.username === user.username && acc.challengeId === challengeId
  ));
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).fixCurrentAcceptance = fixCurrentAcceptance;
  (window as any).showAcceptanceStatus = showAcceptanceStatus;
  
  // Removed automatic button creation
}

export default fixCurrentAcceptance;
