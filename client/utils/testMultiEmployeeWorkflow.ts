// Test utility to verify that multiple employees can accept the same challenge independently
import { storageService } from '@/services/storageService';
import type { ChallengeAcceptance } from '@shared/types';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

class MultiEmployeeWorkflowTester {
  
  async testMultipleAcceptance(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    try {
      // Clear existing data to start fresh
      console.log('🧹 Clearing existing test data...');
      storageService.clearAllData();
      
      const testChallengeId = 'challenge_1';
      const employees = ['employee01', 'employee02', 'employee03'];
      
      // Test 1: Multiple employees should be able to accept the same challenge
      console.log('🔬 Test 1: Multiple employees accepting same challenge');
      
      for (const employee of employees) {
        const acceptance: ChallengeAcceptance = {
          id: `acc_${employee}_${testChallengeId}_${Date.now()}`,
          username: employee,
          challengeId: testChallengeId,
          status: 'Accepted',
          committedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          acceptedAt: new Date().toISOString()
        };
        
        const success = storageService.addAcceptance(acceptance);
        
        results.push({
          success,
          message: `${employee} ${success ? 'successfully' : 'failed to'} accept challenge ${testChallengeId}`,
          details: { employee, challengeId: testChallengeId, acceptance }
        });
      }
      
      // Test 2: Verify each employee can only have one active challenge
      console.log('🔬 Test 2: Each employee should only have one active challenge');
      
      for (const employee of employees) {
        const activeChallenge = storageService.getUserActiveChallenge(employee);
        const canAcceptNew = storageService.canUserAcceptNewChallenge(employee);
        
        results.push({
          success: !!activeChallenge && !canAcceptNew,
          message: `${employee} has active challenge: ${!!activeChallenge}, can accept new: ${canAcceptNew}`,
          details: { employee, activeChallenge, canAcceptNew }
        });
      }
      
      // Test 3: Test withdrawal and re-acceptance
      console.log('🔬 Test 3: Withdrawal should allow re-acceptance');
      
      const testEmployee = 'employee01';
      
      // Withdraw employee01 from challenge
      const withdrawSuccess = storageService.updateAcceptanceStatus(testEmployee, testChallengeId, 'Withdrawn');
      results.push({
        success: withdrawSuccess,
        message: `${testEmployee} withdrawal: ${withdrawSuccess ? 'success' : 'failed'}`,
        details: { testEmployee, action: 'withdraw' }
      });
      
      // Check if employee01 can now accept new challenges
      const canAcceptAfterWithdraw = storageService.canUserAcceptNewChallenge(testEmployee);
      results.push({
        success: canAcceptAfterWithdraw,
        message: `${testEmployee} can accept new challenges after withdrawal: ${canAcceptAfterWithdraw}`,
        details: { testEmployee, canAcceptAfterWithdraw }
      });
      
      // Test 4: Test completed status (Approved/Rejected) should allow new acceptance
      console.log('🔬 Test 4: Completed challenges should allow new acceptance');
      
      const testEmployee2 = 'employee02';
      
      // Mark employee02's challenge as approved
      const approveSuccess = storageService.updateAcceptanceStatus(testEmployee2, testChallengeId, 'Approved');
      results.push({
        success: approveSuccess,
        message: `${testEmployee2} challenge approval: ${approveSuccess ? 'success' : 'failed'}`,
        details: { testEmployee2, action: 'approve' }
      });
      
      // Check if employee02 can now accept new challenges
      const canAcceptAfterApprove = storageService.canUserAcceptNewChallenge(testEmployee2);
      results.push({
        success: canAcceptAfterApprove,
        message: `${testEmployee2} can accept new challenges after approval: ${canAcceptAfterApprove}`,
        details: { testEmployee2, canAcceptAfterApprove }
      });
      
      // Test 5: Verify data integrity
      console.log('🔬 Test 5: Data integrity check');
      
      const allAcceptances = storageService.getAcceptances();
      const hasCorrectCount = allAcceptances.length === 3; // Should have 3 acceptances
      
      results.push({
        success: hasCorrectCount,
        message: `Data integrity: ${allAcceptances.length} acceptances found (expected 3)`,
        details: { allAcceptances, expectedCount: 3 }
      });
      
      console.log('✅ Multi-employee workflow test completed');
      
    } catch (error) {
      results.push({
        success: false,
        message: `Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }
    
    return results;
  }
  
  generateTestReport(results: TestResult[]): string {
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    let report = `\n🧪 MULTI-EMPLOYEE WORKFLOW TEST REPORT\n`;
    report += `${'='.repeat(50)}\n`;
    report += `Overall: ${successCount}/${totalTests} tests passed\n\n`;
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      report += `${status} Test ${index + 1}: ${result.message}\n`;
      if (!result.success && result.details) {
        report += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
    });
    
    report += `\n${'='.repeat(50)}\n`;
    
    if (successCount === totalTests) {
      report += `🎉 ALL TESTS PASSED! Multi-employee workflow is working correctly.\n`;
    } else {
      report += `⚠️  ${totalTests - successCount} test(s) failed. Please review the issues above.\n`;
    }
    
    return report;
  }
}

// Export for browser console usage
const tester = new MultiEmployeeWorkflowTester();

// Add to window for easy testing
(window as any).testMultiEmployeeWorkflow = async () => {
  console.log('🚀 Starting multi-employee workflow test...');
  const results = await tester.testMultipleAcceptance();
  const report = tester.generateTestReport(results);
  console.log(report);
  return results;
};

export { MultiEmployeeWorkflowTester };
