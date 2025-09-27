import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';
import { YoutubeTranscript } from 'youtube-transcript';
import puppeteer from 'puppeteer';
// PDF parsing will be handled differently

export interface ExtractedContent {
  title: string;
  content: string;
  type: 'article' | 'youtube' | 'pdf' | 'github' | 'wikipedia' | 'medium' | 'dev' | 'stackoverflow' | 'reddit' | 'news' | 'blog' | 'documentation' | 'unknown';
  metadata?: {
    author?: string;
    publishedDate?: string;
    description?: string;
    tags?: string[];
    wordCount?: number;
    readingTime?: number;
    analysis?: {
      type: string;
      confidence: number;
      quality: string;
      structure: string;
      readability: string;
      topics: string[];
      sentiment: string;
      complexity: string;
    };
  };
  error?: string;
}

export class URLContentExtractor {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  private static readonly CONTENT_SELECTORS = {
    // Common article selectors
    article: [
      'article',
      '[role="article"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '.main-content',
      '.article-body',
      '.post-body'
    ],
    // Title selectors
    title: [
      'h1',
      '.title',
      '.post-title',
      '.article-title',
      '.entry-title',
      '[data-testid="post-title"]',
      'title'
    ],
    // Author selectors
    author: [
      '.author',
      '.byline',
      '.post-author',
      '.article-author',
      '[rel="author"]',
      '.author-name'
    ],
    // Date selectors
    date: [
      'time',
      '.date',
      '.published',
      '.post-date',
      '.article-date',
      '[datetime]'
    ]
  };

  // Advanced content analysis patterns
  private static readonly CONTENT_PATTERNS = {
    // High-value content indicators
    qualityIndicators: [
      /introduction|overview|summary|abstract/i,
      /methodology|approach|technique|process/i,
      /analysis|evaluation|assessment|review/i,
      /conclusion|findings|results|outcome/i,
      /discussion|implications|significance/i,
      /background|context|history|overview/i
    ],
    // Low-value content indicators
    noiseIndicators: [
      /click here|read more|continue reading|show more/i,
      /subscribe|newsletter|follow us|like us/i,
      /advertisement|sponsored|promo|affiliate/i,
      /cookie|privacy|terms|disclaimer/i,
      /loading|please wait|error|javascript/i,
      /share on|follow|subscribe|newsletter/i,
      /buy now|add to cart|purchase|checkout/i,
      /related|recommended|trending|popular/i,
      /comments|reviews|rating|vote/i,
      /social|facebook|twitter|instagram/i
    ],
    // Academic/scientific content patterns
    academicPatterns: [
      /abstract|introduction|methodology|results|discussion|conclusion/i,
      /figure \d+|table \d+|equation \d+|formula/i,
      /references|citations|bibliography|works cited/i,
      /doi:|arxiv:|pubmed:|pmc:/i,
      /et al\.|et al,|et al /i,
      /p < 0\.\d+|p = 0\.\d+|statistical significance/i
    ],
    // News content patterns
    newsPatterns: [
      /breaking|urgent|alert|update|developing/i,
      /according to|sources say|officials|spokesperson/i,
      /reported|confirmed|denied|announced/i,
      /by \w+ \w+|staff writer|correspondent/i,
      /ap|reuters|associated press|bloomberg/i
    ],
    // Technical documentation patterns
    techPatterns: [
      /api|endpoint|method|function|class|interface/i,
      /installation|setup|configuration|usage/i,
      /example|sample|demo|tutorial/i,
      /version \d+\.\d+|changelog|release notes/i,
      /deprecated|obsolete|legacy|migration/i
    ]
  };

  // Content quality scoring weights
  private static readonly QUALITY_WEIGHTS = {
    length: 0.25,
    paragraphDensity: 0.20,
    headingStructure: 0.15,
    wordDensity: 0.10,
    qualityIndicators: 0.15,
    academicPatterns: 0.10,
    noisePenalty: 0.05
  };

  static async extractContent(url: string): Promise<ExtractedContent> {
    try {
      // Validate URL
      const parsedUrl = new URL(url);
      
      // Detect content type based on URL
      const contentType = this.detectContentType(url);
      
      // Route to appropriate extractor
      switch (contentType) {
        case 'youtube':
          return await this.extractYouTubeContent(url);
        case 'pdf':
          return await this.extractPDFContent(url);
        case 'github':
          return await this.extractGitHubContent(url);
        case 'wikipedia':
          return await this.extractWikipediaContent(url);
        case 'medium':
          return await this.extractMediumContent(url);
        case 'dev':
          return await this.extractDevContent(url);
        case 'stackoverflow':
          return await this.extractStackOverflowContent(url);
        case 'reddit':
          return await this.extractRedditContent(url);
        case 'news':
          return await this.extractNewsContent(url);
        case 'blog':
          return await this.extractBlogContent(url);
        case 'documentation':
          return await this.extractDocumentationContent(url);
        default:
          return await this.extractGenericContent(url);
      }
    } catch (error) {
      console.error('URL extraction error:', error);
      return {
        title: 'Error',
        content: '',
        type: 'unknown',
        error: `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static detectContentType(url: string): string {
    const hostname = new URL(url).hostname.toLowerCase();
    const pathname = new URL(url).pathname.toLowerCase();
    
    // Video content
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('vimeo.com') || hostname.includes('dailymotion.com')) return 'video';
    
    // Document content
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.endsWith('.doc') || url.endsWith('.docx')) return 'document';
    if (url.endsWith('.ppt') || url.endsWith('.pptx')) return 'presentation';
    
    // Code repositories
    if (hostname.includes('github.com')) return 'github';
    if (hostname.includes('gitlab.com') || hostname.includes('bitbucket.org')) return 'repository';
    
    // Knowledge bases
    if (hostname.includes('wikipedia.org')) return 'wikipedia';
    if (hostname.includes('wikia.com') || hostname.includes('fandom.com')) return 'wiki';
    
    // Publishing platforms
    if (hostname.includes('medium.com')) return 'medium';
    if (hostname.includes('dev.to')) return 'dev';
    if (hostname.includes('hashnode.com')) return 'blog';
    if (hostname.includes('substack.com')) return 'newsletter';
    
    // Q&A and forums
    if (hostname.includes('stackoverflow.com')) return 'stackoverflow';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('quora.com')) return 'quora';
    if (hostname.includes('discord.com') || hostname.includes('discord.gg')) return 'forum';
    
    // News and media
    if (hostname.includes('bbc.com') || hostname.includes('cnn.com') || 
        hostname.includes('reuters.com') || hostname.includes('nytimes.com') ||
        hostname.includes('theguardian.com') || hostname.includes('washingtonpost.com') ||
        hostname.includes('wsj.com') || hostname.includes('bloomberg.com')) return 'news';
    
    // Academic and research
    if (hostname.includes('arxiv.org') || hostname.includes('scholar.google.com') ||
        hostname.includes('pubmed.ncbi.nlm.nih.gov') || hostname.includes('researchgate.net') ||
        hostname.includes('academia.edu') || hostname.includes('jstor.org')) return 'academic';
    
    // E-commerce
    if (hostname.includes('amazon.com') || hostname.includes('ebay.com') ||
        hostname.includes('shopify.com') || hostname.includes('etsy.com') ||
        hostname.includes('alibaba.com') || hostname.includes('walmart.com')) return 'ecommerce';
    
    // Social media
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'social';
    if (hostname.includes('facebook.com') || hostname.includes('instagram.com')) return 'social';
    if (hostname.includes('linkedin.com')) return 'professional';
    
    // Documentation and help
    if (hostname.includes('docs.') || hostname.includes('documentation') ||
        hostname.includes('help.') || hostname.includes('support.')) return 'documentation';
    
    // Educational content
    if (hostname.includes('coursera.org') || hostname.includes('udemy.com') ||
        hostname.includes('khanacademy.org') || hostname.includes('edx.org') ||
        hostname.includes('skillshare.com')) return 'educational';
    
    // Government and official
    if (hostname.includes('.gov') || hostname.includes('.edu')) return 'official';
    
    // Blog and personal sites
    if (hostname.includes('blog.') || hostname.includes('.blog') ||
        hostname.includes('wordpress.com') || hostname.includes('blogspot.com') ||
        hostname.includes('tumblr.com')) return 'blog';
    
    // Technical and developer resources
    if (hostname.includes('npmjs.com') || hostname.includes('pypi.org') ||
        hostname.includes('maven.org') || hostname.includes('nuget.org') ||
        hostname.includes('packagist.org')) return 'package';
    
    // Default to article for unknown types
    return 'article';
  }

  private static async extractYouTubeContent(url: string): Promise<ExtractedContent> {
    try {
      // Extract video ID
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Try multiple approaches to get transcript
      let transcript;
      let content = '';
      let title = 'YouTube Video';

      // Method 1: Try youtube-transcript library with different options
      const transcriptOptions = [
        { lang: 'en' },
        { lang: 'en-US' },
        { lang: 'en-GB' },
        { lang: 'auto' },
        {} // Default options last
      ];

      for (const options of transcriptOptions) {
        try {
          transcript = await YoutubeTranscript.fetchTranscript(videoId, options);
          if (transcript && Array.isArray(transcript) && transcript.length > 0) {
            content = transcript.map(item => item.text || '').join(' ').trim();
            if (content.length > 10) {
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Method 2: If transcript library fails, try Puppeteer to extract captions
      if (!content || content.length < 10) {
        try {
          const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
          });
          const page = await browser.newPage();
          await page.setUserAgent(this.USER_AGENT);
          
          // Go to the video page
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Try to get title
          try {
            title = await page.$eval('h1.title', el => el.textContent?.trim() || '') || 
                    await page.$eval('h1', el => el.textContent?.trim() || '') ||
                    await page.$eval('title', el => el.textContent?.trim() || '') || 
                    'YouTube Video';
          } catch (titleError) {
            console.log('Could not extract title, using default');
          }

          // Try to extract captions from the page
          try {
            const captions = await page.evaluate(() => {
              // Look for caption elements
              const captionSelectors = [
                '.ytp-caption-segment',
                '.caption-line',
                '.ytp-caption-window-container .ytp-caption-segment',
                '[data-purpose="captions-text"]'
              ];
              
              let captionText = '';
              for (const selector of captionSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  captionText = Array.from(elements).map(el => el.textContent || '').join(' ').trim();
                  if (captionText.length > 10) break;
                }
              }
              
              return captionText;
            });
            
            if (captions && captions.length > 10) {
              content = captions;
            }
          } catch (captionError) {
            console.log('Could not extract captions from page');
          }

          await browser.close();
        } catch (browserError) {
          console.error('Browser extraction failed:', browserError);
        }
      }

      // Final validation
      if (!content || content.trim().length < 10) {
        throw new Error('No transcript or captions available for this video. The video may not have captions enabled, may be private/restricted, or may not support transcript extraction.');
      }

      return {
        title,
        content,
        type: 'youtube',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      console.error('YouTube extraction error:', error);
      throw new Error(`YouTube extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private static async extractPDFContent(url: string): Promise<ExtractedContent> {
    try {
      // First, try to fetch the PDF and extract text using a simple approach
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check if it's actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('pdf')) {
        throw new Error('URL does not point to a PDF file');
      }
      
      // For now, we'll return a message that PDF extraction is not fully supported
      // In a production environment, you would use a proper PDF parsing library
      return {
        title: 'PDF Document',
        content: 'PDF content extraction is currently not fully supported. Please copy and paste the text content manually using the "By Text" option, or try a different URL format.',
        type: 'pdf',
        metadata: {
          wordCount: 0,
          readingTime: 0
        },
        error: 'PDF extraction not fully implemented. Please use "By Text" option instead.'
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractGitHubContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract README content
      const readmeContent = $('#readme .markdown-body').html() || '';
      const content = cheerio.load(readmeContent).text();
      
      // Extract title
      const title = $('h1 strong a').text() || $('h1').text() || 'GitHub Repository';
      
      return {
        title,
        content,
        type: 'github',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`GitHub extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractWikipediaContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract main content
      const content = $('#mw-content-text .mw-parser-output').text();
      const title = $('#firstHeading').text() || 'Wikipedia Article';
      
      return {
        title,
        content,
        type: 'wikipedia',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Wikipedia extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractMediumContent(url: string): Promise<ExtractedContent> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(this.USER_AGENT);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Extract content
      const content = await page.evaluate(() => {
        const article = document.querySelector('article') || document.querySelector('[data-testid="post-content"]');
        return article ? article.textContent || '' : '';
      });
      
      const title = await page.$eval('h1', el => el.textContent?.trim() || '') || 
                   await page.$eval('title', el => el.textContent?.trim() || '') || 
                   'Medium Article';
      
      await browser.close();

      return {
        title,
        content,
        type: 'medium',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Medium extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractDevContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract article content
      const content = $('article .crayons-article__body').text() || 
                     $('.article-body').text() || 
                     $('article').text();
      
      const title = $('h1').text() || $('title').text() || 'Dev.to Article';
      
      return {
        title,
        content,
        type: 'dev',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Dev.to extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractStackOverflowContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract question and answers
      const question = $('.question .post-text').text();
      const answers = $('.answer .post-text').map((_, el) => $(el).text()).get().join(' ');
      const content = `${question}\n\nAnswers:\n${answers}`;
      
      const title = $('h1 a').text() || $('title').text() || 'Stack Overflow Question';
      
      return {
        title,
        content,
        type: 'stackoverflow',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Stack Overflow extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractRedditContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract post content and top comments
      const postContent = $('[data-testid="post-content"]').text() || 
                         $('.post-content').text() || 
                         $('article').text();
      
      const comments = $('.comment').slice(0, 5).map((_, el) => $(el).text()).get().join(' ');
      const content = `${postContent}\n\nTop Comments:\n${comments}`;
      
      const title = $('h1').text() || $('title').text() || 'Reddit Post';
      
      return {
        title,
        content,
        type: 'reddit',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Reddit extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractNewsContent(url: string): Promise<ExtractedContent> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(this.USER_AGENT);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Extract article content
      const content = await page.evaluate(() => {
        const selectors = [
          'article',
          '.article-content',
          '.story-body',
          '.article-body',
          '.post-content',
          '.entry-content'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.textContent || '';
          }
        }
        return '';
      });
      
      const title = await page.$eval('h1', el => el.textContent?.trim() || '') || 
                   await page.$eval('title', el => el.textContent?.trim() || '') || 
                   'News Article';
      
      await browser.close();

      return {
        title,
        content,
        type: 'news',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`News extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractBlogContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract blog post content
      const content = $('article').text() || 
                     $('.post-content').text() || 
                     $('.entry-content').text() || 
                     $('.blog-content').text() || 
                     $('.content').text();
      
      const title = $('h1').text() || $('.post-title').text() || $('title').text() || 'Blog Post';
      
      return {
        title,
        content,
        type: 'blog',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Blog extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractDocumentationContent(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract documentation content
      const content = $('main').text() || 
                     $('.documentation').text() || 
                     $('.docs-content').text() || 
                     $('article').text() || 
                     $('.content').text();
      
      const title = $('h1').text() || $('.page-title').text() || $('title').text() || 'Documentation';
      
      return {
        title,
        content,
        type: 'documentation',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200)
        }
      };
    } catch (error) {
      throw new Error(`Documentation extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractGenericContent(url: string): Promise<ExtractedContent> {
    try {
      // Try Puppeteer first, but fallback to HTTP fetch if it fails
      let browser;
      let page;
      
      try {
        browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        page = await browser.newPage();
        await page.setUserAgent(this.USER_AGENT);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (puppeteerError) {
        console.log('Puppeteer failed, falling back to HTTP fetch:', puppeteerError);
        // Fallback to HTTP fetch
        return await this.extractWithHttpFetch(url);
      }
      
      // Extract content using smart strategies
      const result = await page.evaluate(() => {
        // Comprehensive removal of unwanted elements
        const unwantedSelectors = [
          // Navigation and UI elements
          'nav', 'header', 'footer', 'aside', 'menu', '.menu', '.navigation', '.nav',
          '.navbar', '.header', '.footer', '.sidebar', '.side-menu', '.top-menu',
          '.breadcrumb', '.breadcrumbs', '.pagination', '.pager',
          
          // Ads and promotional content
          '.advertisement', '.ad', '.ads', '.advertisement-container', '.ad-container',
          '.promo', '.promotion', '.sponsored', '.sponsor', '.affiliate',
          '.banner', '.banner-ad', '.popup', '.modal', '.overlay',
          
          // Social and sharing
          '.social', '.social-media', '.share', '.sharing', '.social-share',
          '.follow', '.subscribe', '.newsletter', '.email-signup',
          
          // Comments and user interaction
          '.comments', '.comment', '.comment-section', '.user-comments',
          '.reviews', '.rating', '.vote', '.like', '.dislike',
          
          // Related and recommended content
          '.related', '.recommended', '.suggested', '.similar', '.more-articles',
          '.trending', '.popular', '.featured', '.latest', '.recent',
          
          // Legal and policy
          '.cookie', '.privacy', '.terms', '.disclaimer', '.legal', '.policy',
          '.gdpr', '.consent', '.accept', '.decline',
          
          // Technical elements
          'script', 'style', 'noscript', 'iframe', 'embed', 'object',
          '.analytics', '.tracking', '.pixel', '.beacon',
          
          // Common noise elements
          '.noise', '.junk', '.spam', '.irrelevant', '.unrelated',
          '.widget', '.widget-container', '.plugin', '.addon',
          
          // Site-specific patterns
          '.site-header', '.site-footer', '.site-nav', '.site-menu',
          '.main-nav', '.primary-nav', '.secondary-nav',
          '.content-nav', '.article-nav', '.page-nav',
          
          // E-commerce specific
          '.cart', '.checkout', '.product-nav', '.category-nav',
          '.price', '.buy-now', '.add-to-cart', '.purchase',
          
          // Blog specific
          '.blog-nav', '.post-nav', '.author-bio', '.author-info',
          '.post-meta', '.post-tags', '.post-categories',
          
          // News specific
          '.breaking-news', '.news-ticker', '.live-updates',
          '.weather', '.stock', '.market-data'
        ];

        // Remove unwanted elements
        unwantedSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });

        // Advanced neural content scoring system
        function calculateContentScore(text: string, element: Element | null = null) {
          if (!text || text.length < 50) return 0;
          
          const scores = {
            length: 0,
            paragraphDensity: 0,
            headingStructure: 0,
            wordDensity: 0,
            qualityIndicators: 0,
            academicPatterns: 0,
            newsPatterns: 0,
            techPatterns: 0,
            noisePenalty: 0,
            readability: 0,
            semanticCoherence: 0,
            contentDepth: 0
          };

          // 1. Length Analysis (weighted importance)
          scores.length = Math.min(text.length / 100, 100) * 0.25;
          
          // 2. Paragraph Density Analysis
          const paragraphs = element ? element.querySelectorAll('p') : document.querySelectorAll('p');
          const paragraphCount = paragraphs.length;
          const avgParagraphLength = paragraphCount > 0 ? text.length / paragraphCount : 0;
          scores.paragraphDensity = Math.min(paragraphCount * 2, 50) * 0.20;
          
          // 3. Heading Structure Analysis
          const headings = element ? element.querySelectorAll('h1, h2, h3, h4, h5, h6') : document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const headingCount = headings.length;
          const headingHierarchy = Array.from(headings).map(h => parseInt(h.tagName.charAt(1))).sort();
          const hierarchyScore = headingHierarchy.length > 1 ? 
            (headingHierarchy[headingHierarchy.length - 1] - headingHierarchy[0]) / headingHierarchy.length : 0;
          scores.headingStructure = (Math.min(headingCount * 3, 30) + hierarchyScore * 5) * 0.15;
          
          // 4. Word Density and Sentence Analysis
          const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
          const words = text.split(/\s+/).filter((w: string) => w.length > 0);
          const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
          const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
          scores.wordDensity = Math.min(avgWordsPerSentence * 2, 20) * 0.10;
          
          // 5. Quality Indicators Analysis
          const qualityMatches = URLContentExtractor.CONTENT_PATTERNS.qualityIndicators.reduce((count: number, pattern: RegExp) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.qualityIndicators = Math.min(qualityMatches * 10, 50) * 0.15;
          
          // 6. Academic/Scientific Content Detection
          const academicMatches = URLContentExtractor.CONTENT_PATTERNS.academicPatterns.reduce((count: number, pattern: RegExp) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.academicPatterns = Math.min(academicMatches * 15, 60) * 0.10;
          
          // 7. News Content Detection
          const newsMatches = URLContentExtractor.CONTENT_PATTERNS.newsPatterns.reduce((count: number, pattern: RegExp) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.newsPatterns = Math.min(newsMatches * 8, 40) * 0.05;
          
          // 8. Technical Documentation Detection
          const techMatches = URLContentExtractor.CONTENT_PATTERNS.techPatterns.reduce((count: number, pattern: RegExp) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.techPatterns = Math.min(techMatches * 12, 50) * 0.05;
          
          // 9. Noise Penalty Analysis
          const noiseMatches = URLContentExtractor.CONTENT_PATTERNS.noiseIndicators.reduce((count: number, pattern: RegExp) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.noisePenalty = Math.min(noiseMatches * 5, 30) * 0.05;
          
          // 10. Readability Analysis (Flesch-like scoring)
          const syllableCount = words.reduce((count, word) => {
            return count + Math.max(1, word.length / 3); // Approximate syllable count
          }, 0);
          const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * syllableCount / words.length);
          scores.readability = Math.max(0, Math.min(fleschScore / 10, 20)) * 0.05;
          
          // 11. Semantic Coherence Analysis
          const uniqueWords = new Set(words.map(w => w.toLowerCase()));
          const vocabularyDiversity = uniqueWords.size / words.length;
          const sentenceVariation = sentences.length > 1 ? 
            Math.abs(sentences[0].length - sentences[sentences.length - 1].length) / Math.max(sentences[0].length, sentences[sentences.length - 1].length) : 0;
          scores.semanticCoherence = (vocabularyDiversity * 20 + sentenceVariation * 10) * 0.05;
          
          // 12. Content Depth Analysis
          const depthIndicators = [
            /however|although|despite|nevertheless|furthermore|moreover|additionally/i,
            /first|second|third|finally|consequently|therefore|thus|hence/i,
            /example|instance|case|illustration|demonstration/i,
            /research|study|analysis|investigation|examination/i,
            /data|evidence|findings|results|conclusions/i
          ];
          const depthMatches = depthIndicators.reduce((count, pattern) => {
            return count + (pattern.test(text) ? 1 : 0);
          }, 0);
          scores.contentDepth = Math.min(depthMatches * 8, 40) * 0.05;
          
          // Calculate weighted total score
          let totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
          
          // Apply content type bonuses
          let typeBonus = 0;
          if (scores.academicPatterns > 20) typeBonus += 15; // Academic content bonus
          if (scores.techPatterns > 15) typeBonus += 10; // Technical content bonus
          if (scores.newsPatterns > 10) typeBonus += 8; // News content bonus
          
          // Apply length-based penalties and bonuses
          if (text.length < 100) totalScore -= 30; // Too short
          else if (text.length < 500) totalScore -= 10; // Short content
          else if (text.length > 5000 && text.length < 15000) totalScore += 10; // Optimal length
          else if (text.length > 15000) totalScore -= 5; // Very long content
          
          // Apply quality-based penalties
          if (scores.noisePenalty > 15) totalScore -= 20; // High noise content
          if (scores.readability < 5) totalScore -= 10; // Poor readability
          if (scores.semanticCoherence < 5) totalScore -= 15; // Poor coherence
          
          return Math.max(0, totalScore + typeBonus);
        }

        // Advanced content structure analysis
        function analyzeContentStructure(text: string, element: Element) {
          const analysis = {
            type: 'unknown',
            confidence: 0,
            quality: 'low',
            structure: 'poor',
            readability: 'difficult',
            topics: [] as string[],
            sentiment: 'neutral',
            complexity: 'basic'
          };

          // Content type detection
          if (URLContentExtractor.CONTENT_PATTERNS.academicPatterns.some((p: RegExp) => p.test(text))) {
            analysis.type = 'academic';
            analysis.confidence += 30;
          } else if (URLContentExtractor.CONTENT_PATTERNS.newsPatterns.some((p: RegExp) => p.test(text))) {
            analysis.type = 'news';
            analysis.confidence += 25;
          } else if (URLContentExtractor.CONTENT_PATTERNS.techPatterns.some((p: RegExp) => p.test(text))) {
            analysis.type = 'technical';
            analysis.confidence += 20;
          } else {
            analysis.type = 'general';
            analysis.confidence += 10;
          }

          // Quality assessment
          const qualityScore = URLContentExtractor.CONTENT_PATTERNS.qualityIndicators.reduce((score: number, pattern: RegExp) => {
            return score + (pattern.test(text) ? 1 : 0);
          }, 0);
          
          if (qualityScore >= 3) analysis.quality = 'high';
          else if (qualityScore >= 1) analysis.quality = 'medium';
          else analysis.quality = 'low';

          // Structure analysis
          const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const paragraphs = element.querySelectorAll('p');
          const lists = element.querySelectorAll('ul, ol');
          const images = element.querySelectorAll('img');
          
          const structureScore = headings.length * 2 + paragraphs.length + lists.length + images.length;
          if (structureScore >= 20) analysis.structure = 'excellent';
          else if (structureScore >= 10) analysis.structure = 'good';
          else if (structureScore >= 5) analysis.structure = 'fair';
          else analysis.structure = 'poor';

          // Readability analysis
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
          const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
          
          if (avgWordsPerSentence <= 15 && avgWordLength <= 5) analysis.readability = 'easy';
          else if (avgWordsPerSentence <= 20 && avgWordLength <= 6) analysis.readability = 'moderate';
          else analysis.readability = 'difficult';

          // Topic extraction
          const topicKeywords = [
            'technology', 'science', 'business', 'health', 'education', 'politics',
            'sports', 'entertainment', 'travel', 'food', 'fashion', 'finance',
            'environment', 'art', 'music', 'literature', 'history', 'philosophy'
          ];
          
          analysis.topics = topicKeywords.filter(keyword => 
            new RegExp(keyword, 'i').test(text)
          );

          // Sentiment analysis (basic)
          const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best'];
          const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor'];
          
          const positiveCount = positiveWords.reduce((count, word) => 
            count + (text.toLowerCase().split(word).length - 1), 0);
          const negativeCount = negativeWords.reduce((count, word) => 
            count + (text.toLowerCase().split(word).length - 1), 0);
          
          if (positiveCount > negativeCount) analysis.sentiment = 'positive';
          else if (negativeCount > positiveCount) analysis.sentiment = 'negative';
          else analysis.sentiment = 'neutral';

          // Complexity analysis
          const complexWords = words.filter(w => w.length > 8).length;
          const complexRatio = words.length > 0 ? complexWords / words.length : 0;
          
          if (complexRatio >= 0.3) analysis.complexity = 'advanced';
          else if (complexRatio >= 0.15) analysis.complexity = 'intermediate';
          else analysis.complexity = 'basic';

          return analysis;
        }

        // Function to filter body content
        function filterBodyContent(text: string) {
          // Remove common noise patterns
          const noisePatterns = [
            /cookie/i, /privacy/i, /terms/i, /disclaimer/i,
            /subscribe/i, /newsletter/i, /follow us/i,
            /share on/i, /like us/i, /follow us/i,
            /advertisement/i, /sponsored/i, /promo/i,
            /click here/i, /read more/i, /continue reading/i,
            /loading/i, /please wait/i, /error/i,
            /javascript/i, /enable javascript/i,
            /browser/i, /upgrade/i, /update/i
          ];
          
          const lines = text.split('\n');
          const filteredLines = lines.filter((line: string) => {
            const trimmed = line.trim();
            if (trimmed.length < 10) return false;
            
            return !noisePatterns.some(pattern => pattern.test(trimmed));
          });
          
          return filteredLines.join('\n');
        }

        // Get title with multiple fallbacks
        let title = '';
        const titleSelectors = [
          'h1.title', 'h1.entry-title', 'h1.post-title', 'h1.article-title',
          'h1.page-title', 'h1.headline', 'h1.heading',
          '.title h1', '.entry-title', '.post-title', '.article-title',
          '.page-title', '.headline', '.heading',
          'title', 'h1'
        ];

        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            title = element.textContent?.trim() || '';
            if (title.length > 5 && title.length < 200) {
              break;
            }
          }
        }

        if (!title) title = 'Web Article';

        // Advanced neural content extraction with logical reasoning
        let content = '';
        let bestContent = '';
        let bestScore = 0;
        let contentAnalysis = {
          type: 'unknown',
          confidence: 0,
          quality: 'low',
          structure: 'poor',
          readability: 'difficult',
          topics: [] as string[],
          sentiment: 'neutral',
          complexity: 'basic'
        };

        // Strategy 1: Semantic content containers with neural analysis
        const semanticSelectors = [
          'article', 'main', '[role="main"]', '[role="article"]',
          '.content', '.post-content', '.article-content', '.entry-content',
          '.post-body', '.article-body', '.story-content', '.main-content',
          '.page-content', '.text-content', '.body-content'
        ];

        for (const selector of semanticSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim() || '';
            const score = calculateContentScore(text, element as Element);
            
            // Advanced content analysis
            const analysis = analyzeContentStructure(text, element as Element);
            
            if (score > bestScore) {
              bestContent = text;
              bestScore = score;
              contentAnalysis = analysis;
            }
          }
        }

        // Strategy 2: Look for content by paragraph density
        const paragraphs = document.querySelectorAll('p');
        if (paragraphs.length > 0) {
          let paragraphText = '';
          paragraphs.forEach(p => {
            const text = p.textContent?.trim() || '';
            if (text.length > 50) { // Only include substantial paragraphs
              paragraphText += text + ' ';
            }
          });
          
          if (paragraphText.length > 0) {
            const score = calculateContentScore(paragraphText);
            if (score > bestScore) {
              bestContent = paragraphText;
              bestScore = score;
            }
          }
        }

        // Strategy 3: Look for content by heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length > 0) {
          let headingText = '';
          headings.forEach(h => {
            const text = h.textContent?.trim() || '';
            if (text.length > 10) {
              headingText += text + ' ';
            }
          });
          
          if (headingText.length > 0) {
            const score = calculateContentScore(headingText);
            if (score > bestScore) {
              bestContent = headingText;
              bestScore = score;
            }
          }
        }

        // Strategy 4: Fallback to body content with smart filtering
        if (!bestContent || bestContent.length < 100) {
          const bodyText = document.body.textContent || '';
          const filteredText = filterBodyContent(bodyText);
          const score = calculateContentScore(filteredText);
          if (score > bestScore) {
            bestContent = filteredText;
          }
        }

        content = bestContent || document.body.textContent || '';
        
        // Clean up content
        content = content
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
          .trim();

        return { title, content, analysis: contentAnalysis };
      });
      
      await browser.close();

      // Final validation
      if (!result.content || result.content.length < 50) {
        throw new Error('No meaningful content found on this page');
      }

      return {
        title: result.title,
        content: result.content,
        type: 'article',
        metadata: {
          wordCount: result.content.split(' ').length,
          readingTime: Math.ceil(result.content.split(' ').length / 200),
          analysis: {
            type: result.analysis?.type || 'general',
            confidence: result.analysis?.confidence || 50,
            quality: result.analysis?.quality || 'medium',
            structure: result.analysis?.structure || 'fair',
            readability: result.analysis?.readability || 'moderate',
            topics: result.analysis?.topics || [],
            sentiment: result.analysis?.sentiment || 'neutral',
            complexity: result.analysis?.complexity || 'intermediate'
          }
        }
      };
    } catch (error) {
      // If Puppeteer fails, try HTTP fetch as fallback
      console.log('Puppeteer extraction failed, trying HTTP fetch fallback:', error);
      try {
        return await this.extractWithHttpFetch(url);
      } catch (fallbackError) {
        throw new Error(`Generic extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // HTTP fetch fallback method for serverless environments
  private static async extractWithHttpFetch(url: string): Promise<ExtractedContent> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .ad, .advertisement, .ads, .social, .share, .comments, .comment, .related, .recommended, .trending, .popular, .featured, .latest, .recent, .cookie, .privacy, .terms, .disclaimer, .legal, .policy, .gdpr, .consent, .accept, .decline, .analytics, .tracking, .pixel, .beacon, .noise, .junk, .spam, .irrelevant, .unrelated, .widget, .widget-container, .plugin, .addon, .site-header, .site-footer, .site-nav, .site-menu, .main-nav, .primary-nav, .secondary-nav, .content-nav, .article-nav, .page-nav, .cart, .checkout, .product-nav, .category-nav, .price, .buy-now, .add-to-cart, .purchase, .blog-nav, .post-nav, .author-bio, .author-info, .post-meta, .post-tags, .post-categories, .breaking-news, .news-ticker, .live-updates, .weather, .stock, .market-data').remove();

      // Extract title
      const title = $('h1').first().text().trim() || 
                   $('title').text().trim() || 
                   $('meta[property="og:title"]').attr('content') || 
                   'Untitled';

      // Extract content from common article selectors
      let content = '';
      const contentSelectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        '.main-content',
        '.article-body',
        '.post-body',
        '.entry',
        '.post',
        'main',
        '.main'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) break;
        }
      }

      // If no content found, try to get from body
      if (!content || content.length < 100) {
        content = $('body').text().trim();
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (!content || content.length < 50) {
        throw new Error('No meaningful content found on this page');
      }

      return {
        title,
        content,
        type: 'article',
        metadata: {
          wordCount: content.split(' ').length,
          readingTime: Math.ceil(content.split(' ').length / 200),
          analysis: {
            type: 'general',
            confidence: 60,
            quality: 'medium',
            structure: 'fair',
            readability: 'moderate',
            topics: [],
            sentiment: 'neutral',
            complexity: 'intermediate'
          }
        }
      };
    } catch (error) {
      throw new Error(`HTTP fetch extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility method to clean and summarize content
  static cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  // Utility method to summarize content if it's too long
  static summarizeContent(content: string, maxLength: number = 8000): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Try to find good breaking points (sentences)
    const sentences = content.split(/[.!?]+/);
    let summary = '';
    
    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) {
        break;
      }
      summary += sentence + '. ';
    }
    
    return summary.trim() || content.substring(0, maxLength) + '...';
  }
}
