import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface LazyRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente para lazy loading de rotas
 * Usa React.lazy + Suspense para code splitting
 */
export function LazyRoute({ children, fallback }: LazyRouteProps) {
  return <Suspense fallback={fallback || <LoadingScreen />}>{children}</Suspense>;
}

/**
 * Hook para criar componente lazy carregado sob demanda
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(importFn);
}

/**
 * Componente wrapper com métricas de performance
 */
interface PerformanceWrapperProps {
  children: ReactNode;
  componentName: string;
}

export function PerformanceWrapper({ children, componentName }: PerformanceWrapperProps) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : 0;

  React.useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${componentName}-render-start`);
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        componentName,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    }
  }, [componentName]);

  return <>{children}</>;
}

/**
 * Hook para medir tempo de render
 */
export function useRenderTimer(componentName: string) {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = typeof performance !== 'undefined' ? performance.now() : 0;
    return () => {
      if (typeof performance !== 'undefined' && startTime.current > 0) {
        const duration = performance.now() - startTime.current;
        if (duration > 16) {
          console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
        }
      }
    };
  }, [componentName]);
}

/**
 * Hook para debounce de valores
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const lastRan = React.useRef<number>(0);

  return React.useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook para intersection observer (lazy loading visual)
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}
