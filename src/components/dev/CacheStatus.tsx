import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Trash2, RefreshCw, BarChart3, Flame } from 'lucide-react';
import { repoCacheService } from '../../services/repoCache';
import { prStatusService } from '../../services/prStatusService';

export const CacheStatus: React.FC = () => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    cacheSize: '0 bytes',
    expiredEntries: 0
  });
  const [prStats, setPrStats] = useState({
    spicy: 0,
    delayed: 0,
    completed: 0
  });
  const [showDetails, setShowDetails] = useState(false);

  const refreshStats = () => {
    setStats(repoCacheService.getStats());
    setPrStats({
      spicy: prStatusService.getSpicyPRs().size,
      delayed: prStatusService.getDelayedPRs().size,
      completed: prStatusService.getCompletedPRs().size
    });
  };

  const clearCache = () => {
    repoCacheService.clearAll();
    refreshStats();
  };

  const clearExpired = () => {
    repoCacheService.clearExpired();
    refreshStats();
  };

  const clearPRStatuses = () => {
    prStatusService.clearAll();
    refreshStats();
    // Trigger a page reload to refresh the dashboard state
    window.location.reload();
  };

  useEffect(() => {
    refreshStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(refreshStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showDetails) {
    return (
      <motion.button
        onClick={() => setShowDetails(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Cache Status"
      >
        <Database className="w-4 h-4" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-80 z-40"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center space-x-2 font-medium text-white">
          <Database className="w-4 h-4" />
          <span>Cache Status</span>
        </h3>
        <button
          onClick={() => setShowDetails(false)}
          className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total Entries:</span>
            <div className="text-white font-medium">{stats.totalEntries}</div>
          </div>
          <div>
            <span className="text-gray-400">Cache Size:</span>
            <div className="text-white font-medium">{stats.cacheSize}</div>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Expired Entries:</span>
            <div className={`font-medium ${stats.expiredEntries > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stats.expiredEntries}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-400 mb-2">PR Status Data</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-center">
              <div className="text-red-400 font-medium">{prStats.spicy}</div>
              <div className="text-gray-400">🔥 Spicy</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-center">
              <div className="text-yellow-400 font-medium">{prStats.delayed}</div>
              <div className="text-gray-400">😴 Delayed</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-center">
              <div className="text-green-400 font-medium">{prStats.completed}</div>
              <div className="text-gray-400">✅ Done</div>
            </div>
          </div>
        </div>
        
        {stats.totalEntries > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Cache Hit Rate</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max(10, 100 - (stats.expiredEntries / stats.totalEntries * 100))}%` 
                }}
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={refreshStats}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            
            {stats.expiredEntries > 0 && (
              <button
                onClick={clearExpired}
                className="flex items-center space-x-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded transition-colors"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Clear Expired</span>
              </button>
            )}
            
            <button
              onClick={clearCache}
              className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
          
          {(prStats.spicy > 0 || prStats.delayed > 0 || prStats.completed > 0) && (
            <button
              onClick={clearPRStatuses}
              className="flex items-center space-x-1 px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded transition-colors w-full justify-center"
            >
              <Flame className="w-3 h-3" />
              <span>Clear PR Statuses</span>
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
          🚀 Faster loads with smart caching! Cache auto-expires to keep data fresh.
        </div>
      </div>
    </motion.div>
  );
};