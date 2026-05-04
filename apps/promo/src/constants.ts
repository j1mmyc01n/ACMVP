export const FPS    = 30;
export const WIDTH  = 1920;
export const HEIGHT = 1080;

export const COLORS = {
  purple:  '#7C3AED',
  blue:    '#0284C7',
  red:     '#DC2626',
  green:   '#059669',
  amber:   '#D97706',
  pink:    '#EC4899',
  dark:    '#0F172A',
  darker:  '#060B14',
  surface: '#1E293B',
  border:  '#334155',
  muted:   '#94A3B8',
  white:   '#F8FAFC',
};

export const FONT = "'Inter', 'SF Pro Display', -apple-system, sans-serif";

// Scene durations in frames (at 30 fps)
export const SCENE_DURATIONS = {
  intro:    90,   // 3s  – logo & tag line
  triage:   120,  // 4s  – triage dashboard
  crisis:   90,   // 3s  – crisis management
  location: 120,  // 4s  – location rollout wizard
  ai:       90,   // 3s  – Jax AI
  cta:      90,   // 3s  – call to action
};

export const TOTAL_FRAMES = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);
