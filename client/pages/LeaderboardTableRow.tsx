import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Star, 
  Target, 
  Clock 
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Participant' | 'Reviewer' | 'Admin';
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  avatar?: string;
  badges: string[];
  rank: number;
  completedChallenges: number;
  approvedSolutions: number;
  submittedChallenges: number;
}

interface TableRowProps {
  user: LeaderboardUser;
  globalRank: number;
  isExpanded: boolean;
  onToggle: (userId: string) => void;
  activeTab: string;
  badgeColors: Record<string, string>;
  getRankIcon: (rank: number) => React.ReactNode;
  getPointsForPeriod: (user: LeaderboardUser, period: string) => number;
}

export default function LeaderboardTableRow({
  user,
  globalRank,
  isExpanded,
  onToggle,
  activeTab,
  badgeColors,
  getRankIcon,
  getPointsForPeriod
}: TableRowProps) {
  const getRankChangeIndicator = (rank: number) => {
    const rankChanges: Record<number, 'up' | 'down' | 'same'> = {
      1: 'same', 2: 'up', 3: 'down', 4: 'up', 5: 'same',
      6: 'down', 7: 'up', 8: 'same', 9: 'down', 10: 'up'
    };
    
    const change = rankChanges[rank] || 'same';
    
    if (change === 'up') {
      return <ArrowUp className="w-3 h-3 text-success animate-bounce" />;
    } else if (change === 'down') {
      return <ArrowDown className="w-3 h-3 text-error animate-bounce" />;
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getProgressBarData = (user: LeaderboardUser) => {
    const totalAttempted = user.completedChallenges + 2;
    const progressPercentage = (user.completedChallenges / totalAttempted) * 100;
    return { completed: user.completedChallenges, attempted: totalAttempted, percentage: progressPercentage };
  };

  const getBadgeIcon = (badgeName: string) => {
    const badgeIcons: Record<string, string> = {
      'Top 3': '🌟',
      'On-Time Finisher': '⏱️',
      'First Submission': '📤',
      '3x Completer': '🔁',
      'Clean Submission': '💯'
    };
    return badgeIcons[badgeName] || '🏅';
  };

  const progressData = getProgressBarData(user);

  return (
    <React.Fragment>
      <tr 
        className="border-b hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/10 transition-all duration-300 group cursor-pointer hover:shadow-lg"
        onClick={() => onToggle(user.id)}
      >
        <td className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                {globalRank <= 3 ? (
                  getRankIcon(globalRank)
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{globalRank}</span>
                )}
                {getRankChangeIndicator(globalRank)}
              </div>
            </div>
            <div className="ml-2">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
              )}
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-sm font-medium">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground">{user.department}</div>
              <div className="mt-1">
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                    style={{ width: `${progressData.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {progressData.completed}/{progressData.attempted} completed
                </div>
              </div>
            </div>
          </div>
        </td>
        <td className="p-4 text-right">
          <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {getPointsForPeriod(user, activeTab).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">points</div>
        </td>
        <td className="p-4 text-center">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {user.submittedChallenges} / {user.approvedSolutions}
            </div>
            <div className="text-xs text-muted-foreground">Sub / App</div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-wrap gap-2 max-w-[200px]">
            {user.badges.slice(0, 2).map((badge) => (
              <div
                key={badge}
                className="group/badge relative"
              >
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badgeColors[badge] || 'bg-muted text-muted-foreground'} hover:scale-105 transition-transform`}>
                  <span className="text-sm">{getBadgeIcon(badge)}</span>
                  <span>{badge}</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {badge}
                </div>
              </div>
            ))}
            {user.badges.length > 2 && (
              <div className="group/badge relative">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-muted text-muted-foreground hover:scale-105 transition-transform">
                  +{user.badges.length - 2}
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {user.badges.slice(2).join(', ')}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b bg-accent/20">
          <td colSpan={5} className="px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning" />
                  Score Breakdown
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Weekly Points:</span>
                    <span className="font-medium">{user.weeklyPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Monthly Points:</span>
                    <span className="font-medium">{user.monthlyPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Points:</span>
                    <span className="font-semibold">{user.totalPoints.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-info" />
                  Challenge Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-success">{user.completedChallenges}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Approved Solutions:</span>
                    <span className="font-medium text-success">{user.approvedSolutions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="font-medium text-info">{user.submittedChallenges}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-medium">{user.completedChallenges > 0 ? Math.round((user.approvedSolutions / user.completedChallenges) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Last submission: 2 days ago
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg. completion time: 3.2 days
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Streak: 5 challenges
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
