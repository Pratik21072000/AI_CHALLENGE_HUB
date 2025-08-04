// Automatic fix for employee03 challenge acceptance

function autoFixEmployee03Acceptance() {
  console.log('🔧 Auto-fixing employee03 acceptance...');
  
  // Check if current user is employee03
  const userStr = localStorage.getItem('challengeHub_user');
  if (!userStr) return;
  
  const user = JSON.parse(userStr);
  if (user.username !== 'employee03') return;
  
  // Check if on a challenge details page
  const currentPath = window.location.pathname;
  const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
  if (!challengeMatch) return;
  
  const challengeId = challengeMatch[1];
  console.log('employee03 viewing challenge:', challengeId);
  
  // Check if acceptance already exists
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const existingAcceptance = acceptances.find((acc: any) => 
    acc.username === 'employee03' && acc.challengeId === challengeId
  );
  
  if (existingAcceptance) {
    console.log('✅ Acceptance already exists for employee03');
    return;
  }
  
  // Check if page shows "Accept Challenge" button (DOM check)
  const acceptButton = document.querySelector('button[class*="bg-blue-600"]');
  const hasAcceptButton = acceptButton && acceptButton.textContent?.includes('Accept Challenge');
  
  if (hasAcceptButton) {
    console.log('🚨 Found "Accept Challenge" button - auto-creating acceptance...');
    
    // Create acceptance record
    const newAcceptance = {
      id: `acc_employee03_${challengeId}_${Date.now()}`,
      username: 'employee03',
      challengeId: challengeId,
      status: 'Accepted',
      committedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acceptedAt: new Date().toISOString()
    };
    
    acceptances.push(newAcceptance);
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
    
    console.log('✅ Auto-created acceptance:', newAcceptance);

    // Trigger context refresh instead of page reload
    const event = new CustomEvent('challengeHub:acceptanceChanged');
    window.dispatchEvent(event);
  }
}

// Run immediately when script loads
setTimeout(autoFixEmployee03Acceptance, 2000);

// Also run when DOM changes (in case of dynamic content)
const observer = new MutationObserver(() => {
  autoFixEmployee03Acceptance();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🚀 Auto-fix for employee03 loaded');

export default autoFixEmployee03Acceptance;
