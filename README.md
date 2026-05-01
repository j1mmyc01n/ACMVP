# Acute Connect - Mental Health Support PWA

Professional mental health support and acute care management platform.

## Features

- ✅ Progressive Web App (PWA) - Install on any device
- ✅ Offline Support - Access cached content without internet
- ✅ Responsive Design - Works on desktop, tablet, and mobile
- ✅ Modern Tech Stack - React, Vite, Tailwind CSS
- ✅ Supabase Integration - Real-time database and authentication

## Quick Start

### Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### PWA Features

This app is a fully-featured Progressive Web App:

- **Installable**: Add to home screen on mobile or install on desktop
- **Offline-first**: Core functionality works without internet
- **Auto-updates**: Service worker automatically updates in the background
- **Fast**: Aggressive caching for optimal performance

For detailed PWA testing instructions, see [PWA_TESTING.md](./PWA_TESTING.md)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate-icons` - Regenerate PWA icons from icon.svg

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **PWA**: vite-plugin-pwa + Workbox
- **Icons**: React Icons
- **Routing**: React Router DOM

## Deployment

The app is configured for deployment on:
- Netlify (see `netlify.toml`)
- Any static hosting with HTTPS support

Service workers require HTTPS in production.