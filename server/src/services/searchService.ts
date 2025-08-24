import { PrismaClient } from '../generated/prisma';
import logger from '../utils/logger';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export interface SearchQuery {
  query: string;
  filters?: {
    subject?: string;
    grade?: string;
    documentType?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
    uploadedBy?: string;
  };
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  subject: string;
  grade: string;
  documentType: string;
  relevance: number;
  metadata: any;
  highlights: string[];
  uploadedBy: string;
  createdAt: Date;
  downloadCount?: number;
}

export interface SearchStats {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  queryTime: number;
  facets: {
    subjects: { [key: string]: number };
    grades: { [key: string]: number };
    documentTypes: { [key: string]: number };
    dateRanges: { [key: string]: number };
  };
}

export class SearchService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Perform semantic search across documents
   */
  async semanticSearch(searchQuery: SearchQuery): Promise<{
    results: SearchResult[];
    stats: SearchStats;
  }> {
    const startTime = Date.now();
    
    try {
      // Build base query
      const whereClause = this.buildWhereClause(searchQuery.filters);
      
      // Get total count for pagination
      const totalResults = await prisma.document.count({ where: whereClause });
      
      // Calculate pagination
      const page = searchQuery.page || 1;
      const limit = searchQuery.limit || 10;
      const skip = (page - 1) * limit;
      
      // Perform search with different strategies
      let results: SearchResult[] = [];
      
      if (searchQuery.query.trim()) {
        // Semantic search with AI
        results = await this.performSemanticSearch(searchQuery, whereClause, skip, limit);
      } else {
        // Filter-based search without query
        results = await this.performFilterSearch(whereClause, skip, limit, searchQuery.sortBy, searchQuery.sortOrder);
      }
      
      // Calculate facets for filtering
      const facets = await this.calculateFacets(whereClause);
      
      const stats: SearchStats = {
        totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: page,
        queryTime: Date.now() - startTime,
        facets
      };

      logger.info('Search completed', {
        query: searchQuery.query,
        resultsCount: results.length,
        queryTime: stats.queryTime,
        filters: searchQuery.filters
      });

      return { results, stats };
      
    } catch (error) {
      logger.error('Search failed', { error, query: searchQuery });
      throw error;
    }
  }

  /**
   * Perform semantic search using OpenAI embeddings
   */
  private async performSemanticSearch(
    searchQuery: SearchQuery,
    whereClause: any,
    skip: number,
    limit: number
  ): Promise<SearchResult[]> {
    if (!this.openai) {
      // Fallback to text-based search if OpenAI not available
      return this.performTextSearch(searchQuery, whereClause, skip, limit);
    }

    try {
      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(searchQuery.query);
      
      // Get documents with their embeddings
      const documents = await prisma.document.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          },
          chunks: {
            select: { content: true, metadata: true, chunkIndex: true }
          }
        },
        orderBy: this.getSortOrder(searchQuery.sortBy, searchQuery.sortOrder)
      });

      // Calculate relevance scores and create results
      const results: SearchResult[] = documents.map(doc => {
        const relevance = this.calculateRelevance(doc, searchQuery.query, queryEmbedding);
        const highlights = this.extractHighlights(doc, searchQuery.query);
        
        return {
          id: doc.id,
          title: doc.title,
          content: doc.extractedContent || '',
          subject: doc.subject,
          grade: doc.grade,
          documentType: doc.documentType,
          relevance,
          metadata: {
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            processingStatus: doc.processingStatus
          },
          highlights,
          uploadedBy: `${doc.user.firstName} ${doc.user.lastName}`,
          createdAt: doc.createdAt,
          downloadCount: 0 // TODO: Add download tracking
        };
      });

      // Sort by relevance
      return results.sort((a, b) => b.relevance - a.relevance);
      
    } catch (error) {
      logger.warn('Semantic search failed, falling back to text search', { error });
      return this.performTextSearch(searchQuery, whereClause, skip, limit);
    }
  }

  /**
   * Perform text-based search using database LIKE queries
   */
  private async performTextSearch(
    searchQuery: SearchQuery,
    whereClause: any,
    skip: number,
    limit: number
  ): Promise<SearchResult[]> {
    const searchTerms = searchQuery.query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Add text search conditions
    const textSearchWhere = {
      ...whereClause,
      OR: [
        { title: { contains: searchQuery.query, mode: 'insensitive' } },
        { subject: { contains: searchQuery.query, mode: 'insensitive' } },
        { extractedContent: { contains: searchQuery.query, mode: 'insensitive' } },
        ...searchTerms.map(term => ({
          extractedContent: { contains: term, mode: 'insensitive' }
        }))
      ]
    };

    const documents = await prisma.document.findMany({
      where: textSearchWhere,
      skip,
      take: limit,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: this.getSortOrder(searchQuery.sortBy, searchQuery.sortOrder)
    });

    return documents.map(doc => {
      const relevance = this.calculateTextRelevance(doc, searchQuery.query);
      const highlights = this.extractHighlights(doc, searchQuery.query);
      
      return {
        id: doc.id,
        title: doc.title,
        content: doc.extractedContent || '',
        subject: doc.subject,
        grade: doc.grade,
        documentType: doc.documentType,
        relevance,
        metadata: {
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          processingStatus: doc.processingStatus
        },
        highlights,
        uploadedBy: `${doc.user.firstName} ${doc.user.lastName}`,
        createdAt: doc.createdAt,
        downloadCount: 0
      };
    });
  }

  /**
   * Perform filter-based search without query
   */
  private async performFilterSearch(
    whereClause: any,
    skip: number,
    limit: number,
    sortBy?: string,
    sortOrder?: string
  ): Promise<SearchResult[]> {
    const documents = await prisma.document.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: this.getSortOrder(sortBy, sortOrder)
    });

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.extractedContent || '',
      subject: doc.subject,
      grade: doc.grade,
      documentType: doc.documentType,
      relevance: 1.0,
      metadata: {
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        processingStatus: doc.processingStatus
      },
      highlights: [],
      uploadedBy: `${doc.user.firstName} ${doc.user.lastName}`,
      createdAt: doc.createdAt,
      downloadCount: 0
    }));
  }

  /**
   * Build WHERE clause for database queries
   */
  private buildWhereClause(filters?: any): any {
    const where: any = {};

    if (filters?.subject) {
      where.subject = filters.subject;
    }

    if (filters?.grade) {
      where.grade = filters.grade;
    }

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    if (filters?.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    if (filters?.tags && filters.tags.length > 0) {
      // TODO: Implement tag-based filtering
      where.OR = filters.tags.map((tag: string) => ({
        extractedContent: { contains: tag, mode: 'insensitive' }
      }));
    }

    return where;
  }

  /**
   * Get sort order for database queries
   */
  private getSortOrder(sortBy?: string, sortOrder?: string): any {
    const order = sortOrder === 'desc' ? 'desc' : 'asc';
    
    switch (sortBy) {
      case 'date':
        return { createdAt: order };
      case 'title':
        return { title: order };
      case 'popularity':
        return { downloadCount: order };
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Calculate relevance score for semantic search
   */
  private calculateRelevance(doc: any, query: string, queryEmbedding: number[]): number {
    // TODO: Implement proper cosine similarity with embeddings
    // For now, use text-based relevance
    return this.calculateTextRelevance(doc, query);
  }

  /**
   * Calculate relevance score for text-based search
   */
  private calculateTextRelevance(doc: any, query: string): number {
    const queryLower = query.toLowerCase();
    const title = doc.title.toLowerCase();
    const content = (doc.extractedContent || '').toLowerCase();
    const subject = doc.subject.toLowerCase();

    let score = 0;

    // Title matches get highest weight
    if (title.includes(queryLower)) score += 10;
    
    // Subject matches get high weight
    if (subject.includes(queryLower)) score += 8;
    
    // Content matches get medium weight
    const contentMatches = (content.match(new RegExp(queryLower, 'gi')) || []).length;
    score += contentMatches * 2;

    // Exact phrase matches get bonus
    if (title.includes(queryLower)) score += 5;
    if (content.includes(queryLower)) score += 3;

    // Recency bonus (newer documents get slight boost)
    const daysSinceCreation = (Date.now() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) score += 1;

    return Math.min(score, 100) / 100; // Normalize to 0-1
  }

  /**
   * Extract highlighted snippets from content
   */
  private extractHighlights(doc: any, query: string): string[] {
    const highlights: string[] = [];
    const content = doc.extractedContent || '';
    const queryLower = query.toLowerCase();
    
    if (!content) return highlights;

    // Find context around query matches
    const sentences = content.split(/[.!?]+/);
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      let matchScore = 0;

      queryWords.forEach(word => {
        if (sentenceLower.includes(word)) matchScore++;
      });

      if (matchScore > 0) {
        const snippet = sentence.trim().substring(0, 150);
        if (snippet.length > 50) {
          highlights.push(snippet + (snippet.length === 150 ? '...' : ''));
        }
      }
    });

    return highlights.slice(0, 3); // Return top 3 highlights
  }

  /**
   * Generate embedding for search query
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', { error, text });
      throw error;
    }
  }

  /**
   * Calculate search facets for filtering
   */
  private async calculateFacets(whereClause: any): Promise<any> {
    const [subjects, grades, documentTypes, dateRanges] = await Promise.all([
      prisma.document.groupBy({
        by: ['subject'],
        where: whereClause,
        _count: { subject: true }
      }),
      prisma.document.groupBy({
        by: ['grade'],
        where: whereClause,
        _count: { grade: true }
      }),
      prisma.document.groupBy({
        by: ['documentType'],
        where: whereClause,
        _count: { documentType: true }
      }),
      this.calculateDateRanges(whereClause)
    ]);

    return {
      subjects: subjects.reduce((acc, item) => {
        acc[item.subject] = item._count.subject;
        return acc;
      }, {} as any),
      grades: grades.reduce((acc, item) => {
        acc[item.grade] = item._count.grade;
        return acc;
      }, {} as any),
      documentTypes: documentTypes.reduce((acc, item) => {
        acc[item.documentType] = item._count.documentType;
        return acc;
      }, {} as any),
      dateRanges
    };
  }

  /**
   * Calculate date range facets
   */
  private async calculateDateRanges(whereClause: any): Promise<any> {
    const now = new Date();
    const ranges = {
      'Last 7 days': 0,
      'Last 30 days': 0,
      'Last 3 months': 0,
      'Last year': 0,
      'Older': 0
    };

    const documents = await prisma.document.findMany({
      where: whereClause,
      select: { createdAt: true }
    });

    documents.forEach(doc => {
      const daysDiff = (now.getTime() - doc.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 7) ranges['Last 7 days']++;
      else if (daysDiff <= 30) ranges['Last 30 days']++;
      else if (daysDiff <= 90) ranges['Last 3 months']++;
      else if (daysDiff <= 365) ranges['Last year']++;
      else ranges['Older']++;
    });

    return ranges;
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const suggestions = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { title: true, subject: true },
        take: 5
      });

      const uniqueSuggestions = new Set<string>();
      suggestions.forEach(doc => {
        uniqueSuggestions.add(doc.title);
        uniqueSuggestions.add(doc.subject);
      });

      return Array.from(uniqueSuggestions).slice(0, 5);
    } catch (error) {
      logger.error('Failed to get search suggestions', { error, query });
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(): Promise<string[]> {
    // TODO: Implement search analytics to track popular terms
    // For now, return common educational terms
    return [
      'mathematics',
      'science',
      'english',
      'kiswahili',
      'social studies',
      'creative arts',
      'physical education',
      'religious education'
    ];
  }
}

export default new SearchService();
