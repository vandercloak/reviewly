import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Cursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  isVisible: boolean;
}

const DEMO_USERS = [
  { name: 'Sarah', color: '#10b981', avatar: '👩‍💻' },
  { name: 'Alex', color: '#3b82f6', avatar: '👨‍💻' },
  { name: 'Jamie', color: '#f59e0b', avatar: '🧑‍💻' },
  { name: 'Taylor', color: '#ef4444', avatar: '👨‍🔬' },
];

export const CollaborativeCursors: React.FC = () => {
  const [cursors, setCursors] = useState<Cursor[]>([]);

  useEffect(() => {
    // Initialize cursors
    const initialCursors = DEMO_USERS.map((user, index) => ({
      id: user.name.toLowerCase(),
      name: user.name,
      color: user.color,
      x: Math.random() * (window.innerWidth - 200),
      y: Math.random() * (window.innerHeight - 200),
      isVisible: Math.random() > 0.3, // 70% chance to be visible initially
    }));
    
    setCursors(initialCursors);

    // Animate cursors periodically
    const interval = setInterval(() => {
      setCursors(prev => prev.map(cursor => {
        // Sometimes hide/show cursors
        if (Math.random() < 0.1) {
          return { ...cursor, isVisible: !cursor.isVisible };
        }

        // Move cursor to a new position
        if (cursor.isVisible && Math.random() < 0.8) {
          const moveAmount = 50 + Math.random() * 200;
          const angle = Math.random() * Math.PI * 2;
          
          let newX = cursor.x + Math.cos(angle) * moveAmount;
          let newY = cursor.y + Math.sin(angle) * moveAmount;
          
          // Keep within bounds
          newX = Math.max(50, Math.min(window.innerWidth - 250, newX));
          newY = Math.max(50, Math.min(window.innerHeight - 150, newY));
          
          return { ...cursor, x: newX, y: newY };
        }
        
        return cursor;
      }));
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {cursors
          .filter(cursor => cursor.isVisible)
          .map(cursor => (
            <motion.div
              key={cursor.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: cursor.x,
                y: cursor.y
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                x: { duration: 1.5, ease: "easeOut" },
                y: { duration: 1.5, ease: "easeOut" }
              }}
              className="absolute"
            >
              {/* Cursor pointer */}
              <div className="relative">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M6 6L18 12L12 14L10 20L6 6Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>
                
                {/* User badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-6 left-2 flex items-center space-x-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-gray-200"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cursor.color }}
                  />
                  <span className="text-xs font-medium text-gray-800">
                    {cursor.name}
                  </span>
                  <span className="text-xs">
                    {DEMO_USERS.find(u => u.name === cursor.name)?.avatar}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};