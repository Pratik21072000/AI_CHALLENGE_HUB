import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, RefreshCw, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { useChallenges } from '@/contexts/ChallengesContext';
import { PointsService } from '@/services/PointsService';
import { toast } from '@/hooks/use-toast';

export default function PointsSystemMonitor() {
  const { processExpiredChallenges } = useChallenges();
  const [isOpen, setIsOpen] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  const runExpiredChallengeCheck = () => {
    const penaltyRecords = processExpiredChallenges();
    setLastCheck(new Date().toLocaleTimeString());
    
    if (penaltyRecords.length > 0) {
      toast({
        title: "Penalty Points Applied",
        description: `Applied penalties to ${penaltyRecords.length} expired challenge(s).`,
        duration: 4000,
      });
    } else {
      toast({
        title: "No Penalties Applied",
        description: "No expired challenges found requiring penalties.",
        duration: 3000,
      });
    }
  };

  const allPointsRecords = PointsService.getAllPointsRecords();
  const totalPointsAwarded = allPointsRecords
    .filter(r => r.points > 0)
    .reduce((sum, r) => sum + r.points, 0);
  const totalPenaltiesApplied = Math.abs(allPointsRecords
    .filter(r => r.points < 0)
    .reduce((sum, r) => sum + r.points, 0));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Points System
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Points System Monitor
          </DialogTitle>
          <DialogDescription>
            Monitor and manage the challenge points system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Total Points Awarded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{totalPointsAwarded}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-error" />
                  Total Penalties Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-error">{totalPenaltiesApplied}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-info" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{allPointsRecords.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Manual Operations</CardTitle>
              <CardDescription>
                Manually trigger system operations for testing and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Process Expired Challenges</div>
                  <div className="text-xs text-muted-foreground">
                    Check for challenges past their committed date and apply penalties
                  </div>
                  {lastCheck && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last check: {lastCheck}
                    </div>
                  )}
                </div>
                <Button onClick={runExpiredChallengeCheck} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Check
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Points Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Points Activity</CardTitle>
              <CardDescription>
                Latest points awards and penalties across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {allPointsRecords.length > 0 ? (
                    allPointsRecords
                      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
                      .slice(0, 10)
                      .map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {record.reason.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(record.awardedAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-foreground truncate">
                              {record.description}
                            </div>
                          </div>
                          <div className={`font-bold ml-4 ${
                            record.points > 0 ? 'text-success' : 'text-error'
                          }`}>
                            {record.points > 0 ? '+' : ''}{record.points}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No points activity yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
