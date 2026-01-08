/**
 * useMediaQuery Hook
 * 
 * Hook for detecting media query matches
 * All custom code is proprietary and not open source.
 */

import { useState, useEffect } from 'react';

/**
 * Hook for detecting media query matches
 * 
 * This hook monitors a media query and returns whether it currently matches.
 * It automatically updates when the media query match status changes (e.g., when
 * the window is resized).
 * 
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * ```tsx
 * // Detect mobile devices (< 768px)
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * 
 * // Detect tablet devices (768px - 1023px)
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 * 
 * // Detect desktop devices (≥ 1024px)
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * 
 * // Use in component
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {isMobile ? <MobileView /> : <DesktopView />}
 *   </div>
 * );
 * ```
 * 
 * @remarks
 * - Supports both modern browsers (addEventListener) and legacy browsers (addListener)
 * - Returns `false` during SSR or if `window` is undefined
 * - Automatically updates when the media query match status changes
 * - The hook will re-run if the query string changes
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 使用 addEventListener 支持现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 降级支持旧浏览器
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

