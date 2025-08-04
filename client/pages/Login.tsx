import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid username or password. Please check your credentials and try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (username: string, password: string) => {
    setFormData({ username, password });
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username.length > 0 && formData.password.length > 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Platform Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-heading-primary text-gray-900">InnovatePlatform</h1>
          <p className="text-subheading-primary text-gray-600">Challenge Hub</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access your challenges and submissions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-label-primary text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-label-primary text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Login Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center font-medium">Demo Accounts</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleDemoLogin('employee01', 'pass123')}
                  disabled={isSubmitting}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login as Employee 01
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleDemoLogin('employee02', 'pass234')}
                  disabled={isSubmitting}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login as Employee 02
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => handleDemoLogin('employee03', 'pass345')}
                  disabled={isSubmitting}
                >
                  <User className="w-4 h-4 mr-2" />
                  Login as Employee 03
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => handleDemoLogin('manager01', 'admin456')}
                  disabled={isSubmitting}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Login as Manager
                </Button>
              </div>
            </div>

            {/* Credentials Info */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p className="font-medium mb-1">Test Credentials:</p>
              <div className="space-y-1">
                <p><strong>Employee 01:</strong> employee01 / pass123</p>
                <p><strong>Employee 02:</strong> employee02 / pass234</p>
                <p><strong>Employee 03:</strong> employee03 / pass345</p>
                <p><strong>Manager:</strong> manager01 / admin456</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
