import Anthropic from '@anthropic-ai/sdk';
import { AIReviewSuggestion, AIReviewSummary, AICodeAnalysis } from '../types/ai';
import { GitHubFile, GitHubPullRequest } from '../types/github';

class AIService {
  private anthropic: Anthropic | null = null;
  private apiKey: string | null = null;

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, proxy through your backend
    });
  }

  private ensureInitialized() {
    if (!this.anthropic) {
      throw new Error('AI service not initialized. Please provide an Anthropic API key.');
    }
  }

  async testConnection(): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      });

      return response.content.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  async analyzePullRequest(
    pullRequest: GitHubPullRequest,
    files: GitHubFile[],
    fileContents: Record<string, { original: string; modified: string }>
  ): Promise<AIReviewSummary> {
    this.ensureInitialized();

    const prompt = this.buildPRAnalysisPrompt(pullRequest, files, fileContents);

    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from AI service');
      }

      return this.parseAIResponse(content.text, pullRequest.id);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error('Failed to analyze pull request with AI');
    }
  }

  async analyzeFile(
    filename: string,
    content: string,
    language: string
  ): Promise<AICodeAnalysis> {
    this.ensureInitialized();

    const prompt = this.buildFileAnalysisPrompt(filename, content, language);

    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content_ = response.content[0];
      if (content_.type !== 'text') {
        throw new Error('Unexpected response format from AI service');
      }

      return this.parseFileAnalysis(content_.text, filename, language);
    } catch (error) {
      console.error('File analysis failed:', error);
      throw new Error('Failed to analyze file with AI');
    }
  }

  async generateSuggestion(
    code: string,
    context: string,
    issueType: string
  ): Promise<string> {
    this.ensureInitialized();

    const prompt = `
As a senior software engineer and code reviewer, analyze this code and provide a specific, actionable suggestion for the ${issueType} issue.

Context: ${context}

Code:
\`\`\`
${code}
\`\`\`

Provide:
1. A clear explanation of the issue
2. A specific code suggestion or improvement
3. The reasoning behind your recommendation

Be concise but thorough.`;

    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from AI service');
      }

      return content.text;
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      throw new Error('Failed to generate AI suggestion');
    }
  }

  private buildPRAnalysisPrompt(
    pullRequest: GitHubPullRequest,
    files: GitHubFile[],
    fileContents: Record<string, { original: string; modified: string }>
  ): string {
    const fileAnalysis = files.map(file => {
      const content = fileContents[file.filename];
      return `
## File: ${file.filename}
Status: ${file.status}
Changes: +${file.additions} -${file.deletions}

${content ? `
### Original:
\`\`\`
${content.original.slice(0, 2000)}${content.original.length > 2000 ? '\n...(truncated)' : ''}
\`\`\`

### Modified:
\`\`\`
${content.modified.slice(0, 2000)}${content.modified.length > 2000 ? '\n...(truncated)' : ''}
\`\`\`
` : '(Content not available)'}
      `;
    }).join('\n');

    return `
As an expert code reviewer, analyze this pull request and provide a comprehensive review.

## Pull Request Details
Title: ${pullRequest.title}
Description: ${pullRequest.body || 'No description provided'}
Author: ${pullRequest.user.login}
Changes: +${pullRequest.additions} -${pullRequest.deletions} across ${pullRequest.changed_files} files

## Files Changed
${fileAnalysis}

Please provide a JSON response with the following structure:
{
  "overallScore": number (0-100),
  "complexity": "low" | "medium" | "high",
  "maintainability": number (0-100),
  "securityRisk": "low" | "medium" | "high",
  "performance": "good" | "concerning" | "needs_attention",
  "summary": "Brief summary of the changes and overall assessment",
  "keyFindings": ["List of 3-5 key findings"],
  "recommendedActions": ["List of recommended actions"],
  "estimatedReviewTime": number (minutes),
  "suggestions": [
    {
      "type": "security" | "performance" | "style" | "bug" | "improvement" | "complexity",
      "severity": "low" | "medium" | "high" | "critical",
      "title": "Brief title",
      "description": "Detailed description",
      "suggestion": "Specific suggestion",
      "file": "filename",
      "line": number (optional),
      "code": "relevant code snippet" (optional),
      "suggestedCode": "suggested improvement" (optional),
      "confidence": number (0-1),
      "reasoning": "Explanation of the reasoning"
    }
  ]
}

Focus on:
1. Security vulnerabilities
2. Performance issues
3. Code quality and maintainability
4. Best practices
5. Potential bugs
6. Design patterns and architecture

Be thorough but practical in your suggestions.`;
  }

  private buildFileAnalysisPrompt(filename: string, content: string, language: string): string {
    return `
As a senior software engineer, analyze this ${language} file for code quality, potential issues, and improvements.

## File: ${filename}
## Language: ${language}

\`\`\`${language}
${content.slice(0, 5000)}${content.length > 5000 ? '\n...(truncated for analysis)' : ''}
\`\`\`

Please provide a JSON response with the following structure:
{
  "metrics": {
    "linesOfCode": number,
    "cyclomaticComplexity": number,
    "cognitiveComplexity": number,
    "maintainabilityIndex": number (0-100),
    "duplicatedLines": number,
    "technicalDebt": number (estimated minutes to fix issues)
  },
  "issues": [
    {
      "type": "security" | "performance" | "style" | "bug" | "improvement" | "complexity",
      "severity": "low" | "medium" | "high" | "critical",
      "title": "Brief title",
      "description": "Detailed description",
      "suggestion": "Specific suggestion",
      "line": number (optional),
      "code": "relevant code snippet" (optional),
      "suggestedCode": "suggested improvement" (optional),
      "confidence": number (0-1),
      "reasoning": "Explanation"
    }
  ],
  "dependencies": ["list of imported dependencies"],
  "exports": ["list of exported items"],
  "functions": [
    {
      "name": "function name",
      "complexity": number,
      "startLine": number,
      "endLine": number,
      "parameters": number,
      "returns": "return type description"
    }
  ]
}

Analyze for:
1. Security vulnerabilities
2. Performance bottlenecks
3. Code smells
4. Maintainability issues
5. Best practices adherence
6. Potential bugs
`;
  }

  private parseAIResponse(response: string, pullRequestId: number): AIReviewSummary {
    try {
      // Extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);

      const suggestions: AIReviewSuggestion[] = (parsed.suggestions || []).map((s: any, index: number) => ({
        id: `suggestion-${pullRequestId}-${index}`,
        type: s.type || 'improvement',
        severity: s.severity || 'medium',
        title: s.title || 'Code suggestion',
        description: s.description || '',
        suggestion: s.suggestion || '',
        file: s.file || '',
        line: s.line,
        startLine: s.startLine,
        endLine: s.endLine,
        column: s.column,
        code: s.code,
        suggestedCode: s.suggestedCode,
        confidence: s.confidence || 0.8,
        reasoning: s.reasoning || '',
        tags: [s.type],
        references: s.references || [],
        createdAt: new Date().toISOString(),
      }));

      return {
        id: `review-${pullRequestId}-${Date.now()}`,
        pullRequestId,
        overallScore: parsed.overallScore || 75,
        complexity: parsed.complexity || 'medium',
        maintainability: parsed.maintainability || 75,
        testCoverage: parsed.testCoverage,
        securityRisk: parsed.securityRisk || 'low',
        performance: parsed.performance || 'good',
        suggestions,
        summary: parsed.summary || 'AI analysis completed',
        keyFindings: parsed.keyFindings || [],
        recommendedActions: parsed.recommendedActions || [],
        estimatedReviewTime: parsed.estimatedReviewTime || 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a fallback response
      return {
        id: `review-${pullRequestId}-${Date.now()}`,
        pullRequestId,
        overallScore: 50,
        complexity: 'medium',
        maintainability: 50,
        securityRisk: 'medium',
        performance: 'good',
        suggestions: [],
        summary: 'Unable to complete AI analysis due to parsing error',
        keyFindings: ['Analysis parsing failed'],
        recommendedActions: ['Please try again'],
        estimatedReviewTime: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  private parseFileAnalysis(response: string, filename: string, language: string): AICodeAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);

      const issues: AIReviewSuggestion[] = (parsed.issues || []).map((issue: any, index: number) => ({
        id: `file-issue-${filename}-${index}`,
        type: issue.type || 'improvement',
        severity: issue.severity || 'medium',
        title: issue.title || 'Code issue',
        description: issue.description || '',
        suggestion: issue.suggestion || '',
        file: filename,
        line: issue.line,
        code: issue.code,
        suggestedCode: issue.suggestedCode,
        confidence: issue.confidence || 0.8,
        reasoning: issue.reasoning || '',
        tags: [issue.type],
        references: [],
        createdAt: new Date().toISOString(),
      }));

      return {
        id: `analysis-${filename}-${Date.now()}`,
        file: filename,
        language,
        metrics: {
          linesOfCode: parsed.metrics?.linesOfCode || 0,
          cyclomaticComplexity: parsed.metrics?.cyclomaticComplexity || 1,
          cognitiveComplexity: parsed.metrics?.cognitiveComplexity || 1,
          maintainabilityIndex: parsed.metrics?.maintainabilityIndex || 50,
          duplicatedLines: parsed.metrics?.duplicatedLines || 0,
          technicalDebt: parsed.metrics?.technicalDebt || 0,
        },
        issues,
        dependencies: parsed.dependencies || [],
        exports: parsed.exports || [],
        imports: parsed.imports || [],
        functions: parsed.functions || [],
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse file analysis:', error);
      return {
        id: `analysis-${filename}-${Date.now()}`,
        file: filename,
        language,
        metrics: {
          linesOfCode: 0,
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          maintainabilityIndex: 50,
          duplicatedLines: 0,
          technicalDebt: 0,
        },
        issues: [],
        dependencies: [],
        exports: [],
        imports: [],
        functions: [],
        createdAt: new Date().toISOString(),
      };
    }
  }
}

export const aiService = new AIService();