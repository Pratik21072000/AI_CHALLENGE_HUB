import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { toast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';

const ChallengesContext = createContext(undefined);

export function ChallengesProvider({ children }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load challenges from API
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        const apiChallenges = await apiService.getAllChallenges();
        setChallenges(apiChallenges);
        console.log('✅ Loaded challenges from API:', apiChallenges.length, 'records');
      } catch (error) {
        console.error('❌ Failed to load challenges:', error);
        toast({
          title: "Error Loading Challenges",
          description: "Failed to load challenges from server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const addChallenge = (challenge) => {
    setChallenges(prev => [challenge, ...prev]);
  };

  const createChallenge = async (challengeData) => {
    try {
      const newChallenge = await apiService.createChallenge(challengeData);
      addChallenge(newChallenge);
      console.log('✅ Challenge created via API:', newChallenge.title);
    } catch (error) {
      console.error('Failed to create challenge via API:', error);
      throw error;
    }
  };

  const updateChallenge = (id, updatedChallenge) => {
    setChallenges(prev => 
      prev.map(challenge =>
        challenge.id === id
          ? { ...challenge, ...updatedChallenge, lastUpdated: new Date().toISOString() }
          : challenge
      )
    );
  };

  const getChallenge = (id) => {
    return challenges.find(challenge => challenge.id === id);
  };

  const acceptChallenge = (challengeId, userId, committedDate) => {
    updateChallenge(challengeId, {
      status: 'Accepted',
      acceptedBy: userId,
      committedDate: committedDate
    });
  };

  const reviewChallenge = (challengeId, action, reviewerId, comment) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.acceptedBy) {
      return null;
    }

    // Update challenge with review details
    updateChallenge(challengeId, {
      status: action,
      reviewedAt: new Date().toISOString().split('T')[0],
      reviewedBy: reviewerId,
      reviewComment: comment,
    });

    return { points: 500 }; // Mock points record
  };

  const processExpiredChallenges = () => {
    return []; // Mock implementation
  };

  const getUserPoints = (userId) => {
    return 0; // Points are now managed by the database
  };

  const getUserPointsHistory = (userId) => {
    return []; // Points history is now managed by the database
  };

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