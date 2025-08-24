import logger from '../utils/logger';

export interface TextChunk {
  id: string;
  content: string;
  metadata: any;
}

export interface SearchResult {
  chunk: TextChunk;
  similarity: number;
  rank: number;
}

export class EmbeddingService {
  private static instance: EmbeddingService;

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async initialize(): Promise<void> {
    logger.info('EmbeddingService initialized (mock)');
  }

  async processDocument(filePath: string, metadata: any): Promise<string[]> {
    logger.info(`Processing document: ${filePath}`);
    // Mock implementation - return empty array for now
    return [];
  }

  async searchSimilar(query: string, limit: number = 10): Promise<SearchResult[]> {
    logger.info(`Searching for: ${query}`);
    // Mock implementation - return empty array for now
    return [];
  }

  async getAllDocuments(): Promise<any[]> {
    logger.info('Getting all documents (mock)');
    return [];
  }

  async deleteDocument(filename: string): Promise<void> {
    logger.info(`Deleting document: ${filename}`);
    // Mock implementation
  }
}

export default EmbeddingService;
