import { useState, useEffect } from 'react';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Challenge } from '@shared/types';

const techStackOptions = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C#', '.NET',
  'JavaScript', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'MySQL',
  'Redis', 'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'AI',
  'Blockchain', 'IoT', 'AR/VR', 'Mobile', 'Web3', 'TensorFlow', 'PyTorch'
];

const challengeSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  expectedOutcome: z.string().min(30, 'Expected outcome must be at least 30 characters'),
  techStack: z.array(z.string()).optional().default([]),
  points: z.number().min(0, 'Points must be a positive number'),
  penaltyPoints: z.number().min(0, 'Penalty points must be a positive number').optional()
});

type ChallengeForm = z.infer<typeof challengeSchema>;

interface EditChallengeDialogProps {
  challenge: Challenge;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditChallengeDialog({ challenge, isOpen, onOpenChange }: EditChallengeDialogProps) {
  const { updateChallenge } = useChallenges();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChallengeForm>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: challenge.title,
      description: challenge.description,
      expectedOutcome: challenge.expectedOutcome,
      techStack: challenge.tags || [],
      points: challenge.points,
      penaltyPoints: challenge.penaltyPoints || 0
    }
  });

  // Reset form when challenge changes
  useEffect(() => {
    form.reset({
      title: challenge.title,
      description: challenge.description,
      expectedOutcome: challenge.expectedOutcome,
      techStack: challenge.tags || [],
      points: challenge.points,
      penaltyPoints: challenge.penaltyPoints || 0
    });
  }, [challenge, form]);

  const onSubmit = async (data: ChallengeForm) => {
    setIsSubmitting(true);

    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update challenge using context
      updateChallenge(challenge.id, {
        title: data.title,
        description: data.description,
        fullDescription: data.description,
        expectedOutcome: data.expectedOutcome,
        tags: data.techStack,
        points: data.points,
        penaltyPoints: data.penaltyPoints
      });

      // Show success notification
      toast({
        title: "Challenge Updated Successfully!",
        description: `"${data.title}" has been updated.`,
        duration: 3000,
      });

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Challenge</DialogTitle>
          <DialogDescription>
            Update your challenge details, requirements, and expected outcomes.
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

            {/* Expected Outcome */}
            <FormField
              control={form.control}
              name="expectedOutcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Outcome *</FormLabel>
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

            {/* Total Points */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Points *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Points awarded for completing this challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Penalty Points */}
            <FormField
              control={form.control}
              name="penaltyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalty Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Points deducted for late submission or violations (optional)
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
                  <FormLabel>Technologies/Skills Required</FormLabel>
                  <FormDescription>
                    Select all technologies and skills relevant to this challenge
                  </FormDescription>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {techStackOptions.map((tech) => (
                      <div key={tech} className="flex items-center space-x-2">
                        <Checkbox
                          id={tech}
                          checked={field.value.includes(tech)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, tech]);
                            } else {
                              field.onChange(field.value.filter(item => item !== tech));
                            }
                          }}
                        />
                        <label
                          htmlFor={tech}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {tech}
                        </label>
                      </div>
                    ))}
                  </div>
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Challenge'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
