# Reputa Score

## Overview
Reputa Score is a React + TypeScript application designed for the Pi Network, focused on calculating and displaying user reputation scores. It features a futuristic dashboard interface, offering a comprehensive view of a user's on-chain activity and trust level within the Pi ecosystem. The project aims to provide a transparent and engaging platform for Pi Network users to understand and improve their standing.

## User Preferences
I prefer iterative development with a focus on delivering functional, tested components. Please use clear, concise language in all explanations. Before making any significant architectural changes or adding new major dependencies, please ask for confirmation. Ensure all new features are mobile-first, specifically optimized for the Pi Browser environment, and maintain consistency with the dark, futuristic design theme. Do not modify the existing scoring logic in `atomicScoring.ts` unless explicitly instructed, as it is the single source of truth for reputation calculation.

## Recent Changes (January 2026)
- **API Consolidation:** Reduced API folder from 14+ files to 6 files maximum:
  - `api/auth.ts` - Authentication endpoints
  - `api/payments.ts` - All payment operations (approve, complete, payout, send)
  - `api/wallet.ts` - Wallet data retrieval
  - `api/user.ts` - User data, VIP check, reputation storage, wallet state, point merging
  - `api/admin.ts` - Admin dashboard
  - `api/top100.ts` - Top 100 wallets with pagination and snapshots
- **Real Blockchain Data Integration:** Created `src/app/services/walletDataService.ts` to fetch authentic Pi Network blockchain data (testnet/mainnet)
- **Wallet Snapshot Comparison:** Compares previous vs current wallet state to detect new transactions, contacts, and activity changes
- **Automatic Pi SDK Sync:** Pi Browser login now automatically syncs blockchain data and calculates reputation from real wallet activity
- **Unified Reputation Service:** `src/app/services/reputationService.ts` now integrates blockchain scores with check-in points
- **Separate Check-in Points:** Daily check-in stores points separately from blockchain-derived reputation
- **Weekly Manual Merge:** Users can manually merge their check-in points to reputation (weekly merge feature)
- **Persistent Storage:** User reputation state, wallet snapshots, and blockchain events stored in Redis via API
- **ReputationEvolution Component:** New UI component displaying blockchain reputation, activity history, and wallet stats

## System Architecture
The application is built with React 18, TypeScript, Vite 6, and Tailwind CSS 4.1. It adopts a mobile-first design philosophy, specifically targeting the Pi Network Browser, with responsive layouts for desktop.

### API Structure (Outside src folder)
```
api/
├── auth.ts      # Pi authentication verification
├── payments.ts  # approve, complete, payout, send operations
├── wallet.ts    # Wallet data and transaction history
├── user.ts      # User reputation, VIP status, pioneer data
├── admin.ts     # Admin dashboard (password protected)
└── top100.ts    # Top 100 wallets with caching
```

### Reputation System Architecture
1. **atomicScoring.ts** - The single source of truth for reputation calculation logic
2. **walletDataService.ts** - Fetches real blockchain data from Pi Network API (testnet/mainnet)
3. **reputationService.ts** - Service layer integrating blockchain scores with check-in points
4. **DailyCheckIn.tsx** - UI component for daily check-ins with separate point storage
5. **ReputationEvolution.tsx** - UI component displaying blockchain reputation and activity history
6. **User API** - Backend endpoints for persistent storage (Redis/Upstash)

**Blockchain Data Flow:**
1. User logs in via Pi SDK → `loginWithPiAndLoadReputation()`
2. Wallet address retrieved → `walletDataService.createWalletSnapshot()`
3. Snapshot compared to previous state → New events detected
4. Reputation calculated from real blockchain activity → `calculateAtomicReputation()`
5. State saved to Redis → User sees real-time blockchain reputation

**Points Flow:**
- Blockchain activity (transactions, wallet age, contacts) → Adds to `blockchainScore`
- Daily check-in → Adds to `dailyCheckInPoints` (separate pool)
- Ad bonus → Adds to `dailyCheckInPoints` (separate pool)
- Weekly merge → User manually transfers `dailyCheckInPoints` to total
- Total reputation = `blockchainScore` + merged `dailyCheckInPoints`

**UI/UX Decisions:**
- **Theme:** Dark, futuristic dashboard with a strong emphasis on glassmorphism and neon glow effects.
- **Color Palette (Web3 Minimal):** Primary background #0A0B0F to #0F1117. Main accent: Purple (#8B5CF6). Secondary accent: Cyan (#00D9FF). Minimal use of other colors - only for status indicators (success green, warning orange, error red). Text is white with varying opacity.
- **Typography:** Uses Inter, Space Grotesk, and JetBrains Mono fonts for a professional and futuristic aesthetic.
- **Navigation:** Features a bottom navigation bar on mobile and a traditional sidebar on desktop, ensuring touch-friendly targets and safe area insets for notched devices.

**Technical Implementations:**
- **Pi Browser Integration:** Detects the Pi Browser via user agent, falling back to a guest mode for other browsers. Integrates with Pi SDK v2.0 for authentication (username, payments, wallet_address) and uses a gold-themed login button. Automatically loads user reputation on login.
- **Atomic Scoring Protocol:** A centralized scoring engine (`src/app/protocol/atomicScoring.ts`) calculates a 7-level trust hierarchy based on various on-chain activities (wallet age, interaction, staking, etc.). This protocol is the single source of truth for reputation scores, deprecating any other scoring logic.
- **Separate Points System:** Daily check-in points are now stored separately from the main reputation score. Users can manually merge their accumulated check-in points to their reputation score weekly. This ensures users have control over when their points are applied.
- **API Architecture:** Serverless functions handle API requests with Redis (Upstash) for persistent storage. APIs implement robust data fetching strategies including auto-refresh, smart caching, and rate limiting.
- **Internationalization:** Supports multi-language (EN, AR, FR, ZH) with RTL compatibility.
- **Component Design:** Utilizes MUI and Radix UI components, enhanced with Framer Motion for animations. Key components include `WalletChecker`, `WalletAnalysis`, `TrustGauge`, `DailyCheckIn`, and `MobileBottomNav`.

**Feature Specifications:**
- **Unified Dashboard:** Combines wallet analysis and analytics into a single interface. Each section displays its own header (e.g., "Reputa Score", "Analytics", "Activity") instead of showing "Dashboard" everywhere. Bottom navigation on mobile, tab navigation on desktop.
- **Reputation Page:** Dedicated page for detailed score breakdown, trust benefits, and wallet analysis.
- **Network Explorer:** Provides real-time Pi Network data through widgets for circulating supply, locked/unlocked mining, and top wallets.
- **User Profile:** Displays user information, stats, and activity summaries.
- **Daily Check-in:** Separate component with:
  - 24-hour cooldown between check-ins
  - Streak tracking with 7-day bonus
  - Optional ad watching for bonus points
  - Weekly manual merge to main reputation

## External Dependencies
- **Pi Network SDK:** For user authentication, wallet integration, and on-chain interactions within the Pi Network.
- **PostgreSQL (Replit):** Primary database for persistent storage (users, reputation, pioneers, feedback, wallet states)
- **Redis (Upstash):** For caching and session storage
- **PiScan.io Rich List API:** Primary source for top wallet data.
- **Pi Block Explorer API:** Fallback data source for top wallets and real-time network metrics.
- **Vercel:** Deployment platform, utilized for serverless API functions.
- **MUI (Material-UI):** UI component library.
- **Radix UI:** Unstyled component primitives for building accessible design systems.
- **Framer Motion:** For declarative animations in React.

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `KV_REST_API_URL` - Upstash Redis URL
- `KV_REST_API_TOKEN` - Upstash Redis Token
- `PI_API_KEY` - Pi Network API Key (for payments)
- `PI_NETWORK` - Network mode (testnet/mainnet)

## Database Schema
The PostgreSQL database contains the following tables:
- `users` - User accounts (uid, username, wallet_address, is_vip, tx_count)
- `reputation` - Reputation scores (uid, reputation_score, blockchain_score, daily_check_in_points, etc.)
- `pioneers` - Registered pioneers (username, wallet)
- `feedback` - User feedback (username, text)
- `wallet_states` - Wallet state snapshots (uid, wallet_address, state_data)
