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
const Dashboard = ({ pullRequests, onPullRequestSelect, isLoading, rateLimitError }: any) => (
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
      rateLimitError={rateLimitError}
    />
  </motion.div>
);

const PullRequestRoute = () => {
  const params = useParams();
  const { selectedPullRequest, setSelectedPullRequest } = useAppStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract params
  const { owner, repo, number } = params;

  // Try to fetch PR if not in store but we have URL params
  useEffect(() => {
    if (!selectedPullRequest && owner && repo && number) {
      fetchPullRequestFromParams();
    }
  }, [selectedPullRequest, owner, repo, number]);

  const fetchPullRequestFromParams = async () => {
    if (!owner || !repo || !number) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching PR from URL: ${owner}/${repo}#${number}`);
      const pr = await githubService.getPullRequest(owner, repo, parseInt(number));
      setSelectedPullRequest(pr);
      console.log(`✅ Loaded PR from URL: ${pr.title}`);
    } catch (error: any) {
      console.error('❌ Failed to fetch PR from URL:', error);
      setError('Failed to load pull request. It may not exist or you may not have access.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching from URL
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Pull Request</h2>
          <p className="text-gray-400">Fetching {owner}/{repo}#{number}...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Pull Request Not Found</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/app')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={fetchPullRequestFromParams}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show not found if no PR and no params
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
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

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
    
    // Don't show loading on refresh - let cached data load instantly
    // Only show loading on first visit when there's truly no data
    const hasExistingData = allPullRequests.length > 0 || repositories.length > 0;
    
    // Only show loading if this is truly a first-time load
    if (!hasExistingData) {
      // Check if this looks like a page refresh by checking for any cached data
      const hasAnyCachedData = Object.keys(localStorage).some(key => 
        key.startsWith('repo_') || key.includes('cache') || key.includes('prs')
      );
      
      if (!hasAnyCachedData) {
        setLoading(true);
      }
    }
    
    // Start loading data
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
      setRateLimitError(null); // Clear any previous rate limit errors
      
      // 🚀 Eager loading: Pass callback to handle real-time updates
      const prs = await githubService.getAllPullRequestsAwaitingReview((freshPRs) => {
        console.log('🔄 Received fresh PR data, updating UI...');
        setAllPullRequests(freshPRs);
      });
      
      // Set initial data (either cached or fresh)
      setAllPullRequests(prs);
    } catch (error: any) {
      console.error('Failed to load pull requests awaiting review:', error);
      setAllPullRequests([]);
      
      // Handle different types of errors
      if (error.message.includes('rate limit exceeded')) {
        setRateLimitError(error.message);
      } else if (error.message.includes('authentication failed') || error.message.includes('401')) {
        console.warn('Authentication failed, user may need to re-authenticate');
        // Note: In a production app, you might want to trigger a re-authentication flow here
      }
    }
  };

  const handlePullRequestSelect = (pr: GitHubPullRequest) => {
    console.log('🔍 Selected PR data:', {
      number: pr.number,
      title: pr.title,
      base: pr.base,
      repo_name: pr.base?.repo?.name,
      repo_full_name: pr.base?.repo?.full_name,
      owner: pr.base?.repo?.owner?.login
    });
    
    setSelectedPullRequest(pr);
    setSelectedRepository(pr.base.repo);
    
    // Use full_name if available, otherwise extract from URL or use fallback
    const repoName = pr.base?.repo?.name || 
                     pr.base?.repo?.full_name?.split('/')[1] || 
                     pr.repository?.name ||
                     'unknown';
    const ownerName = pr.base?.repo?.owner?.login || 
                      pr.base?.repo?.full_name?.split('/')[0] ||
                      pr.repository?.owner?.login ||
                      'unknown';
                      
    console.log('🔗 Navigating to:', `/app/pr/${ownerName}/${repoName}/${pr.number}`);
    navigate(`/app/pr/${ownerName}/${repoName}/${pr.number}`);
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
                  rateLimitError={rateLimitError}
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