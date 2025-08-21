import React, { useState, useEffect } from 'react';
import { InlineAISuggestion } from './InlineAISuggestion';

interface AISuggestion {
  id: string;
  line: number;
  type: 'security' | 'performance' | 'style' | 'bug';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  suggestion?: string;
  confidence?: number;
}

interface InlineAISuggestionManagerProps {
  suggestions: AISuggestion[];
  fileContent: string;
  onApplySuggestion?: (suggestionId: string, suggestion: AISuggestion) => void;
  onDismissSuggestion?: (suggestionId: string) => void;
}

export const InlineAISuggestionManager: React.FC<InlineAISuggestionManagerProps> = ({
  suggestions,
  fileContent,
  onApplySuggestion,
  onDismissSuggestion,
}) => {
  const [contentLines, setContentLines] = useState<string[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setContentLines(fileContent.split('\n'));
  }, [fileContent]);

  const handleApply = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (suggestion && onApplySuggestion) {
      onApplySuggestion(suggestionId, suggestion);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    if (onDismissSuggestion) {
      onDismissSuggestion(suggestionId);
    }
  };

  // Group suggestions by line number
  const suggestionsByLine = suggestions
    .filter(s => !dismissedSuggestions.has(s.id))
    .reduce((acc, suggestion) => {
      if (!acc[suggestion.line]) {
        acc[suggestion.line] = [];
      }
      acc[suggestion.line].push(suggestion);
      return acc;
    }, {} as Record<number, AISuggestion[]>);

  const renderContentWithSuggestions = () => {
    const elements: JSX.Element[] = [];

    contentLines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Add the code line
      elements.push(
        <div key={`line-${lineNumber}`} className="flex items-start">
          <span className="w-12 text-xs text-gray-500 text-right pr-3 select-none flex-shrink-0">
            {lineNumber}
          </span>
          <pre className="flex-1 text-sm font-mono text-gray-300 whitespace-pre-wrap">
            {line}
          </pre>
        </div>
      );

      // Add suggestions after this line
      const lineSuggestions = suggestionsByLine[lineNumber];
      if (lineSuggestions && lineSuggestions.length > 0) {
        lineSuggestions.forEach((suggestion, suggestionIndex) => {
          elements.push(
            <InlineAISuggestion
              key={`suggestion-${suggestion.id}`}
              suggestion={{
                ...suggestion,
                title: suggestion.title || `${suggestion.type} suggestion`,
                description: suggestion.message,
                confidence: suggestion.confidence || 0.8,
              }}
              lineNumber={lineNumber}
              onApply={handleApply}
              onDismiss={handleDismiss}
              className="ml-12 mb-1"
            />
          );
        });
      }
    });

    return elements;
  };

  return (
    <div className="bg-gray-950 text-gray-300 p-4 overflow-auto">
      <div className="space-y-1">
        {renderContentWithSuggestions()}
      </div>
    </div>
  );
};