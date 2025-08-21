import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  GitBranch, 
  Settings, 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Star,
  GitPullRequest,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  MoreHorizontal,
  Filter,
  SortAsc,
  Calendar,
  User,
  Hash,
  Eye,
  MessageSquare,
  Bot,
  Minus
} from 'lucide-react';
import { useAppStore } from '../../store/app';
import { useAuthStore } from '../../store/auth';
import { GitHubRepository, GitHubPullRequest } from '../../types/github';

interface SidebarProps {
  repositories: GitHubRepository[];
  pullRequests: GitHubPullRequest[];
  onPullRequestSelect: (pr: GitHubPullRequest) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repositories,
  pullRequests,
  onPullRequestSelect,
}) => {
  const { sidebarCollapsed, currentView, selectedRepository, selectedPullRequest, setCurrentView } = useAppStore();
  const { user } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState({
    repositories: true,
    pullRequests: true,
    recent: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed' | 'draft'>('open');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPullRequests = pullRequests
    .filter(pr => {
      if (filterState === 'all') return true;
      if (filterState === 'draft') return pr.draft;
      return pr.state === filterState;
    })
    .filter(pr =>
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.user.login.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  const getPRStatusIcon = (pr: GitHubPullRequest) => {
    if (pr.draft) return <Circle className="w-4 h-4 text-gray-400" />;
    if (pr.state === 'closed') return <CheckCircle className="w-4 h-4 text-purple-400" />;
    if (pr.state === 'merged') return <GitBranch className="w-4 h-4 text-purple-400" />;
    return <GitPullRequest className="w-4 h-4 text-green-400" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Code2 className="w-6 h-6 text-white" />
        </div>
        <div className="w-full h-px bg-gray-700" />
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <GitBranch className="w-5 h-5 text-gray-400" />
        </button>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <GitPullRequest className="w-5 h-5 text-gray-400" />
        </button>
        <button 
          onClick={() => setCurrentView('settings')}
          className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
            currentView === 'settings' ? 'bg-gray-800' : ''
          }`}
        >
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Reviewly</h1>
            <p className="text-xs text-gray-400">AI-Powered Code Reviews</p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name || user.login}</p>
              <p className="text-xs text-gray-400 truncate">@{user.login}</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories, PRs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Repositories Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('repositories')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              {expandedSections.repositories ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Repositories ({filteredRepositories.length})</span>
            </button>
            <button className="p-1 hover:bg-gray-800 rounded">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.repositories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1"
              >
                {filteredRepositories.slice(0, 10).map((repo) => (
                  <motion.button
                    key={repo.id}
                    onClick={() => onRepositorySelect(repo)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                      selectedRepository?.id === repo.id ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-start space-x-3">
                      <GitBranch className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white truncate">{repo.name}</p>
                          {repo.private && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-400 truncate mt-1">{repo.description}</p>
                        )}
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          {repo.language && (
                            <span className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                              <span>{repo.language}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{repo.stargazers_count}</span>
                          </span>
                          <span>{formatTimeAgo(repo.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pull Requests Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('pullRequests')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              {expandedSections.pullRequests ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Pull Requests ({filteredPullRequests.length})</span>
            </button>
            <div className="flex items-center space-x-1">
              <button 
                className="p-1 hover:bg-gray-800 rounded"
                title="Filter"
              >
                <Filter className="w-4 h-4 text-gray-400" />
              </button>
              <button 
                className="p-1 hover:bg-gray-800 rounded"
                title="Sort"
              >
                <SortAsc className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-3 bg-gray-800 rounded-lg p-1">
            {(['all', 'open', 'closed', 'draft'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterState(filter)}
                className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                  filterState === filter
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {expandedSections.pullRequests && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1"
              >
                {filteredPullRequests.map((pr) => (
                  <motion.button
                    key={pr.id}
                    onClick={() => onPullRequestSelect(pr)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                      selectedPullRequest?.id === pr.id ? 'bg-green-600/20 border-l-2 border-green-500' : ''
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-start space-x-3">
                      {getPRStatusIcon(pr)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-white truncate">{pr.title}</p>
                          <span className="text-xs text-gray-400">#{pr.number}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            by {pr.user.login}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(pr.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Plus className="w-3 h-3 text-green-400" />
                            <span>{pr.additions}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Minus className="w-3 h-3 text-red-400" />
                            <span>{pr.deletions}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span>{pr.commits}</span>
                          </span>
                        </div>
                        {pr.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pr.labels.slice(0, 3).map((label) => (
                              <span
                                key={label.id}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `#${label.color}20`,
                                  color: `#${label.color}`,
                                }}
                              >
                                {label.name}
                              </span>
                            ))}
                            {pr.labels.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{pr.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recent Activity */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('recent')}
              className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              {expandedSections.recent ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Recent Activity</span>
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.recent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <div className="p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <div className="flex items-center space-x-2 mb-1">
                    <Bot className="w-3 h-3 text-purple-400" />
                    <span>AI Review completed</span>
                  </div>
                  <p>Found 3 suggestions in feature/auth-system</p>
                </div>
                <div className="p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <div className="flex items-center space-x-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-blue-400" />
                    <span>New comment</span>
                  </div>
                  <p>Sarah reviewed your PR #124</p>
                </div>
                <div className="p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>PR merged</span>
                  </div>
                  <p>fix: update dependencies #123</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>AI Status: Online</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('settings')}
            className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${
              currentView === 'settings' ? 'bg-gray-800' : ''
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};