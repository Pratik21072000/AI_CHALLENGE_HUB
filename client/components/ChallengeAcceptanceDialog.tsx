import React, { useState } from 'react';
import { Calendar, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChallengeAcceptanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeTitle: string;
  challengePoints: number;
  challengePenalty: number;
  onAccept: (committedDate: string) => void;
  loading?: boolean;
}

export default function ChallengeAcceptanceDialog({
  open,
  onOpenChange,
  challengeTitle,
  challengePoints,
  challengePenalty,
  onAccept,
  loading = false
}: ChallengeAcceptanceDialogProps) {
  const [committedDate, setCommittedDate] = useState('');

  // Calculate minimum date (tomorrow)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleAccept = () => {
    if (!committedDate || committedDate < getMinDate()) {
      return;
    }
    onAccept(committedDate);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setCommittedDate('');
      }
    }
  };

  // Format date to dd-mm-yyyy for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isValidDate = committedDate && committedDate >= getMinDate();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Accept Challenge</DialogTitle>
          <DialogDescription>
            Are you sure you want to accept this challenge? Please select the date by which you plan to complete it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="committed-date" className="text-sm font-medium">
              Completion Date *
            </Label>
            <Input
              id="committed-date"
              type="date"
              value={committedDate}
              onChange={(e) => setCommittedDate(e.target.value)}
              min={getMinDate()}
              placeholder="dd-mm-yyyy"
              className="w-full"
              required
            />
            {!committedDate && (
              <p className="text-sm text-red-600">This field is required</p>
            )}
            {committedDate && (
              <p className="text-sm text-gray-600">
                Selected date: {formatDateDisplay(committedDate)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!isValidDate || loading}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Accept
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
