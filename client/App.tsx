import "./global.css";
import React, { useEffect } from "react";
import { DataPersistenceMonitor } from "./utils/dataPersistenceMonitor";
import DataMigration from "./utils/dataMigration";
import { storageService } from "./services/storageService";
import { initializeDemoData } from "./utils/demoDataInitializer";
// Removed problematic data reset utilities that were clearing data on refresh

// Import utilities for debugging (only in development)
if (import.meta.env.DEV) {
  import('./utils/preserveData'); // Load first to protect data
  import('./utils/verifyDataPersistence');
  import('./utils/verifyButtonBehavior');
  import('./utils/preventReloadLoop');
  import('./utils/apiTest');
  import('./utils/apiHealthMonitor');
  import('./services/storageService');
  import('./services/mysqlStorageService');
  import('./utils/dataMigration');
  import('./utils/supabaseSetup');
  import('./services/supabaseService');
  import('./utils/challengeDebugger');
  import('./utils/debugAcceptances');
  import('./utils/cleanupAcceptances');
  import('./utils/emergencyCleanup');
  import('./utils/fixDataPersistence');
  import('./utils/enforceLocalStorage');
  import('./utils/emergencyActiveChallengeFix');
  import('./utils/userChallengeFix');
  import('./utils/stateSynchronizer');
  import('./utils/refreshChallengeStatus');
  import('./utils/ensureDataConsistency');
  import('./utils/testMultiEmployeeWorkflow');
  import('./utils/fixStuckEmployees');
  import('./utils/dataSyncUtility');
  import('./utils/immediateCleanup'); // Clean up withdrawn challenges
  import('./utils/dataRecovery'); // Data recovery utilities
  import('./utils/fixLostData'); // Fix lost data issues
  import('./utils/manualDataRestore'); // Manual restore utilities
  import('./utils/testPointsCalculation'); // Test points calculation
  import('./utils/generateLeaderboardTestData'); // Generate leaderboard test data
  import('./utils/pointsRefresh'); // Points refresh utility
  import('./utils/leaderboardRefresh'); // Leaderboard refresh system
  import('./utils/demoDataInitializer'); // Demo data initialization
  import('./utils/testLocalStoragePersistence'); // Test localStorage persistence
  import('./utils/fixDataConsistency'); // Fix data consistency issues
  import('./utils/completeDataReset'); // Complete data reset for demo
  import('./utils/fixChallengeAcceptance'); // Fix challenge acceptance issues
  import('./utils/debugEmployee03'); // Debug employee03 acceptance issues
  import('./utils/fixEmployee03ActiveChallenge'); // Fix employee03 active challenge issue
  import('./utils/acceptanceSynchronizer'); // Sync acceptance data between pages
  import('./utils/immediateDOMFix'); // Immediate DOM-based fix
  import('./utils/acceptanceMonitor'); // Monitor acceptance state for demo reliability
  // Removed problematic auto-refresh utilities
  // executeStorageFix removed to stop continuous refresh
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChallengesProvider } from "./contexts/ChallengesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ChallengeAcceptanceProvider } from "./contexts/ChallengeAcceptanceContext";
import { SubmissionProvider } from "./contexts/SubmissionContext";
import { SubmissionReviewProvider } from "./contexts/SubmissionReviewContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import ChallengeDetail from "./pages/ChallengeDetail";
import ChallengeSubmission from "./pages/ChallengeSubmission";
import SubmissionViewer from "./pages/SubmissionViewer";
import Submit from "./pages/Submit";
import MySubmissions from "./pages/MySubmissions";
import ReviewChallenges from "./pages/ReviewChallenges";
import NewLeaderboard from "./pages/NewLeaderboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize MySQL backend and monitor data persistence
  useEffect(() => {
    console.log('🚀 Challenge Hub App Starting - Initializing MySQL Backend');

    // Initialize demo data for localStorage persistence (without clearing existing data)
    import('./utils/demoDataInitializer').then(({ initializeDemoData }) => {
      // Only initialize if no data exists
      const hasExistingData = localStorage.getItem('challengeHub_challenges') ||
                              localStorage.getItem('challengeHub_acceptances');
      if (!hasExistingData) {
        initializeDemoData();
      }
    });

    // Validate demo data in development (no auto-refresh)
    if (import.meta.env.DEV) {
      import('./utils/validateDemoData').then(({ validateDemoData }) => {
        setTimeout(() => {
          validateDemoData();
        }, 1500);
      });
    }

    // Initialize MySQL storage service
    storageService.initialize().then(() => {
      console.log('✅ Storage service initialized');

      setTimeout(() => {
        DataPersistenceMonitor.getStorageSummary();

        // Data integrity check and debugging
        const acceptances = storageService.getAcceptances();
        const totalUsers = [...new Set(acceptances.map(acc => acc.username))].length;

        console.log('📊 Data integrity check:', {
          acceptances: acceptances.length,
          totalUsers,
          uniqueUsernames: [...new Set(acceptances.map(acc => acc.username))]
        });

        // Enable localStorage debugging
        (window as any).debugStorage = () => {
          console.log('🔍 Current localStorage state:');
          Object.keys(localStorage).filter(key => key.startsWith('challengeHub_')).forEach(key => {
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value ? JSON.parse(value) : null);
          });
        };

        console.log('🔧 Use debugStorage() in console to inspect localStorage');

        // Run data migration to fix stuck challenges
        if (import.meta.env.DEV) {
          console.log('🔄 Running data migration check...');
          DataMigration.autoMigrate();

          // Show storage status
          setTimeout(() => {
            if (storageService.isUsingMySQL()) {
              console.log('\n🗄️ MYSQL ACTIVE: Data is now synced across devices!');
              console.log('📱 Changes on this device will appear on other devices automatically.');
              console.log('🔄 Run "migrateToMySQL()" to migrate existing localStorage data.');
            } else {
              console.log('\n💾 LOCALHOST ONLY: Data stored locally (device-specific).');
              console.log('📋 For cross-device sync, ensure MySQL backend is available.');
            }
            console.log('🔍 Run "debugSystem()" to see current data status.');
          }, 3000);
        }
      }, 1500); // Wait a bit for contexts to load
    }).catch(error => {
      console.error('❌ Storage initialization failed:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ChallengesProvider>
            <ChallengeAcceptanceProvider>
              <SubmissionProvider>
                <SubmissionReviewProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/challenge/:id" element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>} />
                      <Route path="/challenge/:id/submit" element={<ProtectedRoute><ChallengeSubmission /></ProtectedRoute>} />
                      <Route path="/submission/:challengeId/:username" element={<ProtectedRoute><SubmissionViewer /></ProtectedRoute>} />
                      <Route path="/submit" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
                      <Route path="/my-submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
                      <Route path="/review-challenges" element={<ProtectedRoute><ReviewChallenges /></ProtectedRoute>} />
                      <Route path="/leaderboard" element={<ProtectedRoute><NewLeaderboard /></ProtectedRoute>} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </SubmissionReviewProvider>
              </SubmissionProvider>
            </ChallengeAcceptanceProvider>
          </ChallengesProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
