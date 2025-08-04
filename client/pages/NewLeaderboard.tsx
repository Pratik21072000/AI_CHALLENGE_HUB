import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Medal, Star, Info, Users, Award, CheckCircle, X, RotateCcw, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { onLeaderboardRefresh } from '@/utils/leaderboardRefresh';

interface LeaderboardEntry {
  username: string;
  displayName: string;
  initials: string;
  rank: number;
  totalPoints: number;
  challengesCompleted: number;
  departmentRole: string;
  avatar?: string;
  statusBreakdown: {
    approved: number;
    rework: number;
    rejected: number;
  };
}

interface SubmissionRecord {
  challengeId: string;
  challengeTitle: string;
  submittedDate: string;
  committedDate: string;
  reviewStatus: 'Approved' | 'Rejected' | 'Needs Rework' | 'Pending Review';
  penaltyPoints?: number;
  pointsAwarded: number;
  isOnTime: boolean;
}

type TimeFilter = 'all-time' | 'monthly' | 'weekly';

export default function NewLeaderboard() {
  const { user } = useAuth();
  const { acceptances } = useChallengeAcceptance();
  const { submissions, getUserSubmission } = useSubmission();
  const { reviews, getSubmissionReview } = useSubmissionReview();
  const { getChallenge } = useChallenges();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh on data changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [acceptances.length, submissions.length, reviews.length]);

  // Listen for leaderboard-specific refresh events
  useEffect(() => {
    const cleanup = onLeaderboardRefresh((reason) => {
      console.log('🏆 Leaderboard refreshing:', reason);
      setRefreshKey(prev => prev + 1);
    });

    return cleanup;
  }, []);

  // User display name and initials mapping
  const getUserInfo = (username: string) => {
    const userMap: Record<string, { name: string; role: string; department: string }> = {
      'employee01': { name: 'John Doe', role: 'Senior Developer', department: 'Engineering' },
      'employee02': { name: 'Lisa Thompson', role: 'UX Designer', department: 'Design' },
      'employee03': { name: 'Mike Chen', role: 'Full Stack Developer', department: 'Engineering' },
      'manager01': { name: 'Sarah Wilson', role: 'Engineering Manager', department: 'Management' },
      // Keep legacy mappings for backward compatibility
      'employee1': { name: 'John Doe', role: 'Senior Developer', department: 'Engineering' },
      'employee2': { name: 'Lisa Thompson', role: 'UX Designer', department: 'Design' },
      'employee3': { name: 'Mike Chen', role: 'Full Stack Developer', department: 'Engineering' },
      'manager1': { name: 'Sarah Wilson', role: 'Engineering Manager', department: 'Management' }
    };
    
    const info = userMap[username] || { name: username, role: 'Employee', department: 'Unknown' };
    const initials = info.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return {
      displayName: info.name,
      initials,
      departmentRole: `${info.department} • ${info.role}`
    };
  };

  // Filter data by time period
  const isWithinTimeFilter = (dateString: string, filter: TimeFilter): boolean => {
    if (filter === 'all-time') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (filter === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    
    if (filter === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    
    return true;
  };

  // Calculate points for a specific submission (SQL-like logic)
  const calculateSubmissionPoints = (submittedDate: string, committedDate: string, reviewStatus: string, managerPenalty?: number): number => {
    const basePoints = 500;
    
    switch (reviewStatus) {
      case 'Approved':
        const submitted = new Date(submittedDate);
        const committed = new Date(committedDate);
        const isOnTime = submitted <= committed;
        return isOnTime ? basePoints : (basePoints - 50); // 50 point late penalty
        
      case 'Needs Rework':
        const penalty = managerPenalty || 100; // Default 100 point penalty
        return Math.max(0, basePoints - penalty);
        
      case 'Rejected':
        return 0;
        
      default:
        return 0; // Pending reviews don't count
    }
  };

  // Get all submission records for a user
  const getUserSubmissionRecords = (username: string): SubmissionRecord[] => {
    const userAcceptances = acceptances.filter(acc => acc.username === username);
    const records: SubmissionRecord[] = [];

    userAcceptances.forEach(acceptance => {
      const submission = getUserSubmission(username, acceptance.challengeId);
      const review = getSubmissionReview(`${username}-${acceptance.challengeId}`);
      const challenge = getChallenge(acceptance.challengeId);

      if (submission && review && isWithinTimeFilter(submission.submittedAt, timeFilter)) {
        const pointsAwarded = review.pointsAwarded !== undefined && review.pointsAwarded !== null 
          ? review.pointsAwarded
          : calculateSubmissionPoints(submission.submittedAt, acceptance.committedDate, review.status);

        records.push({
          challengeId: acceptance.challengeId,
          challengeTitle: challenge?.title || `Challenge ${acceptance.challengeId}`,
          submittedDate: submission.submittedAt,
          committedDate: acceptance.committedDate,
          reviewStatus: review.status as any,
          penaltyPoints: review.pointsAwarded !== undefined ? (500 - review.pointsAwarded) : undefined,
          pointsAwarded,
          isOnTime: new Date(submission.submittedAt) <= new Date(acceptance.committedDate)
        });
      }
    });

    return records.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  };

  // Generate leaderboard data from SQL-like submission data
  const leaderboardData = useMemo(() => {
    const userStats = new Map<string, {
      totalPoints: number;
      challengesCompleted: number;
      statusBreakdown: { approved: number; rework: number; rejected: number };
      submissionRecords: SubmissionRecord[];
    }>();

    // Get unique users from acceptances
    const allUsers = [...new Set(acceptances.map(acc => acc.username))];

    allUsers.forEach(username => {
      const submissionRecords = getUserSubmissionRecords(username);
      
      if (submissionRecords.length === 0) return;

      let totalPoints = 0;
      const statusBreakdown = { approved: 0, rework: 0, rejected: 0 };

      submissionRecords.forEach(record => {
        // Only count final reviewed submissions
        if (['Approved', 'Needs Rework', 'Rejected'].includes(record.reviewStatus)) {
          totalPoints += record.pointsAwarded;
          
          if (record.reviewStatus === 'Approved') statusBreakdown.approved++;
          else if (record.reviewStatus === 'Needs Rework') statusBreakdown.rework++;
          else if (record.reviewStatus === 'Rejected') statusBreakdown.rejected++;
        }
      });

      const challengesCompleted = statusBreakdown.approved + statusBreakdown.rework + statusBreakdown.rejected;

      if (challengesCompleted > 0) {
        userStats.set(username, {
          totalPoints,
          challengesCompleted,
          statusBreakdown,
          submissionRecords
        });
      }
    });

    // Convert to leaderboard entries and sort
    const entries: LeaderboardEntry[] = Array.from(userStats.entries())
      .map(([username, stats]) => {
        const userInfo = getUserInfo(username);

        return {
          username,
          displayName: userInfo.displayName,
          initials: userInfo.initials,
          rank: 0, // Will be assigned after sorting
          totalPoints: stats.totalPoints,
          challengesCompleted: stats.challengesCompleted,
          departmentRole: userInfo.departmentRole,
          statusBreakdown: stats.statusBreakdown
        };
      })
      .sort((a, b) => {
        // Sort by total points (descending), then by challenges completed (descending)
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.challengesCompleted - a.challengesCompleted;
      });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }, [acceptances, submissions, reviews, timeFilter, refreshKey]);

  // Split data into top 3 and others
  const topThree = leaderboardData.slice(0, 3);
  const otherRanks = leaderboardData.slice(3);

  // Calculate total stats
  const totalStats = {
    participants: leaderboardData.length,
    totalPoints: leaderboardData.reduce((sum, entry) => sum + entry.totalPoints, 0),
    totalChallenges: leaderboardData.reduce((sum, entry) => sum + entry.challengesCompleted, 0)
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2: return <Medal className="w-8 h-8 text-gray-400" />;
      case 3: return <Medal className="w-8 h-8 text-amber-600" />;
      default: return null;
    }
  };

  const getRankCardBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
      case 2: return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
      case 3: return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };



  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">🏆 Leaderboard</h1>
          <p className="text-lg text-gray-600 mb-4">
            Track your progress and see how you rank among your peers in completing challenges
          </p>
          
          {/* Scoring Rules Tooltip */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Scoring Rules:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="text-sm space-y-1">
                    <div className="font-semibold mb-2">Points Calculation:</div>
                    <div>✅ Approved (On Time): 500 pts</div>
                    <div>⏰ Approved (Late): 450 pts</div>
                    <div>🔄 Needs Rework: 500 - manager penalty</div>
                    <div>❌ Rejected: 0 pts</div>
                    <div className="mt-2 text-xs text-gray-400">
                      Based on actual reviewed submissions from SQL database
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Time Filter Tabs */}
        <Tabs value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{totalStats.participants}</div>
              <div className="text-sm text-gray-600">Total Participants</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{totalStats.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Points Awarded</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{totalStats.totalChallenges}</div>
              <div className="text-sm text-gray-600">Challenges Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Section */}
        {topThree.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🌟 Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((entry) => (
                <Card 
                  key={entry.username}
                  className={`relative overflow-hidden ${getRankCardBg(entry.rank)} ${
                    entry.username === user?.username ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    {/* Rank Icon */}
                    <div className="flex justify-center mb-4">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* Avatar */}
                    <Avatar className="w-16 h-16 mx-auto mb-4 border-4 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold">
                        {entry.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* User Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {entry.displayName}
                        {entry.username === user?.username && (
                          <span className="ml-2 text-xs text-blue-700 font-medium">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{entry.departmentRole}</p>
                    </div>
                    
                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="text-3xl font-bold text-gray-900">{entry.totalPoints}</div>
                      <div className="text-sm text-gray-600">Total Points</div>
                      <div className="text-sm text-gray-700">{entry.challengesCompleted} Challenges Completed</div>
                    </div>
                    

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Ranking List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              All Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Rankings Available</h3>
                <p className="text-gray-500">
                  Complete and get your challenges reviewed to appear on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.map((entry) => (
                  <div
                    key={entry.username}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      entry.username === user?.username 
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side - Rank and User Info */}
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${entry.rank <= 3 
                            ? entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' 
                              : entry.rank === 2 ? 'bg-gray-100 text-gray-800'
                              : 'bg-amber-100 text-amber-800'
                            : 'bg-gray-50 text-gray-600'
                          }
                        `}>
                          #{entry.rank}
                        </div>
                        
                        {/* User Avatar and Info */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                              {entry.initials}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{entry.displayName}</span>
                              {entry.username === user?.username && (
                                <span className="text-xs text-blue-700 font-medium">(You)</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{entry.departmentRole}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Stats and Badges */}
                      <div className="flex items-center space-x-6">
                        {/* Points */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{entry.totalPoints}</div>
                          <div className="text-xs text-gray-500">Points</div>
                        </div>
                        
                        {/* Challenges */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{entry.challengesCompleted}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
