import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Info,
  CheckCircle,
  XCircle,
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';
import { DiffViewer } from '../diff/DiffViewer';
import { GitHubFile } from '../../types/github';

interface AISuggestion {
  id: string;
  line: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ResizableDiffViewerProps {
  file: GitHubFile;
  originalContent: string;
  modifiedContent: string;
  aiSuggestions: AISuggestion[];
  defaultCollapsed?: boolean;
}

export const ResizableDiffViewer: React.FC<ResizableDiffViewerProps> = ({
  file,
  originalContent,
  modifiedContent,
  aiSuggestions,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [height, setHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const getAttentionLevel = (): 'urgent' | 'high' | 'medium' | 'low' => {
    const criticalCount = aiSuggestions.filter(s => s.severity === 'critical').length;
    const highCount = aiSuggestions.filter(s => s.severity === 'high').length;
    
    if (criticalCount > 0) return 'urgent';
    if (highCount > 0) return 'high';
    if (aiSuggestions.length > 2) return 'medium';
    return 'low';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      case 'medium': return <Info className="w-3 h-3 text-yellow-400" />;
      case 'low': return <CheckCircle className="w-3 h-3 text-blue-400" />;
      default: return <Info className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'removed': return 'text-red-400';
      case 'modified': return 'text-blue-400';
      case 'renamed': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = height;
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - dragStartY.current;
    const newHeight = Math.max(200, Math.min(800, dragStartHeight.current + deltaY));
    setHeight(newHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const attentionLevel = getAttentionLevel();

  return (
    <div className={`border-t border-gray-800 first:border-t-0`}>
      {/* File Header */}
      <div className={`px-4 py-3 bg-gray-900 border-l-2 ${
        attentionLevel === 'urgent' ? 'border-red-500 bg-red-500/5' :
        attentionLevel === 'high' ? 'border-orange-500 bg-orange-500/5' :
        attentionLevel === 'medium' ? 'border-yellow-500 bg-yellow-500/5' :
        'border-blue-500 bg-blue-500/5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            <Code2 className="w-4 h-4 text-gray-400" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-100 truncate">
                  {file.filename}
                </span>
                <span className={`text-xs ${getStatusColor(file.status)}`}>
                  {file.status}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                <span className="text-green-400">+{file.additions}</span>
                <span className="text-red-400">-{file.deletions}</span>
                <span>{file.changes} changes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* AI Suggestions Summary */}
            {aiSuggestions.length > 0 && (
              <div className="flex items-center space-x-1">
                {getSeverityIcon(aiSuggestions[0]?.severity)}
                <span className="text-xs text-gray-400">
                  {aiSuggestions.length} suggestion{aiSuggestions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Controls */}
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
            >
              {showLineNumbers ? (
                <Eye className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div 
              className="code-focus"
              style={{ height: `${height}px` }}
            >
              <DiffViewer
                file={file}
                originalContent={originalContent}
                modifiedContent={modifiedContent}
                aiSuggestions={aiSuggestions}
                showLineNumbers={showLineNumbers}
                height={height}
              />
            </div>
            
            {/* Resize Handle */}
            <div
              className="resizer h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors flex items-center justify-center"
              onMouseDown={handleMouseDown}
            >
              <div className="w-8 h-0.5 bg-gray-600 rounded"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};