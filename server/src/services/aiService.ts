import axios from 'axios';
import { logger } from '../utils/logger';

export interface AIGenerationRequest {
  prompt: string;
  context?: string;
  subject?: string;
  grade?: string;
  type: 'lesson_plan' | 'scheme_of_work' | 'search_query' | 'content_analysis';
}

export interface LessonPlanGenerationData {
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  learningOutcomes?: string[];
  context?: string;
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
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  private constructor() {
    this.apiKey = process.env.GROK_API_KEY || '';
    this.apiUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1';
    this.model = process.env.GROK_MODEL || 'grok-beta';

    if (!this.apiKey) {
      logger.warn('Grok API key not found in environment variables');
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateLessonPlan(data: LessonPlanGenerationData): Promise<any> {
    try {
      const prompt = this.buildLessonPlanPrompt(data);
      const response = await this.callGrokAPI(prompt);
      return this.parseLessonPlanResponse(response);
    } catch (error) {
      logger.error('Error generating lesson plan with AI:', error);
      return this.generateFallbackLessonPlan(data);
    }
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

  private buildLessonPlanPrompt(data: LessonPlanGenerationData): string {
    return `
      Generate a detailed CBC-compliant lesson plan for:
      - Subject: ${data.subject}
      - Grade: ${data.grade}
      - Topic: ${data.topic}
      - Duration: ${data.duration} minutes
      ${data.context ? `- Additional Context: ${data.context}` : ''}

      The lesson plan must include:
      1. Learning Outcomes (3-5 specific, measurable outcomes)
      2. Core Competencies (from CBC framework)
      3. Values (from CBC values framework)
      4. Key Inquiry Questions (3-4 questions)
      5. Learning Experiences (detailed activities with timing)
      6. Assessment Criteria (formative and summative)
      7. Resources needed
      8. Reflection notes

      Format the response as JSON with the following structure:
      {
        "title": "lesson title",
        "learningOutcomes": ["outcome1", "outcome2", ...],
        "coreCompetencies": ["competency1", "competency2", ...],
        "values": ["value1", "value2", ...],
        "keyInquiryQuestions": ["question1", "question2", ...],
        "learningExperiences": [
          {
            "activity": "activity description",
            "duration": "time in minutes",
            "methodology": "teaching method",
            "materials": ["material1", "material2"]
          }
        ],
        "assessmentCriteria": [
          {
            "type": "formative/summative",
            "method": "assessment method",
            "criteria": "success criteria"
          }
        ],
        "resources": ["resource1", "resource2", ...],
        "reflection": "reflection notes for teacher"
      }

      Ensure all content is appropriate for ${data.grade} level and follows CBC guidelines.
    `;
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
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Grok API call failed:', error);
      throw error;
    }
  }

  private parseLessonPlanResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      logger.error('Error parsing lesson plan response:', error);
      return null;
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

  private generateFallbackLessonPlan(data: LessonPlanGenerationData): any {
    return {
      title: `${data.subject} - ${data.topic}`,
      learningOutcomes: [
        `Understand the key concepts of ${data.topic}`,
        `Apply knowledge of ${data.topic} in practical situations`,
        `Demonstrate mastery of ${data.topic} through activities`
      ],
      coreCompetencies: [
        'Critical Thinking and Problem Solving',
        'Communication and Collaboration'
      ],
      values: ['Responsibility', 'Respect', 'Unity'],
      keyInquiryQuestions: [
        `What is ${data.topic}?`,
        `How does ${data.topic} relate to real life?`,
        `Why is ${data.topic} important?`
      ],
      learningExperiences: [
        {
          activity: `Introduction to ${data.topic}`,
          duration: '10 minutes',
          methodology: 'Discussion',
          materials: ['Whiteboard', 'Markers']
        },
        {
          activity: `Main activity on ${data.topic}`,
          duration: `${data.duration - 20} minutes`,
          methodology: 'Hands-on practice',
          materials: ['Textbooks', 'Worksheets']
        },
        {
          activity: 'Summary and reflection',
          duration: '10 minutes',
          methodology: 'Question and answer',
          materials: ['Summary notes']
        }
      ],
      assessmentCriteria: [
        {
          type: 'formative',
          method: 'Observation',
          criteria: 'Student participation and understanding'
        },
        {
          type: 'summative',
          method: 'Written assessment',
          criteria: 'Demonstration of key concepts'
        }
      ],
      resources: ['Textbook', 'Whiteboard', 'Learning materials'],
      reflection: 'Monitor student engagement and adjust teaching methods as needed.'
    };
  }

  private generateFallbackSchemeOfWork(data: SchemeOfWorkGenerationData): any {
    const weeks = [];
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
}

export default AIService.getInstance();
