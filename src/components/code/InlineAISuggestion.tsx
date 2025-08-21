import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  ChevronDown, 
  ChevronRight, 
  Lightbulb,
  AlertTriangle,
  Shield,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink
} from 'lucide-react';

interface InlineAISuggestionProps {
  suggestion: {
    id: string;
    type: 'security' | 'performance' | 'style' | 'bug';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    suggestion?: string;
    line: number;
    confidence: number;
  };
  lineNumber: number;
  onApply?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
  className?: string;
}

export const InlineAISuggestion: React.FC<InlineAISuggestionProps> = ({
  suggestion,
  lineNumber,
  onApply,
  onDismiss,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      case 'medium': return <Lightbulb className="w-3 h-3 text-yellow-400" />;
      case 'low': return <Lightbulb className="w-3 h-3 text-blue-400" />;
      default: return <Bot className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="w-3 h-3" />;
      case 'performance': return <Zap className="w-3 h-3" />;
      case 'style': return <Bot className="w-3 h-3" />;
      case 'bug': return <AlertTriangle className="w-3 h-3" />;
      default: return <Bot className="w-3 h-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      case 'high': return 'border-orange-500/30 bg-orange-500/5';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'low': return 'border-blue-500/30 bg-blue-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  const handleCopySuggestion = () => {
    if (suggestion.suggestion) {
      navigator.clipboard.writeText(suggestion.suggestion);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Collapsed Indicator */}
      <motion.div
        className={`flex items-center justify-between px-3 py-1.5 border-l-2 cursor-pointer transition-all duration-200 ${getSeverityColor(suggestion.severity)} ${
          isHovered ? 'bg-opacity-20' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="flex items-center space-x-1.5">
            {getSeverityIcon(suggestion.severity)}
            <Bot className="w-3 h-3 text-purple-400" />
          </div>
          
          <span className="text-xs text-gray-300 truncate font-medium">
            {suggestion.title}
          </span>
          
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
              {suggestion.type}
            </span>
            <span className="text-xs opacity-75">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </motion.div>
      </motion.div>

      {/* Expanded Chat Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`border-l-2 ${getSeverityColor(suggestion.severity)} pl-4 pr-3 py-3 space-y-3`}>
              {/* Chat Header */}
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white">AI Assistant</span>
                    <span className="text-xs text-gray-400">Line {suggestion.line}</span>
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>

              {/* Code Suggestion */}
              {suggestion.suggestion && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Suggested Fix
                    </span>
                    <button
                      onClick={handleCopySuggestion}
                      className="p-1 hover:bg-gray-800 rounded transition-colors"
                      title="Copy suggestion"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    <pre className="text-gray-300 whitespace-pre-wrap">{suggestion.suggestion}</pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="ml-8 flex items-center space-x-2">
                <button
                  onClick={() => onApply?.(suggestion.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Apply</span>
                </button>
                
                <button
                  onClick={() => onDismiss?.(suggestion.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>Dismiss</span>
                </button>

                <button
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition-colors"
                  title="View details"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Details</span>
                </button>
              </div>

              {/* Confidence Indicator */}
              <div className="ml-8 flex items-center space-x-2 text-xs text-gray-500">
                <span>Confidence:</span>
                <div className="flex-1 max-w-20 bg-gray-800 rounded-full h-1.5">
                  <div 
                    className={`h-full rounded-full ${
                      suggestion.confidence > 0.8 ? 'bg-green-500' :
                      suggestion.confidence > 0.6 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
                <span>{Math.round(suggestion.confidence * 100)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};