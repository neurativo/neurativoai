"use client";
import { usePathname } from 'next/navigation';
import Aurora from './Aurora';

type ConditionalAuroraProps = {
  colorStops?: string[];
  blend?: number;
  amplitude?: number;
  speed?: number;
  time?: number;
};

export default function ConditionalAurora(props: ConditionalAuroraProps) {
  const pathname = usePathname();
  
  // Don't load Aurora on admin pages to avoid WebGL context issues
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <Aurora {...props} />;
}

