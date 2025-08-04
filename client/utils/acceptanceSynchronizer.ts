// Acceptance synchronizer to ensure data consistency between dashboard and detail pages

export function synchronizeAcceptanceData(): void {
  console.log('🔄 Synchronizing acceptance data...');
  
  // Listen for acceptance events
  const handleAcceptanceEvent = () => {
    console.log('📡 Acceptance event detected, refreshing in 500ms...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  // Listen for custom events
  window.addEventListener('challengeHub:acceptanceChanged', handleAcceptanceEvent);
  
  // Listen for localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    
    if (key === 'challengeHub_acceptances') {
      console.log('📡 localStorage acceptances changed, triggering sync...');
      const event = new CustomEvent('challengeHub:acceptanceChanged');
      window.dispatchEvent(event);
    }
  };
  
  console.log('✅ Acceptance synchronizer active');
}

// Auto-start synchronizer
synchronizeAcceptanceData();

export default synchronizeAcceptanceData;
