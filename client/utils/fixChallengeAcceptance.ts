// Fix challenge acceptance data consistency

export function fixChallengeAcceptance(): void {
  console.log('🔧 Fixing challenge acceptance data consistency...');
  
  // Get current data
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  console.log('Current acceptances:', acceptances);
  
  // Ensure all acceptances have proper structure
  const fixedAcceptances = acceptances.map((acc: any) => ({
    id: acc.id || `acc_${acc.username}_${acc.challengeId}_${Date.now()}`,
    username: acc.username,
    challengeId: acc.challengeId,
    status: acc.status || 'Accepted',
    committedDate: acc.committedDate || '2024-12-31',
    acceptedAt: acc.acceptedAt || new Date().toISOString()
  }));
  
  console.log('Fixed acceptances:', fixedAcceptances);
  
  // Save back to localStorage
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(fixedAcceptances));
  
  console.log('✅ Challenge acceptance data fixed');
}

// Test function to add a test acceptance for current user
export function addTestAcceptance(username: string, challengeId: string): void {
  console.log(`Adding test acceptance for ${username} -> ${challengeId}`);
  
  const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Check if already exists
  const existingIndex = currentAcceptances.findIndex((acc: any) => 
    acc.username === username && acc.challengeId === challengeId
  );
  
  const newAcceptance = {
    id: `acc_${username}_${challengeId}_${Date.now()}`,
    username: username,
    challengeId: challengeId,
    status: 'Accepted',
    committedDate: '2024-12-31',
    acceptedAt: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // Update existing
    currentAcceptances[existingIndex] = newAcceptance;
    console.log('Updated existing acceptance');
  } else {
    // Add new
    currentAcceptances.push(newAcceptance);
    console.log('Added new acceptance');
  }
  
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(currentAcceptances));
  console.log('✅ Test acceptance added/updated');
}

// Validate acceptance data
export function validateAcceptanceData(username: string, challengeId: string): void {
  console.log(`🔍 Validating acceptance data for ${username} -> ${challengeId}`);
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const userAcceptance = acceptances.find((acc: any) => 
    acc.username === username && acc.challengeId === challengeId
  );
  
  console.log('Found acceptance:', userAcceptance);
  
  if (userAcceptance) {
    console.log('✅ Acceptance exists');
    console.log('   Status:', userAcceptance.status);
    console.log('   Active statuses include:', ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(userAcceptance.status));
  } else {
    console.log('❌ No acceptance found');
    console.log('All acceptances:', acceptances);
  }
  
  // Check what storageService would return
  if (typeof window !== 'undefined' && (window as any).storageService) {
    const storageResult = (window as any).storageService.hasUserAcceptedChallenge(username, challengeId);
    console.log('StorageService result:', storageResult);
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).fixChallengeAcceptance = fixChallengeAcceptance;
  (window as any).addTestAcceptance = addTestAcceptance;
  (window as any).validateAcceptanceData = validateAcceptanceData;
}

export default fixChallengeAcceptance;
