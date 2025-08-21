import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Info,
  CheckCircle,
  XCircle,
  Eye,
  Code2,
  Filter,
  Zap
} from 'lucide-react';
import { GitHubFile } from '../../types/github';

interface AISuggestion {
  id: string;
  line: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AttentionFileListProps {
  files: GitHubFile[];
  aiSuggestions: Record<string, AISuggestion[]>;
  selectedFiles: string[];
  onFileSelect: (filename: string) => void;
  onFileToggle: (filename: string) => void;
}

export const AttentionFileList: React.FC<AttentionFileListProps> = ({
  files,
  aiSuggestions,
  selectedFiles,
  onFileSelect,
  onFileToggle,
}) => {
  const [filter, setFilter] = useState<'all' | 'attention' | 'clean'>('attention');

  const getAttentionLevel = (file: GitHubFile): 'urgent' | 'high' | 'medium' | 'low' | 'clean' => {
    const suggestions = aiSuggestions[file.filename] || [];
    const criticalCount = suggestions.filter(s => s.severity === 'critical').length;
    const highCount = suggestions.filter(s => s.severity === 'high').length;
    const mediumCount = suggestions.filter(s => s.severity === 'medium').length;
    
    if (criticalCount > 0) return 'urgent';
    if (highCount > 0) return 'high';
    if (mediumCount > 0) return 'medium';
    if (suggestions.length > 0) return 'low';
    return 'clean';
  };

  const getAttentionIcon = (level: string) => {
    switch (level) {
      case 'urgent': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-orange-400" />;
      case 'medium': return <Info className="w-3 h-3 text-yellow-400" />;
      case 'low': return <Eye className="w-3 h-3 text-blue-400" />;
      case 'clean': return <CheckCircle className="w-3 h-3 text-green-400" />;
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

  const filteredFiles = files
    .map(file => ({ file, attention: getAttentionLevel(file) }))
    .filter(({ attention }) => {
      if (filter === 'attention') return attention !== 'clean';
      if (filter === 'clean') return attention === 'clean';
      return true;
    })
    .sort((a, b) => {
      // Sort by attention level first
      const attentionOrder = { urgent: 0, high: 1, medium: 2, low: 3, clean: 4 };
      const orderA = attentionOrder[a.attention];
      const orderB = attentionOrder[b.attention];
      
      if (orderA !== orderB) return orderA - orderB;
      
      // Then by number of changes
      return b.file.changes - a.file.changes;
    });

  const attentionCounts = files.reduce((acc, file) => {
    const level = getAttentionLevel(file);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-80 bg-gray-950 border-r border-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-100">
            Files ({files.length})
          </h3>
          <Zap className="w-4 h-4 text-blue-400" />
        </div>

        {/* Attention Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {attentionCounts.urgent && (
            <div className="flex items-center space-x-1 text-red-400">
              <XCircle className="w-3 h-3" />
              <span>{attentionCounts.urgent} urgent</span>
            </div>
          )}
          {attentionCounts.high && (
            <div className="flex items-center space-x-1 text-orange-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{attentionCounts.high} high</span>
            </div>
          )}
          {attentionCounts.medium && (
            <div className="flex items-center space-x-1 text-yellow-400">
              <Info className="w-3 h-3" />
              <span>{attentionCounts.medium} medium</span>
            </div>
          )}
          {attentionCounts.clean && (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="w-3 h-3" />
              <span>{attentionCounts.clean} clean</span>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-900 rounded p-1">
          {[
            { key: 'attention', label: 'Needs Attention', count: files.length - (attentionCounts.clean || 0) },
            { key: 'clean', label: 'Clean', count: attentionCounts.clean || 0 },
            { key: 'all', label: 'All', count: files.length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 text-xs py-1.5 px-2 rounded transition-colors ${
                filter === key
                  ? 'bg-gray-800 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredFiles.map(({ file, attention }) => {
            const suggestions = aiSuggestions[file.filename] || [];
            const isSelected = selectedFiles.includes(file.filename);
            
            return (
              <motion.div
                key={file.filename}
                whileHover={{ x: 2 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'border-transparent hover:bg-gray-900'
                } ${
                  attention === 'urgent' ? 'attention-urgent' :
                  attention === 'high' ? 'attention-high' :
                  attention === 'medium' ? 'attention-medium' :
                  attention === 'low' ? 'attention-low' :
                  ''
                }`}
                onClick={() => onFileSelect(file.filename)}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {getAttentionIcon(attention)}
                  <Code2 className="w-3 h-3 text-gray-500" />
                  <span className="font-mono text-xs text-gray-100 truncate flex-1">
                    {file.filename.split('/').pop()}
                  </span>
                  <span className={`text-xs ${getStatusColor(file.status)}`}>
                    {file.status[0].toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <span className="text-green-400">+{file.additions}</span>
                    <span className="text-red-400">-{file.deletions}</span>
                  </div>
                  
                  {suggestions.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-blue-400" />
                      <span className="text-gray-400">{suggestions.length}</span>
                    </div>
                  )}
                </div>

                {/* Path hint for nested files */}
                {file.filename.includes('/') && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {file.filename}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-900">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const attentionFiles = filteredFiles
                .filter(({ attention }) => attention !== 'clean')
                .map(({ file }) => file.filename);
              attentionFiles.forEach(onFileToggle);
            }}
            className="flex-1 text-xs py-2 px-3 bg-orange-600/20 text-orange-400 border border-orange-600/30 rounded hover:bg-orange-600/30 transition-colors"
          >
            Focus Attention
          </button>
          <button
            onClick={() => files.forEach(file => onFileToggle(file.filename))}
            className="flex-1 text-xs py-2 px-3 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Expand All
          </button>
        </div>
      </div>
    </div>
  );
};