# AcuteConnect Promo Video

A [Remotion](https://remotion.dev) project that renders a 20-second 1920×1080 promo video for the AcuteConnect SaaS platform.

## Scenes (30 fps)

| Scene | Duration | Description |
|-------|----------|-------------|
| Intro | 3s | Animated logo + tagline |
| Triage | 4s | Live triage dashboard with client queue |
| Crisis | 3s | Active incident cards + dispatch status |
| Location | 4s | New location deploy wizard walkthrough |
| AI (Jax) | 3s | AI chat panel with clinical note drafting |
| CTA | 3s | Stats + call to action |

## Usage

```bash
# Install (from repo root)
npm install --workspace=apps/promo

# Preview in browser
cd apps/promo
npx remotion studio

# Render MP4
npx remotion render PromoVideo out/promo.mp4 --compositionId=PromoVideo

# Render GIF (social-media friendly)
npx remotion render PromoVideo out/promo.gif --compositionId=PromoVideo
```

## Customising

- **Colors / branding** → `src/constants.ts`
- **Scene timing** → `SCENE_DURATIONS` in `src/constants.ts`
- **Scene content** → `src/scenes/Scene*.tsx`
- **Add a new scene** → create `src/scenes/SceneXxx.tsx`, import in `Root.tsx`, add a `<Series.Sequence>`
