import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Upload, ExternalLink, Code, Globe, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { useChallenges } from '@/contexts/ChallengesContext';



const submissionSchema = z.object({
  description: z.string().min(50, 'Description must be at least 50 characters'),
  techStack: z.string().min(1, 'Enter at least one technology'),
  sourceCodeUrl: z.string().url('Please enter a valid URL'),
  hostedAppUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  additionalNotes: z.string().optional()
});

type SubmissionForm = z.infer<typeof submissionSchema>;

export default function ChallengeSubmission() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChallenge, updateChallenge } = useChallenges();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submissionData, setSubmissionData] = useState<SubmissionForm | null>(null);

  const challenge = getChallenge(id || '');

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      description: '',
      techStack: '',
      sourceCodeUrl: '',
      hostedAppUrl: '',
      additionalNotes: ''
    }
  });

  const onSubmit = async (data: SubmissionForm) => {
    // Store submission data and show confirmation dialog
    setSubmissionData(data);
    setShowConfirmDialog(true);
  };

  const handleFinalSubmission = async () => {
    if (!submissionData || !challenge) return;

    setIsSubmitting(true);

    try {
      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Submission data:', { ...submissionData, files: selectedFiles });

      // Update challenge status to "Submitted" and store submission details
      updateChallenge(challenge.id, {
        status: 'Submitted',
        submittedAt: new Date().toISOString().split('T')[0],
        submissionDetails: {
          description: submissionData.description,
          techStack: submissionData.techStack.split(',').map(tech => tech.trim()).filter(tech => tech),
          sourceCodeUrl: submissionData.sourceCodeUrl,
          hostedAppUrl: submissionData.hostedAppUrl || undefined,
          additionalNotes: submissionData.additionalNotes || undefined,
          files: selectedFiles.map(file => file.name) // Store file names
        }
      });

      // Show success notification
      toast({
        title: "Solution Submitted Successfully!",
        description: "Your submission has been sent to the review panel.",
        duration: 3000,
      });

      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!challenge) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge Not Found</h1>
            <Link to="/">
              <Button size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Challenges
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to={`/challenge/${id}`}>
            <Button size="sm" variant="ghost" className="pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenge
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-sm font-bold text-gray-900 mb-2">Submit Solution</h1>
          <p className="text-xs text-gray-600">
            Submit your solution for: <span className="font-medium">{challenge.title}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Solution Details</CardTitle>
                <CardDescription className="text-xs">
                  Provide comprehensive details about your solution implementation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Solution Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your solution approach, key features, challenges faced, and how it meets the requirements..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a detailed explanation of your solution (minimum 50 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tech Stack */}
                    <FormField
                      control={form.control}
                      name="techStack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technologies Used (Free Text, comma-separated) *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., React, Node.js, MongoDB, Express, TypeScript, Tailwind CSS"
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter technologies and frameworks used in your solution, separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Source Code URL */}
                    <FormField
                      control={form.control}
                      name="sourceCodeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Code URL *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="https://github.com/username/repository"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Link to your GitHub repository or source code
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hosted App URL */}
                    <FormField
                      control={form.control}
                      name="hostedAppUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hosted Application URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="https://your-app.netlify.app"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Link to your deployed application (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Additional Notes */}
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information, future improvements, or special considerations..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Any extra information about your solution
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Upload Solution Files */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium leading-none">Upload Solution Files</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload your solution files, documentation, screenshots, or other supporting materials
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Upload solution files
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">
                                ZIP, PDF, DOC, images, text files up to 10MB each
                              </span>
                            </label>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".zip,.pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
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

                    {/* Additional Supporting Documents */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium leading-none">Additional Supporting Documents</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload any additional documentation, guides, or supplementary materials
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="mt-2">
                            <label htmlFor="additional-upload" className="cursor-pointer">
                              <span className="block text-sm font-medium text-gray-900">
                                Upload additional files
                              </span>
                              <span className="block text-xs text-gray-500 mt-1">
                                Optional: Documentation, guides, etc.
                              </span>
                            </label>
                            <input
                              id="additional-upload"
                              name="additional-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
                              onChange={handleFileUpload}
                            />
                          </div>
                        </div>
                      </div>
                    </div>



                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6">
                      <Link to={`/challenge/${id}`}>
                        <Button size="sm" type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button size="sm" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Submission Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Submit Your Solution
                </DialogTitle>
                <DialogDescription className="text-base">
                  Are you ready to submit your solution?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-700">
                  Once submitted, your status will be updated to <strong>"Submitted"</strong> and sent to the review panel.
                  You won't be able to make changes after submission.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    On submission:
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Save all provided details to the database</li>
                    <li>• Update the challenge status to "Submitted"</li>
                    <li>• Make it visible for reviewers on their review dashboard</li>
                  </ul>
                </div>


              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinalSubmission}
                  disabled={isSubmitting}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Confirm Submission'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Points:</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {challenge.points} pts
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">Technologies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {challenge.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>✅ Provide detailed solution description</p>
                  <p>✅ Include working source code repository</p>
                  <p>✅ Test your solution thoroughly</p>
                  <p>✅ Document any setup instructions</p>
                  <p>✅ Include hosted demo if applicable</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
