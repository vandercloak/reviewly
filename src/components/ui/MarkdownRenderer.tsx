import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxLines?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  maxLines = 3,
  collapsible = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!content) return null;

  const shouldShowCollapse = collapsible && content.split('\n').length > maxLines;
  const truncatedContent = isExpanded || !shouldShowCollapse
    ? content
    : content.split('\n').slice(0, maxLines).join('\n') + '...';

  return (
    <div className={`relative ${className}`}>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize rendering for dark theme
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-white mb-4 mt-6 border-b border-gray-700 pb-3 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-white mb-3 mt-5 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium text-white mb-2 mt-4 first:mt-0">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 mb-4 leading-6 last:mb-0">
                {children}
              </p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                {children}
              </a>
            ),
            code: ({ inline, children }) => (
              inline ? (
                <code className="bg-gray-800 text-blue-300 px-2 py-1 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4">
                  <code className="text-gray-200 font-mono text-sm">
                    {children}
                  </code>
                </pre>
              )
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-3 mb-4 bg-blue-500/5 text-gray-300 italic">
                {children}
              </blockquote>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2 mb-4 pl-0">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-2 mb-4 pl-0 counter-reset-list">
                {children}
              </ol>
            ),
            li: ({ children, ordered, index }) => {
              if (ordered) {
                return (
                  <li className="text-gray-300 flex items-start">
                    <span className="text-gray-400 text-sm font-mono mr-3 mt-0.5 min-w-[1.5rem]">
                      {(index || 0) + 1}.
                    </span>
                    <span className="flex-1">{children}</span>
                  </li>
                );
              }
              return (
                <li className="text-gray-300 flex items-start">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="flex-1">{children}</span>
                </li>
              );
            },
            strong: ({ children }) => (
              <strong className="font-semibold text-white">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-200">
                {children}
              </em>
            ),
            hr: () => (
              <hr className="border-gray-700 my-4" />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-700 rounded-lg">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-800">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-white font-medium border-b border-gray-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-gray-300 border-b border-gray-700">
                {children}
              </td>
            ),
            // Handle task lists (GitHub-style checkboxes)
            input: ({ type, checked, disabled }) => (
              type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mr-2 accent-blue-500"
                />
              ) : null
            ),
          }}
        >
          {truncatedContent}
        </ReactMarkdown>
      </div>

      {/* Collapse/Expand Button */}
      {shouldShowCollapse && (
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={isExpanded ? 'up' : 'down'}
              initial={{ rotate: 0 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
};