import { apiService } from '@/services/api';

// Simple API test utility for debugging
export async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints...');

  try {
    // Test 1: Get all challenges using our API service
    console.log('1. Testing getAllChallenges()');
    const challenges = await apiService.getAllChallenges();
    console.log('✅ Challenges:', challenges.length, 'found');

    // Test 2: Get specific challenge
    if (challenges.length > 0) {
      const challengeId = challenges[0].id;
      console.log(`2. Testing getChallengeById(${challengeId})`);
      const challenge = await apiService.getChallengeById(challengeId);
      console.log('✅ Challenge details:', challenge.title);

      // Test 3: Get acceptance status (this is the one that was failing)
      console.log(`3. Testing getChallengeAcceptanceStatus(${challengeId})`);
      const status = await apiService.getChallengeAcceptanceStatus(challengeId);
      console.log('✅ Acceptance status:', status);
    }

    console.log('✅ All API tests completed successfully');
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('💡 You can enable emergency fallback mode by running: localStorage.setItem("skipApiCalls", "true")');
  }
}

// Raw fetch test for comparison
export async function testRawFetch() {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;

  console.log('🧪 Testing raw fetch...');

  try {
    const response = await fetch(`${baseUrl}/api/challenges`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Test response cloning
    const clone1 = response.clone();
    const clone2 = response.clone();

    const data1 = await clone1.json();
    const data2 = await clone2.text();

    console.log('✅ Raw fetch test successful');
    console.log('JSON parse:', data1);
    console.log('Text parse:', data2);
  } catch (error) {
    console.error('❌ Raw fetch test failed:', error);
  }
}

// Export for use in browser console
(window as any).testApiEndpoints = testApiEndpoints;
(window as any).testRawFetch = testRawFetch;
(window as any).enableEmergencyMode = () => {
  localStorage.setItem('skipApiCalls', 'true');
  console.log('🚨 Emergency fallback mode enabled');
};
(window as any).disableEmergencyMode = () => {
  localStorage.removeItem('skipApiCalls');
  console.log('✅ Emergency fallback mode disabled');
};
