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

## Recent Changes
- January 28, 2026: Updated UI with futuristic dashboard design
- January 28, 2026: Fixed browser compatibility (Guest mode for non-Pi browsers)
- January 28, 2026: Configured for Replit environment (port 5000, host 0.0.0.0, allowed all hosts)
