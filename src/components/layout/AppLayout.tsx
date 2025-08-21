import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Settings, 
  Bell, 
  Search,
  Command,
  Palette,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Github,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useAppStore } from '../../store/app';
import { useAuthStore } from '../../store/auth';
import { Sidebar } from '../sidebar/Sidebar';
import { GitHubRepository, GitHubPullRequest } from '../../types/github';

interface AppLayoutProps {
  children: React.ReactNode;
  repositories?: GitHubRepository[];
  pullRequests?: GitHubPullRequest[];
  onPullRequestSelect?: (pr: GitHubPullRequest) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  repositories = [],
  pullRequests = [],
  onPullRequestSelect = () => {},
}) => {
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    selectedRepository,
    selectedPullRequest,
    theme,
    layoutMode,
    setLayoutMode 
  } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Toggle sidebar (Cmd/Ctrl + B)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Escape to close command palette
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const getPageTitle = () => {
    if (location.pathname === '/app') return 'Dashboard';
    if (location.pathname.includes('/pr/')) return 'Pull Request Review';
    if (location.pathname === '/app/settings') return 'Settings';
    return 'Reviewly';
  };

  const getBreadcrumbs = () => {
    const crumbs = ['Reviewly'];
    if (selectedRepository) {
      crumbs.push(selectedRepository.name);
    }
    if (selectedPullRequest) {
      crumbs.push(`PR #${selectedPullRequest.number}`);
    }
    return crumbs;
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Back to Dashboard Button */}
            {location.pathname !== '/app' && (
              <button
                onClick={() => navigate('/app')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Dashboard</span>
              </button>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              {getBreadcrumbs().map((crumb, index, arr) => (
                <React.Fragment key={index}>
                  <span className={index === arr.length - 1 ? 'text-white font-medium' : 'text-gray-400'}>
                    {crumb}
                  </span>
                  {index < arr.length - 1 && (
                    <span className="text-gray-600">/</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Center Section */}
          <div className="flex-1 max-w-xl mx-4">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-left text-gray-400 hover:bg-gray-800 hover:border-gray-600 transition-colors flex items-center space-x-3"
            >
              <Search className="w-4 h-4" />
              <span>Search repositories, files, code...</span>
              <div className="ml-auto flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded border border-gray-600">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-700 rounded border border-gray-600">K</kbd>
              </div>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Layout Mode Toggle */}
            <div className="flex items-center bg-gray-900 rounded-lg p-1">
              {(['split', 'unified', 'side-by-side'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    layoutMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={`${mode} layout`}
                >
                  {mode === 'split' && '⚊'}
                  {mode === 'unified' && '▤'}
                  {mode === 'side-by-side' && '◫'}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            {selectedPullRequest && (
              <a
                href={selectedPullRequest.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="View PR on GitHub"
              >
                <Github className="w-4 h-4 text-gray-400" />
              </a>
            )}

            <button
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-gray-400" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* AI Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Zap className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400 font-medium">AI Online</span>
            </div>

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-8 h-8 rounded-full border border-gray-600"
                />
                <button className="p-1 hover:bg-gray-800 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </header>


        {/* Main Content Area */}
        <main className="flex-1 min-h-0 bg-black">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <Command className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-xs bg-gray-800 rounded border border-gray-600">ESC</kbd>
                </div>
              </div>
              
              <div className="p-2 max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Quick Actions
                  </div>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg flex items-center space-x-3">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>Search repositories</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg flex items-center space-x-3">
                    <Palette className="w-4 h-4 text-gray-400" />
                    <span>Change theme</span>
                  </button>
                  <button 
                    onClick={() => navigate('/app/settings')}
                    className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg flex items-center space-x-3"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Open settings</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};