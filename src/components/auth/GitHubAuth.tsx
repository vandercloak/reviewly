import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Loader2, AlertCircle, CheckCircle, Code2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { githubService } from '../../services/github';

interface GitHubAuthProps {
  onAuthComplete?: () => void;
}

export const GitHubAuth: React.FC<GitHubAuthProps> = ({ onAuthComplete }) => {
  const { setLoading, login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'instructions' | 'token' | 'verifying'>('initial');
  const [token, setToken] = useState('');

  const handleTokenAuth = async () => {
    if (!token.trim()) {
      setError('Please enter a valid GitHub token');
      return;
    }

    setStep('verifying');
    setError(null);
    setLoading(true);

    try {
      // Initialize GitHub service with token
      githubService.initialize(token);
      
      // Verify token by fetching user info
      const user = await githubService.getCurrentUser();
      
      // Store auth info
      login(user, token);
      
      // Success!
      setStep('initial');
      if (onAuthComplete) {
        onAuthComplete();
      }
    } catch (err: any) {
      console.error('Authentication failed:', err);
      setError(
        err.message.includes('401') 
          ? 'Invalid token. Please check your GitHub personal access token.'
          : err.message.includes('403')
          ? 'Token permissions insufficient. Please ensure your token has the required scopes.'
          : 'Authentication failed. Please try again.'
      );
      setStep('token');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthFlow = () => {
    // For demo purposes, we'll show instructions for token-based auth
    // In production, you'd implement proper OAuth flow
    setStep('instructions');
  };

  const renderInstructions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Connect GitHub Account</h3>
        <p className="text-gray-400">Create a personal access token to authenticate with GitHub</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-medium text-blue-400 mb-2">Required Token Permissions:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <code className="bg-gray-800 px-1.5 py-0.5 rounded">repo</code> - Access repositories</li>
            <li>• <code className="bg-gray-800 px-1.5 py-0.5 rounded">read:user</code> - Read user profile</li>
            <li>• <code className="bg-gray-800 px-1.5 py-0.5 rounded">read:org</code> - Read organization membership</li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-400">Follow these steps:</p>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></li>
            <li>Click "Generate new token (classic)"</li>
            <li>Select the required scopes listed above</li>
            <li>Generate and copy the token</li>
            <li>Paste it below</li>
          </ol>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setStep('token')}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          I have a token
        </button>
        <button
          onClick={() => setStep('initial')}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </motion.div>
  );

  const renderTokenInput = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Enter GitHub Token</h3>
        <p className="text-gray-400">Paste your personal access token below</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Personal Access Token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Your token is stored locally and never shared
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleTokenAuth}
          disabled={!token.trim() || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Connect</span>
            </>
          )}
        </button>
        <button
          onClick={() => setStep('instructions')}
          disabled={isLoading}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </motion.div>
  );

  const renderVerifying = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Connecting to GitHub</h3>
        <p className="text-gray-400">Verifying your credentials...</p>
      </div>
    </motion.div>
  );

  const renderInitial = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
          <Code2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Reviewly</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Connect your GitHub account to start reviewing code with AI-powered insights
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleOAuthFlow}
          className="w-full px-6 py-4 bg-[#24292f] hover:bg-[#32383f] text-white rounded-lg transition-colors flex items-center justify-center space-x-3 border border-gray-600"
        >
          <Github className="w-5 h-5" />
          <span className="font-medium">Connect with GitHub</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-900 text-gray-400">or</span>
          </div>
        </div>

        <button
          onClick={() => setStep('instructions')}
          className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <span>Use Personal Access Token</span>
        </button>
      </div>

      <div className="text-xs text-gray-500">
        <p>We use GitHub's API to access your repositories and pull requests.</p>
        <p>Your data is never stored on our servers.</p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8">
          {step === 'initial' && renderInitial()}
          {step === 'instructions' && renderInstructions()}
          {step === 'token' && renderTokenInput()}
          {step === 'verifying' && renderVerifying()}
        </div>
      </div>
    </div>
  );
};