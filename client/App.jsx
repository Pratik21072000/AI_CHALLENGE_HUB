import "./global.css";
import React, { useEffect } from "react";

import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
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
  useEffect(() => {
    console.log('🚀 Challenge Hub App Starting - Using Database Backend');
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