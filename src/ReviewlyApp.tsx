import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

// Components
import { GitHubAuth } from './components/auth/GitHubAuth';
import { AppLayout } from './components/layout/AppLayout';
import { PullRequestView } from './pages/PullRequestView';
import { SettingsView } from './pages/SettingsView';
import { ReviewDashboard } from './components/dashboard/ReviewDashboard';
import { CacheStatus } from './components/dev/CacheStatus';

// Store
import { useAuthStore } from './store/auth';
import { useAppStore } from './store/app';

// Services
import { githubService } from './services/github';
import { aiService } from './services/ai';

// Types
import { GitHubRepository, GitHubPullRequest } from './types/github';

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Route components
const Dashboard = ({ pullRequests, onPullRequestSelect, isLoading }: any) => (
  <motion.div
    key="dashboard"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="h-full"
  >
    <ReviewDashboard
      pullRequests={pullRequests}
      onPullRequestSelect={onPullRequestSelect}
      isLoading={isLoading}
    />
  </motion.div>
);

const PullRequestRoute = () => {
  const params = useParams();
  const { selectedPullRequest } = useAppStore();
  const navigate = useNavigate();
  
  if (!selectedPullRequest) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Pull Request Not Found</h2>
          <p className="text-gray-400 mb-4">The pull request you're looking for doesn't exist or hasn't been loaded.</p>
          <button 
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="pull-request"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <PullRequestView
        pullRequest={selectedPullRequest}
        onBack={() => navigate('/app')}
      />
    </motion.div>
  );
};

const SettingsRoute = () => (
  <motion.div
    key="settings"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="h-full overflow-y-auto"
  >
    <SettingsView />
  </motion.div>
);

export const ReviewlyApp: React.FC = () => {
  const { isAuthenticated, token, user } = useAuthStore();
  const { 
    selectedRepository, 
    selectedPullRequest,
    setSelectedRepository,
    setSelectedPullRequest,
    setRepositories,
    setCurrentView,
    isLoading,
    setLoading 
  } = useAppStore();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [repositories, setLocalRepositories] = useState<GitHubRepository[]>([]);
  const [allPullRequests, setAllPullRequests] = useState<GitHubPullRequest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !isInitialized) {
      initializeApp();
    }
  }, [isAuthenticated, token, isInitialized]);

  const initializeApp = async () => {
    // Initialize services immediately without blocking
    githubService.initialize(token!);
    
    // Initialize AI service if available
    const claudeApiKey = localStorage.getItem('claude-api-key');
    if (claudeApiKey) {
      try {
        aiService.initialize(claudeApiKey);
        console.log('AI service initialized');
      } catch (error) {
        console.warn('AI service initialization failed:', error);
      }
    }
    
    setIsInitialized(true);
    
    // Load data in background after initialization
    setLoading(true);
    
    // Start loading data without blocking the UI
    Promise.all([
      loadRepositories(),
      loadAllPullRequests()
    ]).finally(() => {
      setLoading(false);
    });
  };

  const loadRepositories = async () => {
    try {
      const repos = await githubService.getRepositories();
      setLocalRepositories(repos);
      setRepositories(repos);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    }
  };

  const loadAllPullRequests = async () => {
    try {
      const prs = await githubService.getAllPullRequestsAwaitingReview();
      setAllPullRequests(prs);
    } catch (error) {
      console.error('Failed to load pull requests awaiting review:', error);
      setAllPullRequests([]);
    }
  };

  const handlePullRequestSelect = (pr: GitHubPullRequest) => {
    setSelectedPullRequest(pr);
    setSelectedRepository(pr.base.repo);
    navigate(`/app/pr/${pr.base.repo.owner.login}/${pr.base.repo.name}/${pr.number}`);
  };

  const handleAuthComplete = () => {
    setIsInitialized(false); // Trigger re-initialization
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-black">
          <GitHubAuth onAuthComplete={handleAuthComplete} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F3F4F6',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </div>
      </QueryClientProvider>
    );
  }

  // Skip the initialization screen and go straight to the app

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-black text-white">
        <AppLayout
          repositories={repositories}
          pullRequests={allPullRequests}
          onPullRequestSelect={handlePullRequestSelect}
        >
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  pullRequests={allPullRequests}
                  onPullRequestSelect={handlePullRequestSelect}
                  isLoading={isLoading}
                />
              } 
            />
            <Route 
              path="/pr/:owner/:repo/:number" 
              element={<PullRequestRoute />} 
            />
            <Route 
              path="/settings" 
              element={<SettingsRoute />} 
            />
          </Routes>
        </AppLayout>

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                />
                <span className="text-white">Loading...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1F2937',
              color: '#F3F4F6',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        
        {/* Development Cache Status */}
        <CacheStatus />
      </div>
    </QueryClientProvider>
  );
};