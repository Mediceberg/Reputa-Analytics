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
- January 28, 2026: Implemented Atomic Reputation Protocol with 7-level trust hierarchy
- January 28, 2026: Created atomicScoring.ts engine with 7 scoring categories (wallet age, interaction, Pi Network, Pi Dex, staking, external penalties, suspicious behavior)
- January 28, 2026: Added AtomicScoreBreakdown component with expandable category cards
- January 28, 2026: Integrated atomic scoring with real wallet transaction data
- January 28, 2026: Added time decay for older positive scores (recent activity weighted higher)
- January 28, 2026: Trust levels: Very Low Trust → Low Trust → Medium → Active → Trusted → Pioneer+ → Elite
- January 28, 2026: Fixed Daily Check-in System with proper persistence and demo mode isolation
- January 28, 2026: Fixed Ad bonus gating with per-check-in tokens (prevents calendar-day exploits)
- January 28, 2026: Added 7-day streak bonus (10 points) with proper award logic
- January 28, 2026: Points now persist to localStorage and survive page refresh
- January 28, 2026: Demo mode fully isolated - no localStorage reads/writes for demo users
- January 28, 2026: Added Daily Check-in System with 3 points reward and 24-hour countdown
- January 28, 2026: Added Ad Watch bonus (+5 points) tied to daily check-in
- January 28, 2026: Created PointsExplainer component with level progression and detailed breakdown
- January 28, 2026: Added MiningDaysWidget showing mining activity with info modal
- January 28, 2026: Created dedicated NetworkInfoPage with detailed metrics and supply distribution charts
- January 28, 2026: Created dedicated TopWalletsPage with search, filters, sorting, and professional table view
- January 28, 2026: Created dedicated ReputationPage with score breakdown, trust benefits, and wallet analyzer
- January 28, 2026: Added navigation icons in Pi Network Explorer for each dedicated page
- January 28, 2026: Added Pi Network Explorer section with 3 real-time data widgets
- January 28, 2026: Created NetworkInfoWidget showing circulating supply, locked/unlocked mining, max supply
- January 28, 2026: Created TopWalletsWidget displaying top 100 wallets by balance and activity
- January 28, 2026: Created ReputationWidget showing on-chain verified reputation score
- January 28, 2026: Added piNetworkData.ts service for fetching real blockchain data
- January 28, 2026: Improved PointsBreakdown chart with donut design and side legend
- January 28, 2026: Redesigned TokenPortfolio with circular chart and growth indicator
- January 28, 2026: Enhanced PiDexSection with search, scrollable list for 10+ tokens
- January 28, 2026: Added Network navigation item to sidebar
- January 28, 2026: Integrated official Privacy Policy and Terms of Service content
- January 28, 2026: Added Settings, Feedback, and Help pages with futuristic styling
- January 28, 2026: Added Privacy Policy and Terms of Service sections in Profile
- January 28, 2026: Centered homepage logo with improved layout
- January 28, 2026: PROFESSIONAL REDESIGN - Added Inter, Space Grotesk, JetBrains Mono fonts
- January 28, 2026: Fixed logo background using mix-blend-mode and dark container
- January 28, 2026: Improved header and sidebar with consistent styling
- January 28, 2026: Refined homepage layout with professional typography and spacing
- January 28, 2026: Updated logo to new shield design with cyan neon glow effects
- January 28, 2026: Added Profile page with user info, stats, activity summary
- January 28, 2026: Improved language switcher with dropdown menu and Languages icon
- January 28, 2026: Added Profile navigation item to sidebar
- January 28, 2026: MERGED Wallet Analysis and Analytics Dashboard into single UnifiedDashboard
- January 28, 2026: Added section tabs for navigation: Overview, Analytics, Transactions, Audit, Portfolio
- January 28, 2026: Updated sidebar with new navigation items matching unified page sections
- January 28, 2026: Improved homepage layout with better logo proportions and professional fonts
- January 28, 2026: Updated Analytics Dashboard with futuristic theme (purple/cyan accents, glassmorphism)
- January 28, 2026: Added pioneer profile section with username, wallet address, and score display
- January 28, 2026: Enhanced sidebar with neon accents and futuristic styling
- January 28, 2026: Fixed sidebar navigation ID mismatch and added full i18n support for sidebar labels
- January 28, 2026: Added Analytics Dashboard with Figma-designed charts (TransactionTimeline, PointsBreakdown, RiskActivity, TokenPortfolio)
- January 28, 2026: Created multi-language support system (EN, AR, FR, ZH) with RTL support
- January 28, 2026: Added ScoreBreakdownChart and PiDexSection components
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
