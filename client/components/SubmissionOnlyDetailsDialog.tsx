import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Code, Globe, FileText, Calendar, User } from 'lucide-react';
import { Challenge, ChallengeSubmission } from '@shared/types';

interface SubmissionOnlyDetailsDialogProps {
  challenge?: Challenge;
  submission?: ChallengeSubmission;
  submissionDetails?: any; // For backward compatibility with existing usage
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubmissionOnlyDetailsDialog({
  challenge,
  submission,
  submissionDetails: passedSubmissionDetails,
  isOpen,
  onOpenChange
}: SubmissionOnlyDetailsDialogProps) {
  // Determine the source of submission details
  let submissionDetails: any = null;

  if (passedSubmissionDetails) {
    // Use passed submission details (for backward compatibility)
    submissionDetails = passedSubmissionDetails;
  } else if (challenge?.submissionDetails) {
    // Use challenge submission details
    submissionDetails = challenge.submissionDetails;
  } else if (submission) {
    // Create submission details from ChallengeSubmission object
    submissionDetails = {
      description: submission.shortDescription || 'No description provided',
      techStack: submission.technologies || '',
      sourceCodeUrl: submission.sourceCodeUrl || '',
      hostedAppUrl: submission.hostedAppUrl || '',
      additionalNotes: '', // Not available in ChallengeSubmission type
      files: submission.supportingDocs?.map(doc => doc.fileName) || []
    };
  }

  if (!submissionDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Submission Details</DialogTitle>
            <DialogDescription>
              No submission details found for this challenge.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Submission Details
          </DialogTitle>
          <DialogDescription>
            Review the submitted solution details and deliverables
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Submitted: {
                submission?.submittedAt ||
                challenge?.submittedAt ||
                new Date().toLocaleDateString()
              }</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>Submitted by: {
                submission?.username ||
                (Array.isArray(challenge?.acceptedBy)
                  ? challenge.acceptedBy.join(', ')
                  : challenge?.acceptedBy) ||
                'Unknown User'
              }</span>
            </div>
          </div>

          {/* Solution Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Solution Description</h3>
            <div className="p-4 border rounded-lg bg-white">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {submissionDetails.description}
              </p>
            </div>
          </div>

          {/* Technologies Used */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Technologies Used</h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Handle both string and array formats for backward compatibility
                const techs = Array.isArray(submissionDetails.techStack)
                  ? submissionDetails.techStack
                  : submissionDetails.techStack.split(',').map(tech => tech.trim()).filter(tech => tech);
                
                return techs.map((tech) => (
                  <Badge key={tech} variant="outline" className="text-sm">
                    {tech}
                  </Badge>
                ));
              })()}
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Code */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Source Code
              </h3>
              <div className="p-4 border rounded-lg">
                <a 
                  href={submissionDetails.sourceCodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {submissionDetails.sourceCodeUrl}
                </a>
              </div>
            </div>

            {/* Hosted Application */}
            {submissionDetails.hostedAppUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Live Demo
                </h3>
                <div className="p-4 border rounded-lg">
                  <a 
                    href={submissionDetails.hostedAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {submissionDetails.hostedAppUrl}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          {submissionDetails.additionalNotes && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {submissionDetails.additionalNotes}
                </p>
              </div>
            </div>
          )}

          {/* Uploaded Files */}
          {submissionDetails.files && submissionDetails.files.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
              <div className="space-y-2">
                {submissionDetails.files.map((fileName, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
