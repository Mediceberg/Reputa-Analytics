# Reputa Score

## Overview
A React + TypeScript application built with Vite and Tailwind CSS v4. This is a Pi Network application that calculates reputation scores with a futuristic dashboard design.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 6
- **Styling**: Tailwind CSS 4.1, MUI, Radix UI components
- **Build Tool**: Vite with React plugin
- **Package Manager**: npm
- **Animations**: Motion (Framer Motion)

## Project Structure
```
├── src/
│   ├── app/
│   │   ├── components/    # UI components (WalletChecker, WalletAnalysis, TrustGauge, etc.)
│   │   ├── protocol/      # Business logic and types
│   │   ├── services/      # Pi SDK integration
│   │   ├── config/        # Configuration
│   │   └── pages/         # Page components
│   ├── assets/            # Static assets (logo.png)
│   ├── styles/            # CSS styles
│   └── main.tsx           # Entry point
├── public/                # Public static files
├── api/                   # API routes (Vercel serverless functions)
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies
```

## Development
- Server runs on port 5000
- Run with `npm run dev`
- Guest mode enabled for non-Pi Browser environments

## Deployment
- Static deployment with build command: `npm run build`
- Output directory: `dist`
- Compatible with Vercel

## Pi Browser Integration
- The app detects Pi Browser via user agent
- Falls back to Guest mode in regular browsers
- SDK initialization has 5-second timeout fallback

## Design System
- **Theme**: Dark futuristic dashboard with glassmorphism
- **Color Palette**:
  - Primary BG: #0A0B0F to #0F1117
  - Card BG: rgba(30, 33, 40, 0.6) with blur
  - Accent Cyan: #00D9FF
  - Accent Purple: #8B5CF6
  - Text Primary: rgba(255, 255, 255, 0.95)
  - Text Secondary: rgba(160, 164, 184, 0.8)
- **Effects**: Neon glow, glassmorphism blur, gradient borders, grid pattern background

## Recent Changes
- January 28, 2026: GLOBAL FUTURISTIC DASHBOARD DESIGN - Applied across all screens and components
- January 28, 2026: Updated WalletAnalysis with dark theme, neon accents, gradient borders
- January 28, 2026: Redesigned TrustGauge with animated SVG gauge and neon glow effects
- January 28, 2026: Applied glassmorphism to TransactionList with color-coded transactions
- January 28, 2026: Updated AuditReport with futuristic dark theme and VIP analytics section
- January 28, 2026: Redesigned ReputaDashboard modal with dark backdrop and neon styling
- January 28, 2026: Updated VIPModal and AccessUpgradeModal with dark theme
- January 28, 2026: Added PiUser type to protocol/types.ts
- January 28, 2026: RADICAL UI RESTRUCTURE - Dark futuristic dashboard theme
- January 28, 2026: Added glassmorphism cards and neon glow effects
- January 28, 2026: Created futuristic.css with comprehensive dark theme styles
- January 28, 2026: Updated header with glowing logo and neon text effects
- January 28, 2026: Fixed browser compatibility (Guest mode for non-Pi browsers)
- January 28, 2026: Configured for Replit environment (port 5000, host 0.0.0.0, allowed all hosts)
