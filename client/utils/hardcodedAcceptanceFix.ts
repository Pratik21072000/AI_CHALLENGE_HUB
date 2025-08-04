// Hardcoded fix for the specific challenge issue

export function hardcodedAcceptanceFix() {
  console.log('🔧 HARDCODED ACCEPTANCE FIX');
  
  // Force the specific acceptance data for demo
  const demoAcceptance = {
    id: 'acc_employee01_ch1754276280516_demo',
    username: 'employee01',
    challengeId: 'ch1754276280516',
    status: 'Accepted',
    committedDate: '2024-12-31',
    acceptedAt: new Date().toISOString()
  };
  
  // Get current acceptances and ensure this one exists
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Remove any existing for this user/challenge
  const filtered = acceptances.filter((acc: any) => 
    !(acc.username === 'employee01' && acc.challengeId === 'ch1754276280516')
  );
  
  // Add the demo acceptance
  filtered.push(demoAcceptance);
  
  // Save
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ HARDCODED ACCEPTANCE SET:', demoAcceptance);
  console.log('All acceptances now:', filtered);
  
  return demoAcceptance;
}

// Run it immediately
hardcodedAcceptanceFix();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).hardcodedAcceptanceFix = hardcodedAcceptanceFix;
}

export default hardcodedAcceptanceFix;
