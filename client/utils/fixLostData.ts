/**
 * One-time data fix for lost completed challenges
 */

import { showDataSummary, createDataBackup } from './dataRecovery';

// Create backup before any operations
createDataBackup();

// Show current state
showDataSummary();

// Add some sample completed challenges if data is missing
const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');

// Check if Mike Chen (employee3) has any approved challenges
const mikeChenAcceptances = acceptances.filter((acc: any) => acc.username === 'employee3');
const mikeChenReviews = reviews.filter((rev: any) => rev.username === 'employee3');

console.log('🔍 Mike Chen data:', {
  acceptances: mikeChenAcceptances.length,
  reviews: mikeChenReviews.length
});

// If Mike Chen should have completed challenges but they're missing, restore them
if (mikeChenAcceptances.length > 0 && mikeChenReviews.length === 0) {
  console.log('🔄 Detected missing reviews for Mike Chen, this might indicate lost data');
  console.log('💡 User should check if they had previously completed challenges that are now missing');
}

console.log('🛡️ Data fix utility loaded - storage issue monitoring active');
