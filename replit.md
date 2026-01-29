# Reputa Score

## Overview
Reputa Score is a React + TypeScript application designed for the Pi Network, focused on calculating and displaying user reputation scores. It features a futuristic dashboard interface, offering a comprehensive view of a user's on-chain activity and trust level within the Pi ecosystem. The project aims to provide a transparent and engaging platform for Pi Network users to understand and improve their standing.

## User Preferences
I prefer iterative development with a focus on delivering functional, tested components. Please use clear, concise language in all explanations. Before making any significant architectural changes or adding new major dependencies, please ask for confirmation. Ensure all new features are mobile-first, specifically optimized for the Pi Browser environment, and maintain consistency with the dark, futuristic design theme. Do not modify the existing scoring logic in `atomicScoring.ts` unless explicitly instructed, as it is the single source of truth for reputation calculation.

## System Architecture
The application is built with React 18, TypeScript, Vite 6, and Tailwind CSS 4.1. It adopts a mobile-first design philosophy, specifically targeting the Pi Network Browser, with responsive layouts for desktop.

**UI/UX Decisions:**
- **Theme:** Dark, futuristic dashboard with a strong emphasis on glassmorphism and neon glow effects.
- **Color Palette:** Primary background from #0A0B0F to #0F1117, card backgrounds with blurred rgba(30, 33, 40, 0.6), accented with #00D9FF (cyan) and #8B5CF6 (purple). Text is primarily white or light gray.
- **Typography:** Uses Inter, Space Grotesk, and JetBrains Mono fonts for a professional and futuristic aesthetic.
- **Navigation:** Features a bottom navigation bar on mobile and a traditional sidebar on desktop, ensuring touch-friendly targets and safe area insets for notched devices.

**Technical Implementations:**
- **Pi Browser Integration:** Detects the Pi Browser via user agent, falling back to a guest mode for other browsers. Integrates with Pi SDK v2.0 for authentication (username, payments, wallet_address) and uses a gold-themed login button.
- **Atomic Scoring Protocol:** A centralized scoring engine (`src/app/protocol/atomicScoring.ts`) calculates a 7-level trust hierarchy based on various on-chain activities (wallet age, interaction, staking, etc.). This protocol is the single source of truth for reputation scores, deprecating any other scoring logic.
- **Points System:** Users earn points through activities like daily check-ins and ad viewing, persisted via `localStorage` with a legacy migration path. Points contribute to level calculation but are capped at 10,000 for level thresholds.
- **API Architecture:** Serverless functions (Vercel) handle API requests, primarily for the Top 100 Wallets. These APIs implement robust data fetching strategies including auto-refresh, smart caching, circuit breaker patterns, exponential backoff, and rate limiting.
- **Internationalization:** Supports multi-language (EN, AR, FR, ZH) with RTL compatibility.
- **Component Design:** Utilizes MUI and Radix UI components, enhanced with Framer Motion for animations. Key components include `WalletChecker`, `WalletAnalysis`, `TrustGauge`, and `MobileBottomNav`.

**Feature Specifications:**
- **Unified Dashboard:** Combines wallet analysis and analytics into a single interface with tabbed navigation for Overview, Analytics, Transactions, Audit, and Portfolio.
- **Reputation Page:** Dedicated page for detailed score breakdown, trust benefits, and wallet analysis.
- **Network Explorer:** Provides real-time Pi Network data through widgets for circulating supply, locked/unlocked mining, and top wallets.
- **User Profile:** Displays user information, stats, and activity summaries.

## External Dependencies
- **Pi Network SDK:** For user authentication, wallet integration, and on-chain interactions within the Pi Network.
- **PiScan.io Rich List API:** Primary source for top wallet data.
- **Pi Block Explorer API:** Fallback data source for top wallets and real-time network metrics.
- **Vercel:** Deployment platform, utilized for serverless API functions.
- **MUI (Material-UI):** UI component library.
- **Radix UI:** Unstyled component primitives for building accessible design systems.
- **Framer Motion:** For declarative animations in React.