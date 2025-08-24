import axios from 'axios';
import logger from '../utils/logger';

export interface AIGenerationRequest {
  prompt: string;
  context?: string;
  subject?: string;
  grade?: string;
  type: 'scheme_of_work' | 'search_query' | 'content_analysis';
}



export interface SchemeOfWorkGenerationData {
  subject: string;
  grade: string;
  term: string;
  weeks: number;
  context?: string;
}

export class AIService {
  private static instance: AIService;
  private groqApiKey: string;
  private groqApiUrl: string;
  private groqModel: string;
  private openRouterApiKey: string;
  private openRouterApiUrl: string;
  private openRouterModel: string;

  private constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqApiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
    this.groqModel = process.env.GROQ_MODEL || 'llama3-70b-8192';
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    this.openRouterApiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
    this.openRouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
    // Log API key presence for debugging
    console.log('GROQ_API_KEY:', this.groqApiKey ? '[set]' : '[missing]');
    console.log('OPENROUTER_API_KEY:', this.openRouterApiKey ? '[set]' : '[missing]');
    if (!this.groqApiKey) logger.warn('Groq API key not found in environment variables');
    if (!this.openRouterApiKey) logger.warn('OpenRouter API key not found in environment variables');
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }



  async generateSchemeOfWork(data: SchemeOfWorkGenerationData): Promise<any> {
    try {
      const prompt = this.buildSchemeOfWorkPrompt(data);
      const response = await this.callGrokAPI(prompt);
      return this.parseSchemeOfWorkResponse(response);
    } catch (error) {
      logger.error('Error generating scheme of work with AI:', error);
      return this.generateFallbackSchemeOfWork(data);
    }
  }

  async enhanceSearchQuery(query: string, context?: string): Promise<string> {
    try {
      const prompt = `
        Enhance this search query for educational content: "${query}"
        ${context ? `Context: ${context}` : ''}
        
        Return an enhanced search query that will find relevant curriculum content.
        Focus on CBC (Competency-Based Curriculum) terms and educational objectives.
      `;
      
      const response = await this.callGrokAPI(prompt);
      return response.trim() || query;
    } catch (error) {
      logger.error('Error enhancing search query:', error);
      return query;
    }
  }



  private buildSchemeOfWorkPrompt(data: SchemeOfWorkGenerationData): string {
    return `
      Generate a detailed CBC-compliant scheme of work for:
      - Subject: ${data.subject}
      - Grade: ${data.grade}
      - Term: ${data.term}
      - Number of weeks: ${data.weeks}
      ${data.context ? `- Additional Context: ${data.context}` : ''}

      The scheme should include weekly breakdown with:
      1. Week number
      2. Main topic/strand
      3. Sub-topics
      4. Learning outcomes
      5. Key inquiry questions
      6. Learning experiences
      7. Core competencies
      8. Values
      9. Assessment methods
      10. Resources

      Format as JSON with weekly structure.
      Ensure progression and logical flow between weeks.
      Include variety in teaching methods and assessment approaches.
    `;
  }

  private async callGrokAPI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.groqApiUrl}/chat/completions`,
        {
          model: this.groqModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Kenyan CBC (Competency-Based Curriculum) education. Generate detailed, practical, and CBC-compliant educational content for teachers.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Grok API call failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }



  private parseSchemeOfWorkResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      logger.error('Error parsing scheme of work response:', error);
      return null;
    }
  }



  private generateFallbackSchemeOfWork(data: SchemeOfWorkGenerationData): any {
    const weeks: any[] = [];
    for (let i = 1; i <= data.weeks; i++) {
      weeks.push({
        week: i,
        topic: `${data.subject} Topic ${i}`,
        subTopics: [`Sub-topic ${i}.1`, `Sub-topic ${i}.2`],
        learningOutcomes: [`Outcome for week ${i}`],
        keyInquiryQuestions: [`Question for week ${i}?`],
        learningExperiences: [`Activity for week ${i}`],
        coreCompetencies: ['Communication and Collaboration'],
        values: ['Responsibility'],
        assessmentMethods: ['Observation'],
        resources: ['Textbook', 'Whiteboard']
      });
    }

    return {
      subject: data.subject,
      grade: data.grade,
      term: data.term,
      weeks: weeks
    };
  }

  /**
   * Generic chat method: tries Groq first, falls back to OpenRouter if Groq fails.
   */
  async chat(request: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model?: string,
    provider?: 'groq' | 'openrouter',
    max_tokens?: number,
    temperature?: number,
  }): Promise<string> {
    try {
      // Always try Groq first
      return await this.callGrokAPIChat(request);
    } catch (err) {
      logger.warn('Groq failed, falling back to OpenRouter:', err);
      return await this.callOpenRouterAPIChat(request);
    }
  }

  // Groq chat completion (OpenAI-compatible)
  private async callGrokAPIChat(request: {
    messages: Array<{ role: string; content: string }>,
    model?: string,
    max_tokens?: number,
    temperature?: number,
  }): Promise<string> {
    if (!this.groqApiKey) throw new Error('Groq API key missing');
    try {
      const response = await axios.post(
        `${this.groqApiUrl}/chat/completions`,
        {
          model: request.model || this.groqModel,
          messages: request.messages,
          max_tokens: request.max_tokens || 2000,
          temperature: request.temperature ?? 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (error.response) {
        console.error('Groq API error response:', error.response.data);
      }
      throw error;
    }
  }

  // OpenRouter chat completion (OpenAI-compatible)
  private async callOpenRouterAPIChat(request: {
    messages: Array<{ role: string; content: string }>,
    model?: string,
    max_tokens?: number,
    temperature?: number,
  }): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const openRouterUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
    const openRouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
    if (!openRouterKey) throw new Error('OpenRouter API key missing');
    try {
      const response = await axios.post(
        `${openRouterUrl}/chat/completions`,
        {
          model: request.model || openRouterModel,
          messages: request.messages,
          max_tokens: request.max_tokens || 2000,
          temperature: request.temperature ?? 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (error.response) {
        console.error('OpenRouter API error response:', error.response.data);
      }
      throw error;
    }
  }
}

export default AIService.getInstance();
