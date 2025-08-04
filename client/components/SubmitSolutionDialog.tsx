import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Code, Globe, Send, AlertTriangle, Upload } from 'lucide-react';

interface SubmitSolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeTitle: string;
  onSubmit: (data: SubmissionFormData) => void;
  loading?: boolean;
}

export interface SubmissionFormData {
  description: string;
  techStack: string;
  sourceCodeUrl: string;
  hostedUrl: string;
  solutionFiles: File[];
}



export default function SubmitSolutionDialog({
  open,
  onOpenChange,
  challengeTitle,
  onSubmit,
  loading = false
}: SubmitSolutionDialogProps) {
  const [formData, setFormData] = useState<SubmissionFormData>({
    description: '',
    techStack: '',
    sourceCodeUrl: '',
    hostedUrl: '',
    solutionFiles: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setFormData({
          description: '',
          techStack: '',
          sourceCodeUrl: '',
          hostedUrl: '',
          solutionFiles: []
        });
        setErrors({});
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim() || formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.techStack.trim()) {
      newErrors.techStack = 'Please enter at least one technology';
    }

    if (!formData.sourceCodeUrl.trim()) {
      newErrors.sourceCodeUrl = 'Source code URL is required';
    } else if (!isValidUrl(formData.sourceCodeUrl)) {
      newErrors.sourceCodeUrl = 'Please enter a valid URL';
    }

    if (formData.hostedUrl && !isValidUrl(formData.hostedUrl)) {
      newErrors.hostedUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      solutionFiles: [...prev.solutionFiles, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      solutionFiles: prev.solutionFiles.filter((_, i) => i !== index)
    }));
  };

  const isFormValid = formData.description.length >= 50 &&
                     formData.techStack.trim() &&
                     formData.sourceCodeUrl.trim() &&
                     isValidUrl(formData.sourceCodeUrl) &&
                     (!formData.hostedUrl || isValidUrl(formData.hostedUrl));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Submit Solution
          </DialogTitle>
          <DialogDescription>
            Submit your solution for: <strong>{challengeTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Solution Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Solution Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your solution approach, key features, challenges faced, and how it meets the requirements..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-32"
            />
            <div className="flex justify-between text-sm">
              <span className={errors.description ? 'text-red-600' : 'text-gray-500'}>
                {errors.description || `${formData.description.length}/50 characters minimum`}
              </span>
              <span className="text-gray-500">
                {formData.description.length} characters
              </span>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="space-y-2">
            <Label htmlFor="techStack" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Technologies Used (Free Text, comma-separated) *
            </Label>
            <Textarea
              id="techStack"
              placeholder="e.g., React, Node.js, MongoDB, Express, TypeScript, Tailwind CSS"
              value={formData.techStack}
              onChange={(e) => setFormData(prev => ({ ...prev, techStack: e.target.value }))}
              className="min-h-20"
            />
            <div className="text-sm text-gray-500">
              Enter technologies separated by commas
            </div>
            {errors.techStack && (
              <p className="text-sm text-red-600">{errors.techStack}</p>
            )}
          </div>

          {/* Source Code URL */}
          <div className="space-y-2">
            <Label htmlFor="sourceCode" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Source Code URL *
            </Label>
            <Input
              id="sourceCode"
              type="url"
              placeholder="https://github.com/username/repository"
              value={formData.sourceCodeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceCodeUrl: e.target.value }))}
            />
            {errors.sourceCodeUrl && (
              <p className="text-sm text-red-600">{errors.sourceCodeUrl}</p>
            )}
          </div>

          {/* Hosted URL */}
          <div className="space-y-2">
            <Label htmlFor="hostedUrl" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Live Demo URL (Optional)
            </Label>
            <Input
              id="hostedUrl"
              type="url"
              placeholder="https://your-app.netlify.app"
              value={formData.hostedUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, hostedUrl: e.target.value }))}
            />
            {errors.hostedUrl && (
              <p className="text-sm text-red-600">{errors.hostedUrl}</p>
            )}
          </div>

          {/* Upload Solution */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Solution Files
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="solution-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">
                      Upload solution files
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      ZIP, PDF, DOC, images up to 10MB each
                    </span>
                  </label>
                  <input
                    id="solution-upload"
                    name="solution-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept=".zip,.pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
            {formData.solutionFiles.length > 0 && (
              <div className="space-y-1 mt-2">
                {formData.solutionFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Before Submitting</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Ensure your code is well-documented and tested</li>
                    <li>• Verify all URLs are accessible and working</li>
                    <li>• Double-check that your solution meets all requirements</li>
                    <li>• Once submitted, your status will change to "In Review"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Solution
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
