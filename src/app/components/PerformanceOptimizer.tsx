"use client";
import { useEffect } from "react";
import { preloadCriticalResources, respectReducedMotion, optimizeScroll } from "../lib/performance";

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Initialize performance optimizations
    preloadCriticalResources();
    respectReducedMotion();
    
    // Set up scroll optimization
    const cleanup = optimizeScroll();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return null; // This component doesn't render anything
}
