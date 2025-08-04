import { useState } from 'react';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, FileText, CheckCircle } from 'lucide-react';
import TechStackInput from './TechStackInput';
import { toast } from '@/hooks/use-toast';


const challengeSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  acceptanceCriteria: z.string().min(30, 'Acceptance criteria must be at least 30 characters'),
  preferredTechnologies: z.string().optional().default(''),
});

type ChallengeForm = z.infer<typeof challengeSchema>;

interface CreateChallengeDialogProps {
  onChallengeCreated?: (challenge: ChallengeForm) => void;
}

export default function CreateChallengeDialog({ onChallengeCreated }: CreateChallengeDialogProps = {}) {
  const { createChallenge } = useChallenges();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<ChallengeForm | null>(null);

  const form = useForm<ChallengeForm>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      acceptanceCriteria: '',
      preferredTechnologies: ''
    }
  });

  const onSubmit = async (data: ChallengeForm) => {
    // Show confirmation dialog first
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingData) return;

    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('✅ Challenge created successfully:', pendingData.title);
      console.log('Challenge data:', { ...pendingData, files: selectedFiles });

      // Use context to create challenge
      const techArray = pendingData.preferredTechnologies
        ? pendingData.preferredTechnologies.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0)
        : [];

      createChallenge({
        title: pendingData.title,
        description: pendingData.description,
        expectedOutcome: pendingData.acceptanceCriteria,
        techStack: techArray,
        points: 500, // Default 500 points
        penaltyPoints: 50 // Default 50 penalty
      });

      // Also call the optional callback if provided
      if (onChallengeCreated) {
        onChallengeCreated(pendingData);
      }

      // Show success notification based on user role
      const isManager = user?.role === 'Management' || user?.role === 'Admin';
      toast({
        title: "Challenge Created Successfully!",
        description: isManager
          ? `"${pendingData.title}" has been published and is now live on the dashboard.`
          : `"${pendingData.title}" has been submitted for manager approval and will appear on the dashboard once approved.`,
        duration: 5000,
      });

      // Reset form and close dialog
      form.reset();
      setSelectedFiles([]);
      setPendingData(null);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Challenge</DialogTitle>
          <DialogDescription>
            Create an innovation challenge with a clear title, description, expected outcome, and optional attachments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., AI-Powered Customer Support Chatbot"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the challenge, requirements, and what participants should accomplish..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A comprehensive description of the challenge (minimum 50 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Acceptance Criteria */}
            <FormField
              control={form.control}
              name="acceptanceCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acceptance Criteria *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What should the final solution achieve or deliver..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Define what success looks like for this challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Preferred Technologies / Skills */}
            <FormField
              control={form.control}
              name="preferredTechnologies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Technologies / Skills</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., React, Node.js, Python, Docker..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of preferred technologies or skills
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none">Supporting Documents</label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload requirements, specifications, or reference materials
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="challenge-file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload files
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PDF, DOC, PNG, JPG up to 10MB each
                      </span>
                    </label>
                    <input
                      id="challenge-file-upload"
                      name="challenge-file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Challenge'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Challenge Creation</DialogTitle>
          <DialogDescription>
            Are you sure you want to create this challenge?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowConfirmation(false);
              setPendingData(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Yes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
