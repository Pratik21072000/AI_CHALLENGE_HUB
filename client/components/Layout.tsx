import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Home,
  Upload,
  Bell,
  Search,
  FileText,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import CreateChallengeDialog from '@/components/CreateChallengeDialog';
import ThemeToggle from '@/components/ThemeToggle';
import UserPointsDisplay from '@/components/UserPointsDisplay';
import PointsSystemMonitor from '@/components/PointsSystemMonitor';
import MySQLStatusIndicator from '@/components/MySQLStatusIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAccess } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-label-primary font-subheading text-primary">
                    InnovatePlatform
                  </span>
                  <div className="text-small-primary text-gray-500">Challenge Hub</div>
                </div>
              </Link>
            </div>



            {/* Navigation and User */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{user?.displayName.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
              </Avatar>

              <div className="hidden sm:block">
                <div className="text-small-primary font-label text-gray-900">{user?.displayName}</div>
                <div className="text-small-primary text-gray-500">{user?.department} | {user?.role}</div>
              </div>

              <UserPointsDisplay userId={user?.username || 'user-1'} userName={user?.username || 'User'} />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/my-submissions"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/my-submissions')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Submissions</span>
              </Link>

              {/* Review Challenges - Only visible to Management */}
              {hasAccess('Management') && (
                <Link
                  to="/review-challenges"
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive('/review-challenges')
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Review Challenges</span>
                </Link>
              )}

              <Link
                to="/leaderboard"
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/leaderboard')
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Leaderboard</span>
              </Link>
            </div>

            {/* Create Challenge Button on Right - Visible to both Employees and Management */}
            {(hasAccess('Employee') || hasAccess('Management')) && (
              <div className="py-4">
                <CreateChallengeDialog />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* MySQL Status Indicator - Hidden per user request */}
      {/* <MySQLStatusIndicator /> */}
    </div>
  );
}
