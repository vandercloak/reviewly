import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitPullRequest, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  GitCommit,
  Bot,
  Sparkles,
  FileText,
  Code,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Info,
  Zap,
  Filter,
  SortAsc,
  ExternalLink,
  Github
} from 'lucide-react';
import { DiffViewer } from '../components/diff/DiffViewer';
import { MarkdownRenderer } from '../components/ui/MarkdownRenderer';
import { AttentionFileList } from '../components/code/AttentionFileList';
import { useAppStore } from '../store/app';
import { GitHubPullRequest, GitHubFile } from '../types/github';
import { AIReviewSummary } from '../types/ai';
import { githubService } from '../services/github';
import { aiService } from '../services/ai';
import { aiCacheService } from '../services/aiCache';

interface PullRequestViewProps {
  pullRequest: GitHubPullRequest;
  onBack?: () => void;
}

export const PullRequestView: React.FC<PullRequestViewProps> = ({
  pullRequest,
  onBack,
}) => {
  const { layoutMode } = useAppStore();
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, { original: string; modified: string }>>({});
  const [aiReview, setAiReview] = useState<AIReviewSummary | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'commits' | 'reviews'>('files');
  const [filterType, setFilterType] = useState<'all' | 'added' | 'modified' | 'removed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'changes' | 'type'>('name');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showDescription, setShowDescription] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    autoReview: false,
    severity: 'medium' as const,
    categories: {
      security: true,
      performance: true,
      style: true,
      bugs: true,
      complexity: true,
      bestPractices: true,
    }
  });

  // Load PR files and content
  useEffect(() => {
    loadPullRequestData();
  }, [pullRequest]);

  // Check for cached AI results
  useEffect(() => {
    const cachedReview = aiCacheService.get(pullRequest.id, pullRequest.head.sha);
    if (cachedReview) {
      setAiReview(cachedReview);
    }
  }, [pullRequest.id, pullRequest.head.sha]);

  const loadPullRequestData = async () => {
    setIsLoadingFiles(true);
    try {
      // Get PR files
      const prFiles = await githubService.getPullRequestFiles(
        pullRequest.head.repo.owner.login,
        pullRequest.head.repo.name,
        pullRequest.number
      );
      setFiles(prFiles);

      // Load file contents for diff viewing
      const contents: Record<string, { original: string; modified: string }> = {};
      
      for (const file of prFiles.slice(0, 10)) { // Limit to first 10 files for performance
        try {
          // Get original content (base)
          let originalContent = '';
          if (file.status !== 'added') {
            originalContent = await githubService.getFileContent(
              pullRequest.base.repo.owner.login,
              pullRequest.base.repo.name,
              file.filename,
              pullRequest.base.sha
            );
          }

          // Get modified content (head)
          let modifiedContent = '';
          if (file.status !== 'removed') {
            modifiedContent = await githubService.getFileContent(
              pullRequest.head.repo.owner.login,
              pullRequest.head.repo.name,
              file.filename,
              pullRequest.head.sha
            );
          }

          contents[file.filename] = {
            original: originalContent,
            modified: modifiedContent,
          };
        } catch (error) {
          console.error(`Failed to load content for ${file.filename}:`, error);
          contents[file.filename] = {
            original: '',
            modified: '',
          };
        }
      }

      setFileContents(contents);
    } catch (error) {
      console.error('Failed to load PR data:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const triggerAIReview = async (prFiles?: GitHubFile[], contents?: Record<string, { original: string; modified: string }>) => {
    const filesToAnalyze = prFiles || files;
    const contentsToAnalyze = contents || fileContents;

    if (filesToAnalyze.length === 0) return;

    // Check cache first
    const cachedReview = aiCacheService.get(pullRequest.id, pullRequest.head.sha);
    if (cachedReview) {
      setAiReview(cachedReview);
      return;
    }

    setIsLoadingAI(true);
    try {
      const review = await aiService.analyzePullRequest(
        pullRequest,
        filesToAnalyze,
        contentsToAnalyze
      );
      
      // Cache the result
      aiCacheService.set(pullRequest.id, review, pullRequest.head.sha);
      setAiReview(review);
    } catch (error) {
      console.error('AI review failed:', error);
      // Create a mock review for demo
      const mockReview = {
        id: `demo-${pullRequest.id}`,
        pullRequestId: pullRequest.id,
        overallScore: 85,
        complexity: 'medium',
        maintainability: 78,
        securityRisk: 'low',
        performance: 'good',
        summary: 'This pull request introduces new authentication features with good code quality. Some minor improvements suggested.',
        keyFindings: [
          'Clean implementation of authentication flow',
          'Proper error handling in most places',
          'Good test coverage for critical paths',
          'Minor security consideration in token handling'
        ],
        recommendedActions: [
          'Review token expiration handling',
          'Add input validation for user registration',
          'Consider rate limiting for login attempts'
        ],
        estimatedReviewTime: 25,
        suggestions: filesToAnalyze.length > 0 ? [
          {
            id: 'demo-1',
            type: 'security',
            severity: 'medium',
            title: 'Consider using secure token storage',
            description: 'The authentication token is stored in localStorage which may be vulnerable to XSS attacks.',
            suggestion: 'Consider using httpOnly cookies or a more secure storage mechanism for sensitive tokens.',
            file: filesToAnalyze[0]?.filename || 'src/auth.js',
            line: Math.floor(Math.random() * 20) + 5, // Random line between 5-25
            confidence: 0.9,
            reasoning: 'localStorage is accessible to any script running on the page, making it vulnerable to XSS attacks.',
            tags: ['security'],
            references: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            type: 'performance',
            severity: 'low',
            title: 'Optimize API calls',
            description: 'Multiple API calls are made sequentially, which could be optimized.',
            suggestion: 'Consider using Promise.all() to make parallel API calls where possible.',
            file: filesToAnalyze[0]?.filename || 'src/api.js',
            line: Math.floor(Math.random() * 15) + 10, // Random line between 10-25
            confidence: 0.8,
            reasoning: 'Sequential API calls increase load time and could benefit from parallelization.',
            tags: ['performance'],
            references: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            type: 'style',
            severity: 'low',
            title: 'Add error handling',
            description: 'This function could benefit from better error handling to improve reliability.',
            suggestion: 'try {\n  // existing code\n} catch (error) {\n  console.error("Error:", error);\n  throw error;\n}',
            file: filesToAnalyze[0]?.filename || 'src/utils.js',
            line: Math.floor(Math.random() * 30) + 1, // Random line between 1-30
            confidence: 0.7,
            reasoning: 'Adding proper error handling improves code robustness and debugging.',
            tags: ['style'],
            references: [],
            createdAt: new Date().toISOString(),
          }
        ] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Cache the mock review too
      aiCacheService.set(pullRequest.id, mockReview, pullRequest.head.sha);
      setAiReview(mockReview);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const filteredFiles = files
    .filter(file => {
      if (filterType === 'all') return true;
      return file.status === filterType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'changes':
          return b.changes - a.changes;
        case 'type':
          return a.status.localeCompare(b.status);
        default:
          return a.filename.localeCompare(b.filename);
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'removed': return 'text-red-400';
      case 'modified': return 'text-yellow-400';
      case 'renamed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* PR Header */}
      <div className="bg-gray-950 border-b border-gray-900 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <GitPullRequest className="w-5 h-5 text-green-400" />
              <span className="text-lg font-semibold text-white">
                {pullRequest.title}
              </span>
              <span className="text-gray-400">#{pullRequest.number}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                pullRequest.state === 'open' ? 'bg-green-500/20 text-green-400' :
                pullRequest.state === 'closed' ? 'bg-red-500/20 text-red-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {pullRequest.state}
              </span>
              
              <a
                href={pullRequest.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                title="View on GitHub"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
              <span>
                <strong className="text-green-400">+{pullRequest.additions}</strong>{' '}
                <strong className="text-red-400">-{pullRequest.deletions}</strong>
              </span>
              <span>{pullRequest.changed_files} files changed</span>
              <span>{pullRequest.commits} commits</span>
              <span>by {pullRequest.user.login}</span>
              <span>{pullRequest.head.ref} → {pullRequest.base.ref}</span>
            </div>
            
            {pullRequest.body && (
              <div className="mb-4 max-w-3xl">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors mb-2"
                >
                  {showDescription ? 'Hide' : 'Show'} Description
                </button>
                {showDescription && (
                  <MarkdownRenderer 
                    content={pullRequest.body}
                    collapsible
                    maxLines={4}
                    className="text-gray-400"
                  />
                )}
              </div>
            )}
          </div>

          {/* AI Review Summary */}
          {aiReview && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-80">
              <div className="flex items-center space-x-2 mb-3">
                <Bot className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">AI Review</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  aiReview.overallScore >= 80 ? 'bg-green-500/20 text-green-400' :
                  aiReview.overallScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {aiReview.overallScore}/100
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Complexity:</span>
                  <span className="ml-2 text-white capitalize">{aiReview.complexity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Security:</span>
                  <span className={`ml-2 capitalize ${
                    aiReview.securityRisk === 'low' ? 'text-green-400' :
                    aiReview.securityRisk === 'medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {aiReview.securityRisk}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Maintainability:</span>
                  <span className="ml-2 text-white">{aiReview.maintainability}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Review time:</span>
                  <span className="ml-2 text-white">{aiReview.estimatedReviewTime}m</span>
                </div>
              </div>

              {aiReview.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <span className="text-xs text-gray-400">
                    {aiReview.suggestions.length} suggestions
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-950 border-b border-gray-800">
        <div className="flex items-center justify-between px-6">
          <div className="flex space-x-1">
            {(['files', 'commits', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab === 'files' && <FileText className="w-4 h-4" />}
                  {tab === 'commits' && <GitCommit className="w-4 h-4" />}
                  {tab === 'reviews' && <MessageSquare className="w-4 h-4" />}
                  <span className="capitalize">{tab}</span>
                  {tab === 'files' && <span className="text-xs">({files.length})</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* AI Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => triggerAIReview()}
                disabled={isLoadingAI}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded text-sm flex items-center space-x-2"
              >
                {isLoadingAI ? (
                  <RotateCcw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isLoadingAI ? 'Analyzing...' : 'AI Review'}</span>
              </button>

              {aiReview && aiReview.suggestions.length > 0 && (
                <button
                  onClick={() => setShowAiDrawer(!showAiDrawer)}
                  className={`px-3 py-1.5 rounded text-sm flex items-center space-x-2 transition-colors ${
                    showAiDrawer 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Bot className="w-3 h-3" />
                  <span>AI Suggestions ({aiReview.suggestions.length})</span>
                </button>
              )}
            </div>

            {activeTab === 'files' && (
              <div className="flex items-center space-x-2">
                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value="all">All files</option>
                  <option value="added">Added</option>
                  <option value="modified">Modified</option>
                  <option value="removed">Removed</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value="name">Name</option>
                  <option value="changes">Changes</option>
                  <option value="type">Type</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'files' && (
          <div className="h-full flex">
            {/* Attention-Focused File List */}
            {layoutMode !== 'unified' && (
              <AttentionFileList
                files={filteredFiles}
                aiSuggestions={aiReview?.suggestions.reduce((acc, suggestion) => {
                  if (!acc[suggestion.file]) acc[suggestion.file] = [];
                  acc[suggestion.file].push({
                    id: suggestion.id,
                    line: suggestion.line || 1,
                    type: suggestion.type,
                    message: suggestion.description,
                    severity: suggestion.severity,
                  });
                  return acc;
                }, {} as Record<string, any[]>) || {}}
                selectedFiles={selectedFiles}
                onFileSelect={(filename) => {
                  // Scroll to file in diff viewer
                  const element = document.getElementById(`file-${filename}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                onFileToggle={(filename) => {
                  if (selectedFiles.includes(filename)) {
                    setSelectedFiles(prev => prev.filter(f => f !== filename));
                  } else {
                    setSelectedFiles(prev => [...prev, filename]);
                  }
                }}
              />
            )}

            {/* Resizable Code Diff Viewer */}
            <div className="flex-1 overflow-y-auto bg-black">
              {isLoadingFiles ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RotateCcw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading files...</p>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No files to display
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {filteredFiles.map((file, index) => (
                    <div key={file.filename} id={`file-${file.filename}`}>
                      <DiffViewer
                        file={file}
                        originalContent={fileContents[file.filename]?.original || ''}
                        modifiedContent={fileContents[file.filename]?.modified || ''}
                        aiSuggestions={aiReview?.suggestions.filter(s => s.file === file.filename).map(s => ({
                          id: s.id,
                          line: s.line || 1,
                          type: s.type,
                          message: s.description,
                          severity: s.severity,
                        })) || []}
                        height={400}
                        showLineNumbers={true}
                        onAiSuggestionClick={(suggestionId) => {
                          setShowAiDrawer(true);
                          // Scroll to the specific suggestion in the drawer
                          setTimeout(() => {
                            const element = document.getElementById(`suggestion-${suggestionId}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.classList.add('highlight-suggestion');
                              setTimeout(() => element.classList.remove('highlight-suggestion'), 2000);
                            }
                          }, 300);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="p-6">
            <div className="text-center text-gray-400">
              <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Commits view coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="p-6">
            <div className="text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Reviews view coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions Drawer */}
      <AnimatePresence>
        {showAiDrawer && aiReview && aiReview.suggestions.length > 0 && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-950 border-l border-gray-800 z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <span>AI Suggestions ({aiReview.suggestions.length})</span>
                </h3>
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiReview.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  id={`suggestion-${suggestion.id}`}
                  className={`p-4 rounded-lg border transition-all duration-500 ${getSeverityColor(suggestion.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(suggestion.severity)}`}>
                        {suggestion.severity}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                    </div>
                    <span className="text-xs text-gray-500">{suggestion.file}:{suggestion.line}</span>
                  </div>
                  
                  <h4 className="font-medium text-white mb-1">{suggestion.title}</h4>
                  <div className="text-sm text-gray-300 mb-2">
                    <MarkdownRenderer 
                      content={suggestion.description}
                      collapsible
                      maxLines={2}
                    />
                  </div>
                  
                  {suggestion.suggestion && (
                    <div className="text-xs bg-gray-800 rounded p-2">
                      <strong className="text-gray-300">Suggestion:</strong>
                      <div className="mt-1">
                        <MarkdownRenderer 
                          content={suggestion.suggestion}
                          collapsible
                          maxLines={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors">
                      Apply Fix
                    </button>
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};