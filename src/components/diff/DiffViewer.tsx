import React, { useRef, useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Monaco } from '@monaco-editor/react';
import { useAppStore } from '../../store/app';
import { GitHubFile } from '../../types/github';
import { InlineAISuggestionManager } from '../code/InlineAISuggestionManager';
import { 
  ChevronDown, 
  ChevronRight, 
  FileIcon, 
  Plus, 
  Minus, 
  RotateCcw,
  MessageSquare,
  Bot,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
  Sparkles
} from 'lucide-react';

interface DiffViewerProps {
  file: GitHubFile;
  originalContent: string;
  modifiedContent: string;
  onAddComment?: (line: number, side: 'left' | 'right') => void;
  comments?: Array<{
    id: string;
    line: number;
    side: 'left' | 'right';
    body: string;
    author: string;
    createdAt: string;
  }>;
  aiSuggestions?: Array<{
    id: string;
    line: number;
    type: 'security' | 'performance' | 'style' | 'bug';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  showLineNumbers?: boolean;
  height?: number;
  onAiSuggestionClick?: (suggestionId: string) => void;
  editable?: boolean;
  onContentChange?: (newContent: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  file,
  originalContent,
  modifiedContent,
  onAddComment,
  comments = [],
  aiSuggestions = [],
  showLineNumbers = true,
  height = 400,
  onAiSuggestionClick,
  editable = false,
  onContentChange,
}) => {
  const { theme } = useAppStore();
  const diffEditorRef = useRef<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(modifiedContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(false);

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'sql': 'sql',
      'r': 'r',
      'R': 'r',
      'lua': 'lua',
      'vim': 'vim',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    // You could expand this with more specific icons
    return <FileIcon className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'removed': return 'text-red-400';
      case 'modified': return 'text-yellow-400';
      case 'renamed': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return <Plus className="w-3 h-3" />;
      case 'removed': return <Minus className="w-3 h-3" />;
      case 'modified': return <RotateCcw className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleDiffEditorMount = (editor: any, monaco: Monaco) => {
    diffEditorRef.current = editor;

    // Add content change listener for editable mode
    if (editable && onContentChange) {
      const modifiedEditor = editor.getModifiedEditor();
      modifiedEditor.onDidChangeModelContent(() => {
        const newContent = modifiedEditor.getValue();
        setEditedContent(newContent);
        setHasUnsavedChanges(newContent !== modifiedContent);
        onContentChange(newContent);
      });
    }

    // Add click handlers for adding comments
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.onMouseDown((e: any) => {
      if (e.target.type === 5) { // Line number area
        const line = e.target.position.lineNumber;
        if (onAddComment) {
          onAddComment(line, 'left');
        }
      }
    });

    modifiedEditor.onMouseDown((e: any) => {
      if (e.target.type === 5) { // Line number area
        const line = e.target.position.lineNumber;
        if (onAddComment) {
          onAddComment(line, 'right');
        }
      } else if (e.target.type === 2) { // Glyph margin area
        const line = e.target.position.lineNumber;
        // Check if this line has an AI suggestion
        const suggestion = aiSuggestions.find(s => s.line === line);
        if (suggestion && onAiSuggestionClick) {
          onAiSuggestionClick(suggestion.id);
        }
      }
    });

    // Add decorations for comments and AI suggestions
    const addDecorations = () => {
      const originalDecorations: any[] = [];
      const modifiedDecorations: any[] = [];

      // Add comment decorations
      if (showComments) {
        comments.forEach(comment => {
          const decoration = {
            range: new monaco.Range(comment.line, 1, comment.line, 1),
            options: {
              isWholeLine: true,
              className: 'comment-line',
              glyphMarginClassName: 'comment-glyph',
              hoverMessage: { value: `💬 ${comment.body}` },
            },
          };

          if (comment.side === 'left') {
            originalDecorations.push(decoration);
          } else {
            modifiedDecorations.push(decoration);
          }
        });
      }

      // Add AI suggestion decorations
      if (showAISuggestions) {
        aiSuggestions.forEach(suggestion => {
          const severityColors = {
            critical: '#ef4444', // red-500
            high: '#f97316',     // orange-500
            medium: '#eab308',   // yellow-500
            low: '#3b82f6',      // blue-500
          };

          const color = severityColors[suggestion.severity] || severityColors.low;
          
          // Line highlighting decoration
          const lineDecoration = {
            range: new monaco.Range(suggestion.line, 1, suggestion.line, 1),
            options: {
              isWholeLine: true,
              className: `ai-suggestion-line-${suggestion.severity}`,
              minimap: {
                color: color,
                position: 1,
              },
              overviewRuler: {
                color: color,
                position: 1,
              },
            },
          };

          // Glyph margin icon
          const glyphDecoration = {
            range: new monaco.Range(suggestion.line, 1, suggestion.line, 1),
            options: {
              glyphMarginClassName: `ai-suggestion-glyph-${suggestion.severity}`,
              glyphMarginHoverMessage: {
                value: `**🤖 AI Suggestion (${suggestion.severity})**\n\n${suggestion.message}\n\n*Click the sidebar for more details*`
              },
            },
          };

          modifiedDecorations.push(lineDecoration, glyphDecoration);
        });
      }

      originalEditor.deltaDecorations([], originalDecorations);
      modifiedEditor.deltaDecorations([], modifiedDecorations);
    };

    // Initial decorations
    setTimeout(addDecorations, 100);
    
    // Re-add decorations when AI suggestions change
    return () => {
      if (diffEditorRef.current) {
        const originalEditor = diffEditorRef.current.getOriginalEditor();
        const modifiedEditor = diffEditorRef.current.getModifiedEditor();
        originalEditor.deltaDecorations([], []);
        modifiedEditor.deltaDecorations([], []);
      }
    };
  };

  // Re-run decorations when AI suggestions change
  React.useEffect(() => {
    if (diffEditorRef.current) {
      const addDecorations = () => {
        const originalEditor = diffEditorRef.current.getOriginalEditor();
        const modifiedEditor = diffEditorRef.current.getModifiedEditor();
        const originalDecorations: any[] = [];
        const modifiedDecorations: any[] = [];

        // Add AI suggestion decorations
        if (showAISuggestions) {
          aiSuggestions.forEach(suggestion => {
            const severityColors = {
              critical: '#ef4444',
              high: '#f97316',
              medium: '#eab308',
              low: '#3b82f6',
            };

            const color = severityColors[suggestion.severity] || severityColors.low;
            
            const lineDecoration = {
              range: new (window as any).monaco.Range(suggestion.line, 1, suggestion.line, 1),
              options: {
                isWholeLine: true,
                className: `ai-suggestion-line-${suggestion.severity}`,
                minimap: {
                  color: color,
                  position: 1,
                },
                overviewRuler: {
                  color: color,
                  position: 1,
                },
              },
            };

            const glyphDecoration = {
              range: new (window as any).monaco.Range(suggestion.line, 1, suggestion.line, 1),
              options: {
                glyphMarginClassName: `ai-suggestion-glyph-${suggestion.severity}`,
                glyphMarginHoverMessage: {
                  value: `**🤖 AI Suggestion (${suggestion.severity})**\n\n${suggestion.message}\n\n*Click the AI drawer for more details*`
                },
              },
            };

            modifiedDecorations.push(lineDecoration, glyphDecoration);
          });
        }

        originalEditor.deltaDecorations([], originalDecorations);
        modifiedEditor.deltaDecorations([], modifiedDecorations);
      };

      setTimeout(addDecorations, 100);
    }
  }, [aiSuggestions, showAISuggestions]);

  if (isCollapsed) {
    return (
      <div className="border-b border-gray-700">
        <div 
          className="flex items-center space-x-2 p-3 hover:bg-gray-800 cursor-pointer"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {getFileIcon(file.filename)}
          <span className="text-sm font-mono">{file.filename}</span>
          <span className={`text-xs ${getStatusColor(file.status)}`}>
            {getStatusIcon(file.status)}
            {file.status}
          </span>
          <div className="flex items-center space-x-2 text-xs text-gray-400 ml-auto">
            <span className="text-green-400">+{file.additions}</span>
            <span className="text-red-400">-{file.deletions}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-700">
      {/* File Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-gray-700 rounded flex-shrink-0"
          >
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          {getFileIcon(file.filename)}
          <span className="text-sm font-mono font-medium truncate">{file.filename}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded flex items-center space-x-1 ${getStatusColor(file.status)} bg-gray-700 flex-shrink-0`}>
            {getStatusIcon(file.status)}
            <span>{file.status[0].toUpperCase()}</span>
          </span>
          {file.previous_filename && (
            <span className="text-xs text-gray-500 truncate">
              renamed from {file.previous_filename}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-green-400 font-medium">+{file.additions}</span>
            <span className="text-red-400 font-medium">-{file.deletions}</span>
            <span className="text-gray-400">{file.changes} changes</span>
          </div>

          <div className="flex items-center space-x-1">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
                title="Edit file"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setHasUnsavedChanges(false);
                    setEditedContent(modifiedContent);
                  }}
                  className="p-1.5 rounded bg-red-600 hover:bg-red-500 transition-colors flex items-center justify-center"
                  title="Cancel editing"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (onContentChange) onContentChange(editedContent);
                    setIsEditMode(false);
                    setHasUnsavedChanges(false);
                  }}
                  disabled={!hasUnsavedChanges}
                  className="p-1.5 rounded bg-green-600 hover:bg-green-500 disabled:bg-gray-600 transition-colors flex items-center justify-center"
                  title="Save changes"
                >
                  <Save className="w-3 h-3" />
                </button>
              </>
            )}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-1.5 rounded ${showComments ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500 transition-colors flex items-center justify-center`}
              title="Toggle comments"
            >
              <MessageSquare className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowAISuggestions(!showAISuggestions)}
              className={`p-1.5 rounded ${showAISuggestions ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-500 transition-colors flex items-center justify-center`}
              title="Toggle AI suggestions"
            >
              <Bot className="w-3 h-3" />
            </button>
            {aiSuggestions.length > 0 && (
              <button
                onClick={() => setShowInlineSuggestions(!showInlineSuggestions)}
                className={`p-1.5 rounded ${showInlineSuggestions ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500 transition-colors flex items-center justify-center`}
                title="Toggle inline AI suggestions"
              >
                <Sparkles className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diff Editor */}
      <div className="relative bg-gray-950" style={{ height: `${height}px` }}>
        {showInlineSuggestions && aiSuggestions.length > 0 ? (
          <InlineAISuggestionManager
            suggestions={aiSuggestions}
            fileContent={isEditMode ? editedContent : modifiedContent}
            onApplySuggestion={(suggestionId, suggestion) => {
              // Handle applying the suggestion
              console.log('Apply suggestion:', suggestionId, suggestion);
              if (onAiSuggestionClick) {
                onAiSuggestionClick(suggestionId);
              }
            }}
            onDismissSuggestion={(suggestionId) => {
              // Handle dismissing the suggestion
              console.log('Dismiss suggestion:', suggestionId);
            }}
          />
        ) : (
          <DiffEditor
            height={`${height}px`}
            language={getLanguageFromFilename(file.filename)}
            original={originalContent}
            modified={isEditMode ? editedContent : modifiedContent}
            theme="vs-dark"
            onMount={handleDiffEditorMount}
            options={{
              renderSideBySide: true,
              readOnly: !isEditMode,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace",
              lineNumbers: showLineNumbers ? 'on' : 'off',
              renderWhitespace: 'boundary',
              wordWrap: 'off',
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              folding: true,
              glyphMargin: true,
              lineDecorationsWidth: 6,
              lineNumbersMinChars: 3,
              renderOverviewRuler: true,
              scrollbar: {
                horizontal: 'auto',
                vertical: 'auto',
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              diffWordWrap: 'off',
              ignoreTrimWhitespace: false,
              renderIndicators: true,
              originalEditable: false,
              modifiedEditable: isEditMode,
              contextmenu: isEditMode,
              fixedOverflowWidgets: true,
            }}
          />
        )}

        {/* Floating comment/suggestion panel */}
        {selectedLines && (
          <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-sm z-10">
            <h4 className="text-sm font-medium mb-2">Add Comment</h4>
            <textarea
              className="w-full h-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm resize-none"
              placeholder="Leave a comment..."
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button 
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                onClick={() => setSelectedLines(null)}
              >
                Cancel
              </button>
              <button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded">
                Comment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comments and Suggestions */}
      {(showComments && comments.length > 0) || (showAISuggestions && aiSuggestions.length > 0) ? (
        <div className="border-t border-gray-700 p-4 space-y-3">
          {showComments && comments.map(comment => (
            <div key={comment.id} className="flex space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                  <span className="font-medium">{comment.author}</span>
                  <span>commented on line {comment.line}</span>
                  <span>{comment.createdAt}</span>
                </div>
                <p className="text-sm text-gray-200">{comment.body}</p>
              </div>
            </div>
          ))}

          {showAISuggestions && aiSuggestions.map(suggestion => (
            <div key={suggestion.id} className="flex space-x-3 p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg">
              <Bot className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-1">
                  <span className="font-medium text-purple-400">AI Suggestion</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    suggestion.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    suggestion.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {suggestion.severity}
                  </span>
                  <span>{suggestion.type}</span>
                  <span>line {suggestion.line}</span>
                </div>
                <p className="text-sm text-gray-200">{suggestion.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};