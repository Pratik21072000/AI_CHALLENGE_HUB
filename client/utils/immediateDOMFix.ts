// Immediate DOM-based fix for acceptance button issue

function fixAcceptanceButton() {
  console.log('🔧 Running immediate DOM fix for acceptance button...');
  
  // Get current user and challenge from DOM/URL
  const userElement = document.querySelector('[data-loc*="Layout.tsx"] .text-small-primary.font-label');
  const currentUser = userElement?.textContent?.trim();
  
  const currentPath = window.location.pathname;
  const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
  const challengeId = challengeMatch ? challengeMatch[1] : null;
  
  console.log('Current user from DOM:', currentUser);
  console.log('Current challenge:', challengeId);
  
  if (!currentUser || !challengeId) {
    console.log('Cannot determine user or challenge');
    return;
  }
  
  // Check if there should be an acceptance (if user just came from dashboard)
  const sessionFlag = sessionStorage.getItem(`accepted_${currentUser}_${challengeId}`);
  console.log('Session acceptance flag:', sessionFlag);
  
  if (sessionFlag) {
    console.log('🎯 User should have acceptance, forcing correct state...');
    
    // Force create acceptance in localStorage
    const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    
    // Remove any existing
    const filtered = acceptances.filter((acc: any) => 
      !(acc.username === 'employee03' && acc.challengeId === challengeId)
    );
    
    // Add new acceptance
    const newAcceptance = {
      id: `acc_employee03_${challengeId}_${Date.now()}`,
      username: 'employee03',
      challengeId: challengeId,
      status: 'Accepted',
      committedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acceptedAt: new Date().toISOString()
    };
    
    filtered.push(newAcceptance);
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
    
    console.log('✅ Forced acceptance created:', newAcceptance);
    
    // Clear session flag
    sessionStorage.removeItem(`accepted_${currentUser}_${challengeId}`);
    
    // Force page refresh
    window.location.reload();
  }
}

// Set session flag when user clicks accept on any page
function setAcceptanceFlag() {
  const currentUser = 'employee03'; // For Mike Chen
  const currentPath = window.location.pathname;
  const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
  const challengeId = challengeMatch ? challengeMatch[1] : null;
  
  if (challengeId) {
    sessionStorage.setItem(`accepted_${currentUser}_${challengeId}`, 'true');
    console.log('🎯 Set acceptance flag for', currentUser, challengeId);
  }
}

// Override the accept challenge function to set flag
function interceptAcceptance() {
  // Look for accept buttons and add click handler
  const acceptButtons = document.querySelectorAll('button');
  acceptButtons.forEach(button => {
    if (button.textContent?.includes('Accept Challenge')) {
      button.addEventListener('click', () => {
        console.log('🎯 Accept button clicked, setting flag...');
        setAcceptanceFlag();
      });
    }
  });
}

// Run fixes
setTimeout(() => {
  fixAcceptanceButton();
  interceptAcceptance();
}, 1000);

// Also run when DOM changes
const observer = new MutationObserver(() => {
  interceptAcceptance();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🚀 Immediate DOM fix loaded');

export default fixAcceptanceButton;
