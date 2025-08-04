import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Eye,
  FileText,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  X
} from 'lucide-react';

export interface SubmissionCardData {
  id: string;
  submitterName: string;
  submitterUsername: string;
  submittedDate: string;
  challengeTitle: string;
  challengeDescription: string;
  challengeId: string;
  techTags: string[];
  status: 'Accepted' | 'In Review' | 'Approved' | 'Denied' | 'Rework';
  hasSubmission: boolean;
  shortDescription?: string;
  challenge?: any; // Optional challenge reference for sorting
}

interface SubmissionCardProps {
  submission: SubmissionCardData;
  showChallengeInfo?: boolean; // Whether to show challenge title/description (for My Submissions)
  onViewChallenge?: (challengeId: string) => void;
  onViewSubmission?: (challengeId: string, username: string) => void;
  onSubmitSolution?: (challengeId: string) => void;
  onWithdrawChallenge?: (challengeId: string) => void;
  useSubmissionPopup?: boolean; // Whether to open submission details in popup instead of navigation
}

const statusConfig = {
  'Accepted': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock
  },
  'In Review': {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Eye
  },
  'Approved': {
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  },
  'Denied': {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle
  },
  'Rework': {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: RefreshCw
  }
};

export default function SubmissionCard({
  submission,
  showChallengeInfo = false,
  onViewChallenge,
  onViewSubmission,
  onSubmitSolution,
  onWithdrawChallenge,
  useSubmissionPopup = false
}: SubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const description = showChallengeInfo 
    ? submission.challengeDescription 
    : submission.shortDescription || submission.challengeDescription;

  const handleViewChallenge = () => {
    if (onViewChallenge) {
      onViewChallenge(submission.challengeId);
    } else {
      window.location.href = `/challenge/${submission.challengeId}`;
    }
  };

  const handleViewSubmission = () => {
    if (onViewSubmission) {
      onViewSubmission(submission.challengeId, submission.submitterUsername);
    } else if (!useSubmissionPopup) {
      window.location.href = `/submission/${submission.challengeId}/${submission.submitterUsername}`;
    }
  };

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
                {showChallengeInfo ? (submission.challengeTitle || 'Untitled Challenge') : 'Solution Submission'}
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
            <div className="flex gap-2 pt-2 flex-wrap">
              {/* For My Submissions page, only show View Details button and View Submission (if exists) */}
              {showChallengeInfo ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewChallenge}
                    className="flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>

                  {/* View Submission - Show when submission exists */}
                  {submission.hasSubmission && (
                    <Button
                      size="sm"
                      onClick={handleViewSubmission}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Submission
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewChallenge}
                    className="flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Challenge
                  </Button>

                  {/* Submit Solution - Show for Accepted status */}
                  {submission.status === 'Accepted' && onSubmitSolution && (
                    <Button
                      size="sm"
                      onClick={() => onSubmitSolution(submission.challengeId)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Submit Solution
                    </Button>
                  )}

                  {/* Withdraw Challenge - Show for Accepted status */}
                  {submission.status === 'Accepted' && onWithdrawChallenge && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWithdrawChallenge(submission.challengeId)}
                      className="border-red-200 text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Withdraw
                    </Button>
                  )}

                  {/* View Submission - Show when submission exists */}
                  {submission.hasSubmission && (
                    <Button
                      size="sm"
                      onClick={handleViewSubmission}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Submission
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Section - Status + Actions */}
          <div className="flex flex-col items-end space-y-3 flex-shrink-0">
            {/* Status Badge */}
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`${statusConfig[submission.status]?.color} font-medium flex items-center`}
              >
                <StatusIcon className="w-4 h-4 mr-1" />
                {submission.status}
              </Badge>
              
              {/* Thumbs-up for approved submissions */}
              {submission.status === 'Approved' && (
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 p-1">
                  <ThumbsUp className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
