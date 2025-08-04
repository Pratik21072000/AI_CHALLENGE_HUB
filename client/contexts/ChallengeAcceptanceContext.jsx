import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

const ChallengeAcceptanceContext = createContext(undefined);

export function ChallengeAcceptanceProvider({ children }) {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load acceptances from API when user changes
  useEffect(() => {
    const loadAcceptances = async () => {
      if (!user) {
        setAcceptances([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userAcceptances = await apiService.getUserAcceptances(user.username);
        setAcceptances(userAcceptances);
        console.log('✅ Loaded acceptances from API:', userAcceptances.length, 'records');
      } catch (error) {
        console.error('Error loading acceptances:', error);
        setAcceptances([]);
      } finally {
        setLoading(false);
      }
    };

    loadAcceptances();
  }, [user]);

  const acceptChallenge = async (challengeId, committedDate) => {
    if (!user) {
      console.log('❌ Accept failed: No user');
      return false;
    }

    // Check if user already has an active challenge
    if (!canUserAcceptChallenge(user.username)) {
      console.log('❌ User already has an active challenge');
      return false;
    }

    try {
      const newAcceptance = await apiService.acceptChallenge(challengeId, committedDate);
      
      // Update local state
      setAcceptances(prev => [...prev, newAcceptance]);
      console.log('✅ Challenge accepted successfully:', newAcceptance);
      return true;
    } catch (error) {
      console.error('❌ Error accepting challenge:', error);
      return false;
    }
  };

  const withdrawChallenge = async (challengeId) => {
    if (!user) return false;

    try {
      // Find the acceptance to withdraw
      const acceptance = acceptances.find(acc => 
        acc.username === user.username && acc.challengeId === challengeId
      );

      if (!acceptance) return false;

      await apiService.updateAcceptanceStatus(acceptance.id, 'Withdrawn');

      // Update local state
      setAcceptances(prev => 
        prev.map(acc =>
          acc.id === acceptance.id
            ? { ...acc, status: 'Withdrawn' }
            : acc
        )
      );

      console.log('✅ Challenge withdrawal completed for user:', user.username);
      return true;
    } catch (error) {
      console.error('❌ Error withdrawing challenge:', error);
      return false;
    }
  };

  // Enhanced status checking functions
  const isStatusActive = (status) => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return activeStatuses.includes(status);
  };

  const getEffectiveUserStatus = (username, challengeId) => {
    const acceptance = acceptances.find(
      acc => acc.username === username && acc.challengeId === challengeId
    );

    if (!acceptance) return 'Not Accepted';
    return acceptance.status;
  };

  const updateAcceptanceStatus = async (username, challengeId, newStatus) => {
    try {
      const acceptance = acceptances.find(
        acc => acc.username === username && acc.challengeId === challengeId
      );

      if (!acceptance) return;

      await apiService.updateAcceptanceStatus(acceptance.id, newStatus);

      // Update local state
      setAcceptances(prev =>
        prev.map(acc =>
          acc.id === acceptance.id
            ? { ...acc, status: newStatus }
            : acc
        )
      );
    } catch (error) {
      console.error('❌ Error updating acceptance status:', error);
    }
  };

  const getUserActiveChallenge = (username) => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return acceptances.find(acc =>
      acc.username === username && activeStatuses.includes(acc.status)
    ) || null;
  };

  const hasUserAcceptedChallenge = (username, challengeId) => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
    return acceptances.some(acc =>
      acc.username === username &&
      acc.challengeId === challengeId &&
      activeStatuses.includes(acc.status)
    );
  };

  const canUserAcceptChallenge = (username) => {
    const activeChallenge = getUserActiveChallenge(username);
    return activeChallenge === null;
  };

  const getChallengeAcceptances = useCallback((challengeId) => {
    if (!challengeId) {
      return acceptances;
    }
    return acceptances.filter(acceptance => acceptance.challengeId === challengeId);
  }, [acceptances]);

  const getUserAcceptances = useCallback((username) => {
    return acceptances.filter(
      acceptance =>
        acceptance.username === username &&
        isStatusActive(acceptance.status)
    );
  }, [acceptances]);

  const getAllUserAcceptances = useCallback((username) => {
    return acceptances.filter(acceptance => acceptance.username === username);
  }, [acceptances]);

  const refreshAcceptances = useCallback(async () => {
    if (!user) return;

    try {
      const userAcceptances = await apiService.getUserAcceptances(user.username);
      setAcceptances(userAcceptances);
      console.log('✅ Refreshed acceptances from API:', userAcceptances.length, 'records');
    } catch (error) {
      console.error('Error refreshing acceptances:', error);
    }
  }, [user]);

  const value = {
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