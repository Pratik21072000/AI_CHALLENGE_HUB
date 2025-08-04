import { Challenge, UserPointsRecord } from '@shared/types';

export class PointsService {
  private static pointsRecords: UserPointsRecord[] = [];

  /**
   * Calculate points for a challenge based on submission status and timing
   */
  static calculatePoints(
    challenge: Challenge,
    action: 'Approved' | 'Rejected' | 'Needs Rework',
    submissionDate?: string
  ): number {
    // For rejection, always award 0 points
    if (action === 'Rejected') {
      return 0;
    }

    // For needs rework, no points awarded yet
    if (action === 'Needs Rework') {
      return 0;
    }

    // For approval, check timing
    if (action === 'Approved') {
      const fullPoints = challenge.points;
      const penaltyPoints = challenge.penaltyPoints || 0;
      
      // If no committed date or submission date, award full points
      if (!challenge.committedDate || !submissionDate) {
        return fullPoints;
      }

      const committedDate = new Date(challenge.committedDate);
      const actualSubmissionDate = new Date(submissionDate);

      // If submitted on time or early, award full points
      if (actualSubmissionDate <= committedDate) {
        return fullPoints;
      }

      // If submitted late, award (points - penalty)
      const awardedPoints = Math.max(0, fullPoints - penaltyPoints);
      return awardedPoints;
    }

    return 0;
  }

  /**
   * Award points for a challenge review
   */
  static awardPoints(
    userId: string,
    challenge: Challenge,
    action: 'Approved' | 'Rejected' | 'Needs Rework',
    submissionDate?: string
  ): UserPointsRecord {
    const points = this.calculatePoints(challenge, action, submissionDate);
    
    let reason: UserPointsRecord['reason'];
    let description: string;

    switch (action) {
      case 'Approved':
        if (points === challenge.points) {
          reason = 'approval';
          description = `Full points awarded for on-time completion of "${challenge.title}"`;
        } else {
          reason = 'late_submission';
          description = `Reduced points awarded for late submission of "${challenge.title}" (${challenge.penaltyPoints} penalty applied)`;
        }
        break;
      case 'Rejected':
        reason = 'rejection';
        description = `No points awarded - submission rejected for "${challenge.title}"`;
        break;
      default:
        reason = 'approval';
        description = `Points awarded for "${challenge.title}"`;
    }

    const pointsRecord: UserPointsRecord = {
      id: `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      challengeId: challenge.id,
      points,
      reason,
      awardedAt: new Date().toISOString(),
      description
    };

    this.pointsRecords.push(pointsRecord);
    return pointsRecord;
  }

  /**
   * Deduct penalty points for missed deadlines
   */
  static deductPenaltyPoints(
    userId: string,
    challenge: Challenge
  ): UserPointsRecord {
    const penaltyPoints = challenge.penaltyPoints || 0;
    
    const pointsRecord: UserPointsRecord = {
      id: `penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      challengeId: challenge.id,
      points: -penaltyPoints, // Negative points for penalty
      reason: 'no_submission',
      awardedAt: new Date().toISOString(),
      description: `Penalty applied for no submission of "${challenge.title}" by committed date`
    };

    this.pointsRecords.push(pointsRecord);
    return pointsRecord;
  }

  /**
   * Get total points for a user
   */
  static getUserTotalPoints(userId: string): number {
    return this.pointsRecords
      .filter(record => record.userId === userId)
      .reduce((total, record) => total + record.points, 0);
  }

  /**
   * Get points history for a user
   */
  static getUserPointsHistory(userId: string): UserPointsRecord[] {
    return this.pointsRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  }

  /**
   * Get points record for a specific challenge
   */
  static getChallengePointsRecord(userId: string, challengeId: string): UserPointsRecord | undefined {
    return this.pointsRecords.find(
      record => record.userId === userId && record.challengeId === challengeId
    );
  }

  /**
   * Check for expired challenges and apply penalties (backend job simulation)
   */
  static processExpiredChallenges(challenges: Challenge[]): UserPointsRecord[] {
    const now = new Date();
    const penaltyRecords: UserPointsRecord[] = [];

    challenges.forEach(challenge => {
      // Only process accepted challenges that haven't been submitted and have passed their committed date
      if (
        challenge.status === 'Accepted' &&
        challenge.committedDate &&
        challenge.acceptedBy &&
        !challenge.submittedAt
      ) {
        const committedDate = new Date(challenge.committedDate);
        
        // If committed date has passed
        if (now > committedDate) {
          const userId = Array.isArray(challenge.acceptedBy) 
            ? challenge.acceptedBy[0] 
            : challenge.acceptedBy;
          
          // Check if penalty has already been applied
          const existingPenalty = this.pointsRecords.find(
            record => 
              record.challengeId === challenge.id && 
              record.userId === userId && 
              record.reason === 'no_submission'
          );

          if (!existingPenalty && challenge.penaltyPoints && challenge.penaltyPoints > 0) {
            const penaltyRecord = this.deductPenaltyPoints(userId, challenge);
            penaltyRecords.push(penaltyRecord);
          }
        }
      }
    });

    return penaltyRecords;
  }

  /**
   * Get all points records (for admin/debugging)
   */
  static getAllPointsRecords(): UserPointsRecord[] {
    return [...this.pointsRecords];
  }

  /**
   * Clear all points records (for testing)
   */
  static clearAllRecords(): void {
    this.pointsRecords = [];
  }
}
