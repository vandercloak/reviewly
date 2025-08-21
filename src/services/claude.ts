import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeCodeSuggestion {
  id: string;
  type: 'fix' | 'improvement' | 'refactor' | 'optimization';
  title: string;
  description: string;
  originalCode: string;
  suggestedCode: string;
  startLine: number;
  endLine: number;
  confidence: number;
  reasoning: string;
}

export class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Initialize with API key from environment or user settings
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || null;
    if (this.apiKey) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true // Note: In production, proxy through your backend
      });
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async suggestCodeFix(
    code: string, 
    filename: string, 
    errorDescription?: string
  ): Promise<ClaudeCodeSuggestion[]> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `You are an expert code reviewer and developer. Please analyze the following code and suggest improvements, fixes, or optimizations.

File: ${filename}
${errorDescription ? `Known issue: ${errorDescription}` : ''}

Code:
\`\`\`
${code}
\`\`\`

Please respond with a JSON array of suggestions. Each suggestion should have:
- id: unique identifier
- type: "fix" | "improvement" | "refactor" | "optimization" 
- title: brief description
- description: detailed explanation
- originalCode: the code section to replace
- suggestedCode: the improved code
- startLine: starting line number (1-based)
- endLine: ending line number (1-based)
- confidence: number between 0-1
- reasoning: explanation of why this change is beneficial

Focus on:
- Bug fixes and error handling
- Performance improvements
- Code clarity and readability
- Security best practices
- Modern language features and patterns

Only return the JSON array, no other text.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const suggestions = JSON.parse(content.text);
          return suggestions.map((s: any, index: number) => ({
            ...s,
            id: s.id || `claude-suggestion-${Date.now()}-${index}`
          }));
        } catch (parseError) {
          console.error('Failed to parse Claude response:', parseError);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async improveCode(
    code: string,
    filename: string,
    improvementType: 'readability' | 'performance' | 'security' | 'modern' = 'readability'
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `You are an expert developer. Please improve the following code focusing on ${improvementType}.

File: ${filename}

Code:
\`\`\`
${code}
\`\`\`

Please return only the improved code, maintaining the same functionality but with better ${improvementType}. 
Do not include explanations or markdown formatting, just the clean improved code.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
      return code; // Return original if no response
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async explainCode(code: string, filename: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `Please explain what this code does in clear, concise terms.

File: ${filename}

Code:
\`\`\`
${code}
\`\`\`

Provide a brief explanation of:
1. What the code does
2. Key functions or classes
3. Any notable patterns or techniques used
4. Potential issues or areas for improvement

Keep it under 200 words and focus on the most important aspects.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
      return 'Unable to analyze code.';
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService();