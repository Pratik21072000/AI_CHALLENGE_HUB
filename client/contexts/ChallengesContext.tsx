import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Challenge, ChallengeStatus, UserPointsRecord } from '@shared/types';
import { PointsService } from '@/services/PointsService';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface ChallengeFormData {
  title: string;
  description: string;
  expectedOutcome: string;
  techStack: string[];
  points: number;
  penaltyPoints?: number;
}

interface ChallengesContextType {
  challenges: Challenge[];
  loading: boolean;
  addChallenge: (challenge: Challenge) => void;
  createChallenge: (challengeData: ChallengeFormData) => void;
  updateChallenge: (id: string, updatedChallenge: Partial<Challenge>) => void;
  getChallenge: (id: string) => Challenge | undefined;
  acceptChallenge: (challengeId: string, userId: string, committedDate: string) => void;
  reviewChallenge: (challengeId: string, action: 'Approved' | 'Rejected' | 'Needs Rework', reviewerId: string, comment?: string) => UserPointsRecord | null;
  processExpiredChallenges: () => UserPointsRecord[];
  getUserPoints: (userId: string) => number;
  getUserPointsHistory: (userId: string) => UserPointsRecord[];
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

// Helper function to sort challenges by latest first
const sortChallengesByLatest = (challenges: Challenge[]): Challenge[] => {
  const sorted = [...challenges].sort((a, b) => {
    // Priority: lastUpdated > createdAt > current time (for fallback)
    const getTimestamp = (challenge: Challenge): number => {
      if (challenge.lastUpdated) {
        const lastUpdatedTime = new Date(challenge.lastUpdated).getTime();
        if (!isNaN(lastUpdatedTime)) return lastUpdatedTime;
      }
      if (challenge.createdAt) {
        const createdTime = new Date(challenge.createdAt).getTime();
        if (!isNaN(createdTime)) return createdTime;
      }
      // Fallback to current time for challenges without timestamps
      return Date.now();
    };

    const timestampA = getTimestamp(a);
    const timestampB = getTimestamp(b);

    // Sort in descending order (latest first)
    return timestampB - timestampA;
  });

  console.log('🔄 Sorted challenges by latest first:', sorted.map((c, index) => ({
    position: index + 1,
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    lastUpdated: c.lastUpdated,
    sortTimestamp: new Date(c.lastUpdated || c.createdAt || Date.now()).toISOString()
  })));

  return sorted;
};

export function ChallengesProvider({ children }: { children: ReactNode }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load challenges from localStorage first, then sync with API
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);

        // ALWAYS load from localStorage first for immediate display
        const storedChallenges = localStorage.getItem('challengeHub_challenges');
        if (storedChallenges) {
          try {
            const parsed = JSON.parse(storedChallenges);
            const sortedChallenges = sortChallengesByLatest(parsed);
            setChallenges(sortedChallenges);
            console.log('✅ Loaded challenges from localStorage (immediate):', sortedChallenges.length, 'records');
          } catch (parseError) {
            console.error('Error parsing localStorage challenges:', parseError);
          }
        }

        // If no localStorage data, load mock data for demo
        if (!storedChallenges) {
          const { mockChallenges } = await import('@/data/mockData');
          const sortedChallenges = sortChallengesByLatest(mockChallenges);
          setChallenges(sortedChallenges);
          // Save to localStorage for persistence
          localStorage.setItem('challengeHub_challenges', JSON.stringify(sortedChallenges));
          console.log('✅ Loaded challenges from mock data (demo):', sortedChallenges.length, 'records');
        }

        // Try API sync in background (don't block UI)
        try {
          const apiChallenges = await apiService.getAllChallenges();
          const sortedChallenges = sortChallengesByLatest(apiChallenges);
          setChallenges(sortedChallenges);
          // Save to localStorage for next time
          localStorage.setItem('challengeHub_challenges', JSON.stringify(sortedChallenges));
          console.log('✅ Synced challenges from API:', sortedChallenges.length, 'records');
        } catch (apiError: any) {
          console.log('⚠️ API sync failed, continuing with localStorage data');
          // Don't show error toast - we already have data displayed
        }
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  // Expose reload function to window for debugging
  useEffect(() => {
    (window as any).reloadChallenges = async () => {
      console.log('🔄 Manually reloading challenges...');
      setLoading(true);

      try {
        const apiChallenges = await apiService.getAllChallenges();
        const sortedChallenges = sortChallengesByLatest(apiChallenges);
        setChallenges(sortedChallenges);
        console.log('✅ Successfully reloaded challenges from API:', sortedChallenges.length, 'records');
        toast({
          title: "Data Refreshed",
          description: "Successfully loaded latest challenge data.",
        });
      } catch (error) {
        console.error('❌ Manual reload failed:', error);
        toast({
          title: "Reload Failed",
          description: "Unable to refresh data. Check network connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
  }, []);

  const addChallenge = (challenge: Challenge) => {
    setChallenges(prev => {
      const updated = sortChallengesByLatest([challenge, ...prev]);
      // Save to localStorage immediately
      localStorage.setItem('challengeHub_challenges', JSON.stringify(updated));
      console.log('✅ Challenge created and saved to localStorage:', challenge.title);
      return updated;
    });
  };

  const createChallenge = async (challengeData: ChallengeFormData) => {
    try {
      const now = new Date().toISOString();

      // Determine status based on user role
      const challengeStatus: ChallengeStatus = (user?.role === 'Management' || user?.role === 'Admin')
        ? 'Open'  // Managers/Admins create challenges that go live immediately
        : 'Pending Approval';  // Employees create challenges that need manager approval

      const newChallengeData = {
        title: challengeData.title,
        description: challengeData.description,
        fullDescription: challengeData.description,
        expectedOutcome: challengeData.expectedOutcome,
        tags: challengeData.techStack,
        points: challengeData.points || 500,
        penaltyPoints: challengeData.penaltyPoints || 50,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdBy: user?.displayName || 'Challenge Creator',
        createdAt: now,
        lastUpdated: now,
        status: challengeStatus
      };

      const newChallenge = await apiService.createChallenge(newChallengeData);

      // Only add to visible challenges if it's approved (for managers)
      // or if viewing as manager (to see pending approvals)
      if (challengeStatus === 'Open' || user?.role === 'Management' || user?.role === 'Admin') {
        addChallenge(newChallenge);
      }

      console.log('✅ Challenge created via API:', newChallenge.title, 'Status:', challengeStatus);
    } catch (error) {
      console.error('Failed to create challenge via API:', error);
      throw error;
    }
  };

  const updateChallenge = (id: string, updatedChallenge: Partial<Challenge>) => {
    setChallenges(prev => {
      const updated = prev.map(challenge =>
        challenge.id === id
          ? { ...challenge, ...updatedChallenge, lastUpdated: new Date().toISOString() }
          : challenge
      );
      const sorted = sortChallengesByLatest(updated);
      // Save to localStorage immediately
      localStorage.setItem('challengeHub_challenges', JSON.stringify(sorted));
      console.log('✅ Challenge updated and saved to localStorage:', id);
      return sorted;
    });
  };

  const acceptChallenge = (challengeId: string, userId: string, committedDate: string) => {
    updateChallenge(challengeId, {
      status: 'Accepted',
      acceptedBy: userId,
      committedDate: committedDate
    });
  };

  const reviewChallenge = (
    challengeId: string,
    action: 'Approved' | 'Rejected' | 'Needs Rework',
    reviewerId: string,
    comment?: string
  ): UserPointsRecord | null => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.acceptedBy) {
      return null;
    }

    const userId = Array.isArray(challenge.acceptedBy)
      ? challenge.acceptedBy[0]
      : challenge.acceptedBy;

    // Calculate and award points
    const pointsRecord = PointsService.awardPoints(
      userId,
      challenge,
      action,
      challenge.submittedAt
    );

    // Update challenge with review details and awarded points
    updateChallenge(challengeId, {
      status: action,
      reviewedAt: new Date().toISOString().split('T')[0],
      reviewedBy: reviewerId,
      reviewComment: comment,
      awardedPoints: pointsRecord.points
    });

    return pointsRecord;
  };

  const processExpiredChallenges = (): UserPointsRecord[] => {
    return PointsService.processExpiredChallenges(challenges);
  };

  const getUserPoints = (userId: string): number => {
    return PointsService.getUserTotalPoints(userId);
  };

  const getUserPointsHistory = (userId: string): UserPointsRecord[] => {
    return PointsService.getUserPointsHistory(userId);
  };

  const getChallenge = (id: string) => {
    return challenges.find(challenge => challenge.id === id);
  };

  // No automatic points initialization - let demo data handle everything

  // No background jobs for demo - keep data stable

  return (
    <ChallengesContext.Provider value={{
      challenges,
      loading,
      addChallenge,
      createChallenge,
      updateChallenge,
      getChallenge,
      acceptChallenge,
      reviewChallenge,
      processExpiredChallenges,
      getUserPoints,
      getUserPointsHistory
    }}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (context === undefined) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
}
