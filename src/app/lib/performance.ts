// Performance optimization utilities

export const optimizeImages = {
  // Image optimization settings
  quality: 75,
  format: 'webp' as const,
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority: false,
};

export const lazyLoadThreshold = 0.1;

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function executedFunction(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preload critical icons
    const iconLink = document.createElement('link');
    iconLink.rel = 'preload';
    iconLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    iconLink.as = 'style';
    document.head.appendChild(iconLink);
  }
};

// Optimize scroll performance
export const optimizeScroll = () => {
  if (typeof window !== 'undefined') {
    let ticking = false;
    
    const updateScrollPosition = () => {
      // Add any scroll-based optimizations here
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', requestTick);
    };
  }
};

// Reduce motion for users who prefer it
export const respectReducedMotion = () => {
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--animation-iteration-count', '1');
    }
  }
};
