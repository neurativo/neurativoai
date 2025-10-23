/**
 * Lazy loading system for study pack content
 */

export interface LazyLoadOptions {
  batchSize: number;
  delay: number;
  cacheTime: number;
}

export interface CachedContent {
  data: any;
  timestamp: number;
  expiresAt: number;
}

export class LazyLoader {
  private cache: Map<string, CachedContent> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private options: LazyLoadOptions;

  constructor(options: Partial<LazyLoadOptions> = {}) {
    this.options = {
      batchSize: 10,
      delay: 100,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      ...options
    };
  }

  /**
   * Load content with caching and batching
   */
  async loadContent<T>(
    key: string,
    loader: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Start loading
    const loadingPromise = this.loadWithRetry(loader);
    this.loadingPromises.set(key, loadingPromise);

    try {
      const data = await loadingPromise;
      
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.options.cacheTime
      });

      return data;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  /**
   * Load content with retry logic
   */
  private async loadWithRetry<T>(
    loader: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await loader();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to load content after retries');
  }

  /**
   * Load multiple items in batches
   */
  async loadBatch<T>(
    items: string[],
    loader: (item: string) => Promise<T>,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const batches = this.chunkArray(items, this.options.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map(async (item) => {
        const data = await this.loadContent(item, () => loader(item));
        results.set(item, data);
        return { item, data };
      });

      await Promise.all(batchPromises);
      
      if (onProgress) {
        onProgress(results.size, items.length);
      }

      // Delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.options.delay));
      }
    }

    return results;
  }

  /**
   * Preload content in the background
   */
  async preloadContent<T>(
    key: string,
    loader: () => Promise<T>
  ): Promise<void> {
    // Don't await - let it run in background
    this.loadContent(key, loader).catch(error => {
      console.warn(`Failed to preload content for key ${key}:`, error);
    });
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let totalMemory = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now < cached.expiresAt) {
        validEntries++;
        totalMemory += JSON.stringify(cached.data).length;
      }
    }

    return {
      size: validEntries,
      hitRate: validEntries / this.cache.size || 0,
      memoryUsage: totalMemory
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Study pack specific lazy loader
 */
export class StudyPackLazyLoader extends LazyLoader {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/study-pack') {
    super({
      batchSize: 5,
      delay: 200,
      cacheTime: 10 * 60 * 1000 // 10 minutes
    });
    this.baseUrl = baseUrl;
  }

  /**
   * Load study pack metadata
   */
  async loadMetadata(studyPackId: string): Promise<any> {
    return this.loadContent(
      `metadata_${studyPackId}`,
      async () => {
        const response = await fetch(`${this.baseUrl}/${studyPackId}/metadata`);
        if (!response.ok) throw new Error('Failed to load metadata');
        return response.json();
      }
    );
  }

  /**
   * Load study pack section
   */
  async loadSection(studyPackId: string, sectionId: string): Promise<any> {
    return this.loadContent(
      `section_${studyPackId}_${sectionId}`,
      async () => {
        const response = await fetch(`${this.baseUrl}/${studyPackId}/section/${sectionId}`);
        if (!response.ok) throw new Error('Failed to load section');
        return response.json();
      }
    );
  }

  /**
   * Load flashcards for a section
   */
  async loadFlashcards(studyPackId: string, sectionId: string): Promise<any[]> {
    return this.loadContent(
      `flashcards_${studyPackId}_${sectionId}`,
      async () => {
        const response = await fetch(`${this.baseUrl}/${studyPackId}/flashcards/${sectionId}`);
        if (!response.ok) throw new Error('Failed to load flashcards');
        return response.json();
      }
    );
  }

  /**
   * Load quiz for a section
   */
  async loadQuiz(studyPackId: string, sectionId: string): Promise<any> {
    return this.loadContent(
      `quiz_${studyPackId}_${sectionId}`,
      async () => {
        const response = await fetch(`${this.baseUrl}/${studyPackId}/quiz/${sectionId}`);
        if (!response.ok) throw new Error('Failed to load quiz');
        return response.json();
      }
    );
  }

  /**
   * Preload all sections for a study pack
   */
  async preloadStudyPack(studyPackId: string, sectionIds: string[]): Promise<void> {
    const preloadPromises = sectionIds.map(sectionId => 
      this.preloadContent(`section_${studyPackId}_${sectionId}`, async () => {
        const response = await fetch(`${this.baseUrl}/${studyPackId}/section/${sectionId}`);
        if (!response.ok) throw new Error('Failed to preload section');
        return response.json();
      })
    );

    await Promise.allSettled(preloadPromises);
  }
}

// Global instance
export const studyPackLoader = new StudyPackLazyLoader();
