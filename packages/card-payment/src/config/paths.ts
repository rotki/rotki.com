/**
 * Shared path configuration for the card payment application
 * Single source of truth for all URL and path constants
 */

// Single constant that can be changed to update the app's base path everywhere
export const APP_BASE_PATH = '/checkout/pay/card';

export const paths = {
  /**
   * App base URL including the subpath (e.g., https://rotki.com/checkout/pay/card)
   * This is where the card payment SPA is mounted
   */
  get appUrlBase(): string {
    return `${this.hostUrlBase}${APP_BASE_PATH}`;
  },

  /**
   * Runtime detected host URL (e.g., https://rotki.com or http://localhost:3000)
   * This is the base URL for the main website
   */
  hostUrlBase: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://rotki.com',
};

/**
 * Asset path helpers for different resource types
 */
export const assetPaths = {
  /**
   * Card payment app assets (e.g., app-specific favicons, images)
   * Example: ./favicon.ico (relative to app base)
   */
  appAsset: (path: string): string => `./${path.replace(/^\//, '')}`,

  /**
   * Main site assets (e.g., OG images, main site favicons)
   * Example: /img/og/share.png
   */
  hostAsset: (path: string): string => `${paths.hostUrlBase}${path}`,
};
