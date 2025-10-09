// Analytics service for tracking user behavior and performance metrics

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
    this.trackPageView();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformanceMetric('LCP', lastEntry.startTime, 'ms');
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformanceMetric('FID', (entry as any).processingStart - entry.startTime, 'ms');
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackPerformanceMetric('CLS', clsValue, 'score');
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  private trackPageView(): void {
    this.trackEvent('page_view', {
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public trackEvent(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        page: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.userId
      },
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);

    // Also send to Google Analytics if available
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', event, properties);
    }
  }

  public trackPerformanceMetric(name: string, value: number, unit: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    this.performanceMetrics.push(metric);
    this.sendToAnalytics({
      event: 'performance_metric',
      properties: {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        page: window.location.pathname
      }
    });
  }

  public trackQuizEvent(action: string, quizId?: string, score?: number, timeTaken?: number): void {
    this.trackEvent('quiz_interaction', {
      action,
      quiz_id: quizId,
      score,
      time_taken: timeTaken,
      page: 'quiz'
    });
  }

  public trackLectureEvent(action: string, duration?: number, transcriptLength?: number): void {
    this.trackEvent('lecture_interaction', {
      action,
      duration,
      transcript_length: transcriptLength,
      page: 'lecture'
    });
  }

  public trackStudyPackEvent(action: string, documentType?: string, pageCount?: number): void {
    this.trackEvent('study_pack_interaction', {
      action,
      document_type: documentType,
      page_count: pageCount,
      page: 'study-pack'
    });
  }

  public trackConversion(event: string, value?: number, currency?: string): void {
    this.trackEvent('conversion', {
      conversion_event: event,
      value,
      currency: currency || 'USD',
      page: window.location.pathname
    });
  }

  public trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      page: window.location.pathname
    });
  }

  public trackUserEngagement(element: string, action: string): void {
    this.trackEvent('user_engagement', {
      element,
      action,
      page: window.location.pathname
    });
  }

  private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  public getSessionData(): { sessionId: string; userId: string | null; eventCount: number } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventCount: this.events.length
    };
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  public clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export types for use in components
export type { AnalyticsEvent, PerformanceMetric };

// Hook for React components
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackQuizEvent: analytics.trackQuizEvent.bind(analytics),
    trackLectureEvent: analytics.trackLectureEvent.bind(analytics),
    trackStudyPackEvent: analytics.trackStudyPackEvent.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackUserEngagement: analytics.trackUserEngagement.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics)
  };
}

// Auto-track common events
if (typeof window !== 'undefined') {
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    analytics.trackEvent('page_visibility_change', {
      hidden: document.hidden,
      visibilityState: document.visibilityState
    });
  });

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      analytics.trackEvent('scroll_depth', {
        depth: scrollDepth,
        page: window.location.pathname
      });
    }
  });

  // Track time on page
  const startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Date.now() - startTime;
    analytics.trackEvent('time_on_page', {
      duration: timeOnPage,
      page: window.location.pathname
    });
  });
}
