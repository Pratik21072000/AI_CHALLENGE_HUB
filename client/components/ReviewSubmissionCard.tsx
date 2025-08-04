import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  FileText, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

export interface ReviewSubmissionData {
  id: string;
  submitterName: string;
  submitterUsername: string;
  submittedDate: string;
  challengeTitle: string;
  challengeDescription: string;
  challengeId: string;
  techTags: string[];
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  hasSubmission: boolean;
  shortDescription?: string;
}

interface ReviewSubmissionCardProps {
  submission: ReviewSubmissionData;
  onApprove: (submissionId: string, comment?: string) => void;
  onReject: (submissionId: string, comment: string) => void;
  onRework: (submissionId: string, comment: string) => void;
  isProcessing?: boolean;
}

const statusConfig = {
  'Pending Review': {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock
  },
  'Approved': {
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  },
  'Rejected': {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle
  },
  'Needs Rework': {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: RefreshCw
  }
};

export default function ReviewSubmissionCard({ 
  submission, 
  onApprove,
  onReject,
  onRework,
  isProcessing = false
}: ReviewSubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isReworkDialogOpen, setIsReworkDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [reworkComment, setReworkComment] = useState('');
  
  const StatusIcon = statusConfig[submission.status]?.icon || Clock;
  
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '??';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Unknown date';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleApprove = () => {
    onApprove(submission.id);
  };

  const handleReject = () => {
    if (rejectComment.trim()) {
      onReject(submission.id, rejectComment.trim());
      setRejectComment('');
      setIsRejectDialogOpen(false);
    }
  };

  const handleRework = () => {
    if (reworkComment.trim()) {
      onRework(submission.id, reworkComment.trim());
      setReworkComment('');
      setIsReworkDialogOpen(false);
    }
  };

  const handleViewChallenge = () => {
    window.location.href = `/challenge/${submission.challengeId}`;
  };

  const description = submission.shortDescription || submission.challengeDescription;

  return (
    <Card className="rounded-xl border p-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="flex items-start space-x-4">
          {/* Left Section - User Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                {getInitials(submission.submitterName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="role-card-subtitle font-bold text-gray-900">
                {submission.submitterName || 'Unknown User'}
              </div>
              <div className="role-description text-gray-500 text-sm">
                {formatDate(submission.submittedDate)}
              </div>
            </div>
          </div>

          {/* Middle Section - Challenge/Submission Info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <div>
              <h3 className="role-card-title font-bold text-gray-900">
                {submission.challengeTitle || 'Untitled Challenge'}
              </h3>
            </div>

            {/* Description */}
            <div className="role-description text-gray-700">
              <div className={`${!isExpanded ? 'line-clamp-2' : ''}`}>
                {description}
              </div>
              {description && description.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-800 role-description font-medium mt-1 flex items-center"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Technology Tags */}
            {submission.techTags && Array.isArray(submission.techTags) && submission.techTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {submission.techTags.slice(0, 4).map((tech, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                    {tech || 'Unknown'}
                  </Badge>
                ))}
                {submission.techTags.length > 4 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{submission.techTags.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewChallenge}
                className="flex items-center"
                disabled={isProcessing}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Challenge
              </Button>

              {submission.status === 'Pending Review' && (
                <>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4 mr-1" />
                    )}
                    Approve
                  </Button>

                  <Dialog open={isReworkDialogOpen} onOpenChange={setIsReworkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 flex items-center"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Request Rework
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Rework</DialogTitle>
                        <DialogDescription>
                          Provide feedback for the employee to improve their submission.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Explain what needs to be improved..."
                          value={reworkComment}
                          onChange={(e) => setReworkComment(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsReworkDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleRework}
                            disabled={!reworkComment.trim()}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Request Rework
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        className="border-red-300 text-red-700 hover:bg-red-50 flex items-center"
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Submission</DialogTitle>
                        <DialogDescription>
                          Provide a reason for rejecting this submission.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Explain why this submission is being rejected..."
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleReject}
                            disabled={!rejectComment.trim()}
                            variant="destructive"
                          >
                            Reject Submission
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          {/* Right Section - Status */}
          <div className="flex flex-col items-end space-y-3 flex-shrink-0">
            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`${statusConfig[submission.status]?.color} font-medium flex items-center`}
            >
              <StatusIcon className="w-4 h-4 mr-1" />
              {submission.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
