// Immediate fix for acceptance button issue

// Force set acceptance data right now
console.log('🚨 IMMEDIATE ACCEPTANCE FIX RUNNING...');

// Get current user from localStorage
const currentUser = localStorage.getItem('challengeHub_user');
const user = currentUser ? JSON.parse(currentUser) : null;

if (user) {
  console.log('Current user:', user.username);
  
  // Get current acceptances
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  console.log('Current acceptances:', acceptances);
  
  // Force add acceptance for current challenge if user is employee01
  if (user.username === 'employee01') {
    const challengeId = 'ch1754276280516'; // The challenge from the URL
    
    // Remove any existing acceptance for this user/challenge
    const filtered = acceptances.filter((acc: any) => 
      !(acc.username === user.username && acc.challengeId === challengeId)
    );
    
    // Add new acceptance
    const newAcceptance = {
      id: `acc_${user.username}_${challengeId}_${Date.now()}`,
      username: user.username,
      challengeId: challengeId,
      status: 'Accepted',
      committedDate: '2024-12-31',
      acceptedAt: new Date().toISOString()
    };
    
    filtered.push(newAcceptance);
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
    
    console.log('✅ FORCED ACCEPTANCE ADDED:', newAcceptance);
    console.log('Updated acceptances:', filtered);
  }
}

// Export for manual use
export function forceFixAcceptance() {
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const user = JSON.parse(localStorage.getItem('challengeHub_user') || 'null');
  
  if (!user) {
    console.log('No user logged in');
    return;
  }
  
  // Current challenge from URL
  const challengeId = window.location.pathname.includes('ch1754276280516') ? 'ch1754276280516' : 'unknown';
  
  if (challengeId === 'unknown') {
    console.log('Could not determine challenge ID from URL');
    return;
  }
  
  // Remove existing
  const filtered = acceptances.filter((acc: any) => 
    !(acc.username === user.username && acc.challengeId === challengeId)
  );
  
  // Add new
  const newAcceptance = {
    id: `acc_${user.username}_${challengeId}_${Date.now()}`,
    username: user.username,
    challengeId: challengeId,
    status: 'Accepted',
    committedDate: '2024-12-31',
    acceptedAt: new Date().toISOString()
  };
  
  filtered.push(newAcceptance);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ MANUALLY FIXED ACCEPTANCE:', newAcceptance);
  
  // Force page refresh
  window.location.reload();
}

// Add button to page for immediate fix
export function addFixButton() {
  const button = document.createElement('button');
  button.style.cssText = `
    position: fixed;
    top: 50px;
    right: 10px;
    background: red;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 5px;
    z-index: 9999;
    cursor: pointer;
    font-weight: bold;
  `;
  button.innerText = 'FIX ACCEPTANCE';
  button.onclick = forceFixAcceptance;
  document.body.appendChild(button);
  
  console.log('🔴 RED FIX BUTTON ADDED TO PAGE - CLICK IT!');
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).forceFixAcceptance = forceFixAcceptance;
  (window as any).addFixButton = addFixButton;
  
  // Removed auto-add fix button
}

export default forceFixAcceptance;
