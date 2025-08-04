import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import stateSynchronizer from '@/utils/stateSynchronizer';
import { ensureCleanAcceptanceState, debugAcceptanceState } from '@/utils/ensureCleanAcceptanceState';

// Acceptance tracking format matching requirement:
// { username: "employee3", challengeId: "challenge_2", acceptedAt: "2025-08-01T12:27:00Z" }
export interface ChallengeAcceptance {
  id?: string;
  username: string;
  challengeId: string;
  status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn';
  committedDate: string;
  acceptedAt: string;
}

interface ChallengeAcceptanceContextType {
  acceptances: ChallengeAcceptance[];
  acceptChallenge: (challengeId: string, committedDate: string) => Promise<boolean>;
  withdrawChallenge: (challengeId: string) => boolean;
  getUserActiveChallenge: (username: string) => ChallengeAcceptance | null;
  hasUserAcceptedChallenge: (username: string, challengeId: string) => boolean;
  canUserAcceptChallenge: (username: string) => boolean;
  getChallengeAcceptances: (challengeId: string) => ChallengeAcceptance[];
  getUserAcceptances: (username: string) => ChallengeAcceptance[];
  getAllUserAcceptances: (username: string) => ChallengeAcceptance[];
  refreshAcceptances: () => void;
  getEffectiveUserStatus: (username: string, challengeId: string) => string;
  isStatusActive: (status: string) => boolean;
  updateAcceptanceStatus: (username: string, challengeId: string, newStatus: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn') => void;
  loading: boolean;
}

const ChallengeAcceptanceContext = createContext<ChallengeAcceptanceContextType | undefined>(undefined);

// Mock initial acceptances for testing
const INITIAL_ACCEPTANCES: ChallengeAcceptance[] = [
  // Starting fresh - no acceptances
];

interface ChallengeAcceptanceProviderProps {
  children: ReactNode;
}

export function ChallengeAcceptanceProvider({ children }: ChallengeAcceptanceProviderProps) {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState<ChallengeAcceptance[]>([]);
  const [loading, setLoading] = useState(true);

  // Load acceptances from localStorage when user changes
  useEffect(() => {
    const loadAcceptances = () => {
      if (!user) {
        setAcceptances([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Load ALL acceptances from localStorage directly for better persistence
        const storedData = localStorage.getItem('challengeHub_acceptances');
        const allAcceptances = storedData ? JSON.parse(storedData) : [];

        // Set all acceptances to enable proper cross-user visibility
        setAcceptances(allAcceptances);
        console.log('✅ Loaded all acceptances from localStorage:', allAcceptances.length, 'total records');
        console.log('   User', user.username, 'has', allAcceptances.filter(acc => acc.username === user.username).length, 'acceptances');
      } catch (error) {
        console.error('Error loading acceptances:', error);
        setAcceptances([]);
      } finally {
        setLoading(false);
      }
    };

    loadAcceptances();

    // Set up real-time sync listener
    const removeListener = stateSynchronizer.addListener(() => {
      console.log('🔄 Real-time sync triggered - reloading acceptances');
      loadAcceptances();
    });

    return removeListener;
  }, [user]);

  const acceptChallenge = async (challengeId: string, committedDate: string): Promise<boolean> => {
    if (!user) {
      console.log('❌ Accept failed: No user');
      return false;
    }

    // Clean up any stale acceptances first and debug current state
    debugAcceptanceState(user.username);
    const cleanupPerformed = ensureCleanAcceptanceState(user.username);

    if (cleanupPerformed) {
      // Refresh local state after cleanup
      const storedData = localStorage.getItem('challengeHub_acceptances');
      const freshAcceptances = storedData ? JSON.parse(storedData) : [];
      setAcceptances(freshAcceptances);
      console.log('🔄 Refreshed local state after cleanup');
    }

    // Check if user already has an active challenge
    if (!canUserAcceptChallenge(user.username)) {
      console.log('❌ User already has an active challenge');
      return false;
    }

    try {
      const newAcceptance: ChallengeAcceptance = {
        id: `acc_${user.username}_${challengeId}_${Date.now()}`,
        username: user.username,
        challengeId,
        status: 'Accepted',
        committedDate,
        acceptedAt: new Date().toISOString()
      };

      // Save to localStorage directly
      const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
      currentAcceptances.push(newAcceptance);
      localStorage.setItem('challengeHub_acceptances', JSON.stringify(currentAcceptances));
      const success = true;

      if (success) {
        // Update local state
        setAcceptances(prev => {
          const existingIndex = prev.findIndex(
            acc => acc.username === user.username && acc.challengeId === challengeId
          );

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newAcceptance;
            return updated;
          } else {
            return [...prev, newAcceptance];
          }
        });

        console.log('✅ Challenge accepted successfully:', newAcceptance);

        // Force immediate data refresh for all components
        setTimeout(() => {
          const refreshEvent = new CustomEvent('challengeHub:acceptanceChanged');
          window.dispatchEvent(refreshEvent);
        }, 100);

        return true;
      } else {
        console.error('��� Failed to save acceptance');
        return false;
      }
    } catch (error) {
      console.error('❌ Error accepting challenge:', error);
      return false;
    }
  };

  const withdrawChallenge = (challengeId: string): boolean => {
    if (!user) return false;

    // Update in localStorage directly
    const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const updatedAcceptances = currentAcceptances.map((acc: ChallengeAcceptance) =>
      acc.username === user.username && acc.challengeId === challengeId
        ? { ...acc, status: 'Withdrawn' }
        : acc
    );
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(updatedAcceptances));
    const success = true;

    if (success) {
      // Update local state to match
      setAcceptances(prev => {
        const updated = prev.map(acceptance =>
          acceptance.username === user.username && acceptance.challengeId === challengeId
            ? { ...acceptance, status: 'Withdrawn' as const }
            : acceptance
        );
        console.log('✅ Challenge withdrawal completed for user:', user.username);
        console.log('🎉 User can now accept new challenges!');
        return updated;
      });
    }

    return success;
  };

  // Enhanced status checking functions
  const isStatusActive = (status: string): boolean => {
    // Define active statuses according to requirements
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return activeStatuses.includes(status);
  };

  const isStatusNonActive = (status: string): boolean => {
    // Define non-active statuses according to requirements
    const nonActiveStatuses = ['Approved', 'Rejected', 'Needs Rework', 'Withdrawn'];
    return nonActiveStatuses.includes(status);
  };

  const getEffectiveUserStatus = (username: string, challengeId: string): string => {
    // First check acceptance status
    const acceptance = acceptances.find(
      acc => acc.username === username && acc.challengeId === challengeId
    );

    if (!acceptance) return 'Not Accepted';
    return acceptance.status;
  };

  const updateAcceptanceStatus = (username: string, challengeId: string, newStatus: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn') => {
    // Update localStorage directly
    const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const updatedAcceptances = currentAcceptances.map((acc: ChallengeAcceptance) =>
      acc.username === username && acc.challengeId === challengeId
        ? { ...acc, status: newStatus }
        : acc
    );
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(updatedAcceptances));

    // Update local state
    setAcceptances(prev => {
      return prev.map(acceptance =>
        acceptance.username === username && acceptance.challengeId === challengeId
          ? { ...acceptance, status: newStatus }
          : acceptance
      );
    });
  };

  const getUserActiveChallenge = (username: string): ChallengeAcceptance | null => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return acceptances.find(acc =>
      acc.username === username && activeStatuses.includes(acc.status)
    ) || null;
  };

  const hasUserAcceptedChallenge = (username: string, challengeId: string): boolean => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
    const result = acceptances.some(acc =>
      acc.username === username &&
      acc.challengeId === challengeId &&
      activeStatuses.includes(acc.status)
    );

    console.log(`🔍 hasUserAcceptedChallenge(${username}, ${challengeId}):`, {
      acceptances: acceptances.filter(acc => acc.username === username),
      result
    });

    return result;
  };

  const canUserAcceptChallenge = (username: string): boolean => {
    const activeChallenge = getUserActiveChallenge(username);
    return activeChallenge === null;
  };

  const getChallengeAcceptances = useCallback((challengeId: string): ChallengeAcceptance[] => {
    // If challengeId is empty, return ALL acceptances (used for dashboard stats)
    if (!challengeId) {
      return acceptances;
    }

    // Return ALL acceptances for the specific challenge, not just active ones
    // This allows viewing all users who have interacted with the challenge
    return acceptances.filter(acceptance => acceptance.challengeId === challengeId);
  }, [acceptances]);

  const getUserAcceptances = useCallback((username: string): ChallengeAcceptance[] => {
    return acceptances.filter(
      acceptance =>
        acceptance.username === username &&
        isStatusActive(acceptance.status)
    );
  }, [acceptances]);

  // Get ALL user acceptances regardless of status - for My Submissions page
  const getAllUserAcceptances = useCallback((username: string): ChallengeAcceptance[] => {
    const userAcceptances = acceptances.filter(acceptance => acceptance.username === username);
    console.log(`🔍 getAllUserAcceptances for ${username}:`, userAcceptances.length, 'found');
    userAcceptances.forEach(acc => {
      console.log(`   - ${acc.challengeId}: ${acc.status} (active: ${isStatusActive(acc.status)})`);
    });
    return userAcceptances;
  }, [acceptances]);

  const refreshAcceptances = useCallback(() => {
    if (!user) return;

    try {
      // Load ALL acceptances from localStorage directly
      const storedData = localStorage.getItem('challengeHub_acceptances');
      const allAcceptances = storedData ? JSON.parse(storedData) : [];
      setAcceptances(allAcceptances);
      console.log('✅ Refreshed all acceptances from localStorage:', allAcceptances.length, 'total records');
      console.log('   User', user.username, 'has', allAcceptances.filter(acc => acc.username === user.username).length, 'acceptances');
    } catch (error) {
      console.error('Error refreshing acceptances:', error);
    }
  }, [user]);

  const value: ChallengeAcceptanceContextType = {
    acceptances,
    acceptChallenge,
    withdrawChallenge,
    getUserActiveChallenge,
    hasUserAcceptedChallenge,
    canUserAcceptChallenge,
    getChallengeAcceptances,
    getUserAcceptances,
    getAllUserAcceptances,
    refreshAcceptances,
    getEffectiveUserStatus,
    isStatusActive,
    updateAcceptanceStatus,
    loading
  };

  return (
    <ChallengeAcceptanceContext.Provider value={value}>
      {children}
    </ChallengeAcceptanceContext.Provider>
  );
}

export function useChallengeAcceptance() {
  const context = useContext(ChallengeAcceptanceContext);
  if (context === undefined) {
    throw new Error('useChallengeAcceptance must be used within a ChallengeAcceptanceProvider');
  }
  return context;
}
