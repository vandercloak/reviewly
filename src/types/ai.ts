export interface AIReviewSuggestion {
  id: string;
  type: 'security' | 'performance' | 'style' | 'bug' | 'improvement' | 'complexity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  file: string;
  line?: number;
  startLine?: number;
  endLine?: number;
  column?: number;
  code?: string;
  suggestedCode?: string;
  confidence: number; // 0-1
  reasoning: string;
  tags: string[];
  references?: Array<{
    title: string;
    url: string;
  }>;
  createdAt: string;
}

export interface AIReviewSummary {
  id: string;
  pullRequestId: number;
  overallScore: number; // 0-100
  complexity: 'low' | 'medium' | 'high';
  maintainability: number; // 0-100
  testCoverage?: number; // 0-100
  securityRisk: 'low' | 'medium' | 'high';
  performance: 'good' | 'concerning' | 'needs_attention';
  suggestions: AIReviewSuggestion[];
  summary: string;
  keyFindings: string[];
  recommendedActions: string[];
  estimatedReviewTime: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface AICodeAnalysis {
  id: string;
  file: string;
  language: string;
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
    duplicatedLines: number;
    technicalDebt: number; // minutes
  };
  issues: AIReviewSuggestion[];
  dependencies: string[];
  exports: string[];
  imports: string[];
  functions: Array<{
    name: string;
    complexity: number;
    startLine: number;
    endLine: number;
    parameters: number;
    returns: string;
  }>;
  createdAt: string;
}

export interface AIReviewSettings {
  enabled: boolean;
  autoReview: boolean;
  severity: 'low' | 'medium' | 'high';
  categories: {
    security: boolean;
    performance: boolean;
    style: boolean;
    bugs: boolean;
    complexity: boolean;
    bestPractices: boolean;
  };
  excludePatterns: string[];
  includedFileTypes: string[];
  maxSuggestions: number;
  confidenceThreshold: number; // 0-1
}