import { useLayoutEffect } from 'react';
import '../styles/product-surfaces.css';

/**
 * Radix surfaces portal into body rather than the page's themed wrapper. Give
 * that host the same palette while an authenticated workspace/editor is mounted.
 * Restore the host on exit so marketing, auth and legal pages keep their theme.
 */
export function useProductSurfaceTheme(theme: 'light' | 'dark') {
  useLayoutEffect(() => {
    const host = document.body;
    const previous = host.getAttribute('data-product-theme');
    host.setAttribute('data-product-theme', theme);
    return () => {
      if (previous === null) host.removeAttribute('data-product-theme');
      else host.setAttribute('data-product-theme', previous);
    };
  }, [theme]);
}
