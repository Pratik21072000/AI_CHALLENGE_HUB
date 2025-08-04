// Debug utility to check employee03 acceptances

export function debugEmployee03Acceptances(): void {
  console.log('🔍 DEBUG: employee03 acceptance status');
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const employee03Acceptances = acceptances.filter((acc: any) => acc.username === 'employee03');
  
  console.log('All acceptances:', acceptances);
  console.log('employee03 acceptances:', employee03Acceptances);
  
  // Check what the system thinks is active
  const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
  const activeAcceptances = employee03Acceptances.filter((acc: any) => 
    activeStatuses.includes(acc.status)
  );
  
  console.log('Active acceptances for employee03:', activeAcceptances);
  
  if (activeAcceptances.length > 0) {
    console.log('❌ PROBLEM: employee03 has active acceptances when they should not');
    activeAcceptances.forEach((acc: any) => {
      console.log(`   - Challenge: ${acc.challengeId}, Status: ${acc.status}`);
    });
  } else {
    console.log('✅ employee03 has no active acceptances (correct)');
  }
}

export function cleanEmployee03Acceptances(): void {
  console.log('🧹 Cleaning employee03 acceptances');
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Remove all acceptances for employee03
  const filtered = acceptances.filter((acc: any) => acc.username !== 'employee03');
  
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ Removed all employee03 acceptances');
  console.log('Remaining acceptances:', filtered);
  
  // Refresh page to apply changes
  window.location.reload();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugEmployee03Acceptances = debugEmployee03Acceptances;
  (window as any).cleanEmployee03Acceptances = cleanEmployee03Acceptances;
}

// Auto-run debug on import
debugEmployee03Acceptances();

export default debugEmployee03Acceptances;
