// @acmvp/ui — shared design system components, styles, and utilities.
// Re-export all components so consumers get a single import point.

export * from './components/UI';
export * from './components/SafeIcon';
// ModernComponents and PWA components are exported by name to avoid conflicts:
export { default as PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
export { default as PWAUpdatePrompt } from './components/pwa/PWAUpdatePrompt';
