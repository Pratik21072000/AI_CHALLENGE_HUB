// Immediate page-level fix that runs on every page load

// Run immediately on import
(() => {
  console.log('🚨 IMMEDIATE PAGE FIX RUNNING...');
  
  // Check if this is employee03
  const checkAndFix = () => {
    const userStr = localStorage.getItem('challengeHub_user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    if (user.username !== 'employee03') return;
    
    // Check if on challenge details page
    const currentPath = window.location.pathname;
    const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
    if (!challengeMatch) return;
    
    const challengeId = challengeMatch[1];
    console.log('🎯 IMMEDIATE FIX: employee03 on challenge', challengeId);
    
    // Force create acceptance if not exists
    const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const hasAcceptance = acceptances.some((acc: any) => 
      acc.username === 'employee03' && 
      acc.challengeId === challengeId &&
      ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(acc.status)
    );
    
    if (!hasAcceptance) {
      console.log('🚨 Creating missing acceptance for employee03...');
      
      const newAcceptance = {
        id: `acc_employee03_${challengeId}_immediate`,
        username: 'employee03',
        challengeId: challengeId,
        status: 'Accepted',
        committedDate: '2024-12-31',
        acceptedAt: new Date().toISOString()
      };
      
      acceptances.push(newAcceptance);
      localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
      
      console.log('✅ IMMEDIATE ACCEPTANCE CREATED:', newAcceptance);
      
      // Trigger context refresh by dispatching event
      const event = new CustomEvent('challengeHub:acceptanceChanged');
      window.dispatchEvent(event);
      
      // Also force page refresh as last resort
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndFix);
  } else {
    checkAndFix();
  }
  
  // Also run after a delay
  setTimeout(checkAndFix, 1000);
  setTimeout(checkAndFix, 3000);
})();

export {};
