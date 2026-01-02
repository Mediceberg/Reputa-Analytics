# 🏗️ Project Structure - Reputa Score v2.5

## 📂 Complete Directory Tree

```
reputa-score/
│
├── 📄 index.html                    # Entry HTML file
├── 📄 package.json                  # Dependencies and scripts
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 vercel.json                  # Vercel deployment config
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 postcss.config.mjs           # PostCSS configuration
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 public/                      # Static assets (served as-is)
│   ├── favicon.ico                 # Browser favicon
│   ├── apple-touch-icon.png       # iOS icon (optional)
│   └── og-image.png               # Social media preview (optional)
│
├── 📁 src/                         # Source code
│   │
│   ├── 📄 main.tsx                 # Application entry point
│   │
│   ├── 📁 assets/                  # Images and media
│   │   └── logo.svg                # Application logo (SVG)
│   │
│   ├── 📁 app/                     # Application code
│   │   │
│   │   ├── 📄 App.tsx              # Main app component
│   │   │
│   │   └── 📁 components/          # React components
│   │       │
│   │       ├── 📄 AccessUpgradeModal.tsx    # Pro upgrade modal
│   │       ├── 📄 AuditReport.tsx           # Professional audit report
│   │       ├── 📄 TransactionList.tsx       # Transaction history display
│   │       ├── 📄 TrustGauge.tsx            # Trust score gauge
│   │       ├── 📄 VIPModal.tsx              # Legacy VIP modal
│   │       ├── 📄 WalletAnalysis.tsx        # Main analysis view
│   │       ├── 📄 WalletChecker.tsx         # Wallet input form
│   │       │
│   │       ├── 📁 figma/                    # Figma-specific components
│   │       │   └── ImageWithFallback.tsx    # Protected image component
│   │       │
│   │       └── 📁 ui/                       # Shadcn UI components
│   │           ├── accordion.tsx
│   │           ├── alert-dialog.tsx
│   │           ├── alert.tsx
│   │           ├── aspect-ratio.tsx
│   │           ├── avatar.tsx
│   │           ├── badge.tsx
│   │           ├── breadcrumb.tsx
│   │           ├── button.tsx
│   │           ├── calendar.tsx
│   │           ├── card.tsx
│   │           ├── carousel.tsx
│   │           ├── chart.tsx
│   │           ├── checkbox.tsx
│   │           ├── collapsible.tsx
│   │           ├── command.tsx
│   │           ├── context-menu.tsx
│   │           ├── dialog.tsx
│   │           ├── dropdown-menu.tsx
│   │           ├── form.tsx
│   │           ├── hover-card.tsx
│   │           ├── input-otp.tsx
│   │           ├── input.tsx
│   │           ├── label.tsx
│   │           ├── menubar.tsx
│   │           ├── navigation-menu.tsx
│   │           ├── pagination.tsx
│   │           ├── popover.tsx
│   │           ├── progress.tsx
│   │           ├── radio-group.tsx
│   │           ├── scroll-area.tsx
│   │           ├── select.tsx
│   │           ├── separator.tsx
│   │           ├── sheet.tsx
│   │           ├── sidebar.tsx
│   │           ├── skeleton.tsx
│   │           ├── slider.tsx
│   │           ├── sonner.tsx
│   │           ├── switch.tsx
│   │           ├── table.tsx
│   │           ├── tabs.tsx
│   │           ├── textarea.tsx
│   │           ├── toggle-group.tsx
│   │           ├── toggle.tsx
│   │           ├── tooltip.tsx
│   │           ├── use-mobile.ts
│   │           └── utils.ts
│   │
│   └── 📁 styles/                  # Global styles
│       ├── index.css               # Main CSS entry
│       ├── fonts.css               # Font imports
│       ├── tailwind.css            # Tailwind base
│       └── theme.css               # Theme variables
│
└── 📁 documentation/               # Project documentation
    ├── README.md                   # Main documentation
    ├── DEPLOYMENT_GUIDE.md         # Deployment guide (Arabic)
    ├── QUICKSTART.md               # Quick start guide
    ├── CHANGES_SUMMARY.md          # Migration changes
    └── PROJECT_STRUCTURE.md        # This file
```

---

## 🎯 Key Files Explained

### Root Configuration Files

#### `index.html`
- Entry HTML file
- Loads React app via `src/main.tsx`
- Contains meta tags for SEO
- Defines app title and favicon

#### `package.json`
```json
{
  "name": "reputa-score",
  "version": "2.5.0",
  "scripts": {
    "dev": "vite",              // Development server
    "build": "vite build",       // Production build
    "preview": "vite preview"    // Preview build
  }
}
```

#### `vite.config.ts`
- Vite build configuration
- Path aliases
- Build optimizations
- Plugin settings

#### `vercel.json`
- Vercel deployment configuration
- SPA routing rules
- Cache headers
- Build commands

---

### Source Code Structure

#### `/src/main.tsx`
**Purpose**: Application entry point
- Mounts React to DOM
- Imports global styles
- Error boundary wrapper
- React StrictMode

#### `/src/app/App.tsx`
**Purpose**: Main application component
- State management
- Route handling (wallet checker ↔ analysis)
- Modal management
- Mock data generation

**Key Exports**:
```typescript
export interface Transaction { ... }
export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';
export interface WalletData { ... }
export default function App() { ... }
```

---

### Components Hierarchy

```
App.tsx
├── WalletChecker.tsx           (Initial view)
│   └── Features grid
│
├── WalletAnalysis.tsx          (Analysis view)
│   ├── Header with wallet info
│   ├── TrustGauge.tsx          (Trust score display)
│   ├── TransactionList.tsx     (Transaction history)
│   └── AuditReport.tsx         (Detailed analysis)
│       ├── Basic metrics (all users)
│       └── Advanced analytics (Pro users)
│
└── AccessUpgradeModal.tsx      (Upgrade prompt)
    ├── Feature comparison
    └── Payment UI
```

---

### Component Responsibilities

#### `WalletChecker.tsx`
- ✅ Wallet address input
- ✅ Validation (G-prefix, length)
- ✅ Demo button
- ✅ Feature showcase
- ✅ Privacy information

#### `WalletAnalysis.tsx`
- ✅ Display wallet overview
- ✅ Show balance and stats
- ✅ Coordinate sub-components
- ✅ Upgrade button (non-Pro users)

#### `TrustGauge.tsx`
- ✅ Animated gauge (0-1000 scale)
- ✅ Trust level display
- ✅ Color-coded indicators
- ✅ Score breakdown

#### `TransactionList.tsx`
- ✅ Last 10 transactions
- ✅ Send/receive indicators
- ✅ Amount formatting
- ✅ Timestamp display

#### `AuditReport.tsx`
- ✅ Health metrics
- ✅ Risk analysis
- ✅ AI insights (Pro)
- ✅ Advanced analytics (Pro)
- ✅ Upgrade prompt (non-Pro)

#### `AccessUpgradeModal.tsx`
- ✅ Feature comparison table
- ✅ Explorer vs Advanced
- ✅ Pricing display
- ✅ Upgrade CTA

---

### Assets Management

#### `/src/assets/logo.svg`
**Properties**:
- Format: SVG (scalable)
- Size: ~2 KB
- Colors: Gradient (cyan → blue → purple)
- Design: Shield with checkmark

**Usage**:
```typescript
// In App.tsx
import logoImage from '../assets/logo.svg';

// In WalletChecker.tsx
import logoImage from '../../assets/logo.svg';

// In AuditReport.tsx
import logoImage from '../../assets/logo.svg';
```

**To Replace**:
```bash
# Your logo
cp my-logo.svg src/assets/logo.svg
# or
cp my-logo.png src/assets/logo.png
```

---

### Styles Architecture

#### `/src/styles/index.css`
- Main CSS entry point
- Imports all other styles
- Global resets

#### `/src/styles/fonts.css`
- Font imports (Google Fonts, etc.)
- Font-face declarations
- Only add fonts here, not in components

#### `/src/styles/tailwind.css`
- Tailwind base, components, utilities
- Custom Tailwind directives

#### `/src/styles/theme.css`
- CSS variables
- Color tokens
- Typography defaults
- Theme overrides

---

## 🔄 Data Flow

```
User Input (WalletChecker)
    ↓
handleWalletCheck(address)
    ↓
generateMockWalletData(address)
    ↓
setWalletData(mockData)
    ↓
WalletAnalysis Component
    ├→ TrustGauge (score display)
    ├→ TransactionList (history)
    └→ AuditReport (detailed analysis)
        ├→ Basic metrics (all)
        └→ Advanced (Pro only)
```

---

## 🎨 Styling System

### Tailwind CSS v4.0
- Utility-first CSS
- JIT (Just-In-Time) compilation
- Custom theme in `theme.css`

### Color Palette
```css
/* Primary Colors */
--color-cyan: #06b6d4
--color-blue: #3b82f6
--color-purple: #8b5cf6

/* Trust Levels */
--elite: #10b981 (emerald)
--high: #3b82f6 (blue)
--medium: #eab308 (yellow)
--low: #ef4444 (red)
```

### Design Tokens
- Consistent spacing scale
- Typography hierarchy
- Border radius values
- Shadow levels

---

## 🚀 Build Process

### Development
```bash
npm run dev
# → Starts Vite dev server
# → Hot module replacement
# → Port: 3000
```

### Production Build
```bash
npm run build
# → TypeScript compilation
# → Vite bundling
# → Asset optimization
# → Output: dist/
```

### Build Output
```
dist/
├── index.html                      # Entry HTML
├── assets/
│   ├── index-[hash].js            # Main bundle
│   ├── vendor-[hash].js           # React, React-DOM
│   ├── ui-[hash].js               # UI libraries
│   ├── index-[hash].css           # Compiled CSS
│   └── logo-[hash].svg            # Optimized logo
└── favicon.ico                     # Copied from public
```

---

## 📦 Dependencies Overview

### Core
- `react` ^18.3.1 - UI library
- `react-dom` ^18.3.1 - React DOM renderer
- `typescript` - Type safety

### Build Tools
- `vite` ^6.3.5 - Build tool
- `@vitejs/plugin-react` - React plugin
- `tailwindcss` ^4.1.12 - CSS framework

### UI Components
- `@radix-ui/*` - Headless UI primitives
- `lucide-react` - Icon library
- `motion` - Animations (Framer Motion)

### Utilities
- `class-variance-authority` - Component variants
- `clsx` - Class name utility
- `tailwind-merge` - Merge Tailwind classes

---

## 🔒 Protected Files

**Do NOT modify**:
- `/src/app/components/figma/ImageWithFallback.tsx`

**Reason**: System component managed by Figma Make

---

## 📝 Type Definitions

### Main Types (`/src/app/App.tsx`)

```typescript
// Transaction record
export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  memo?: string;
}

// Trust level classification
export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';

// Complete wallet data
export interface WalletData {
  address: string;
  balance: number;
  accountAge: number;
  transactions: Transaction[];
  totalTransactions: number;
  reputaScore: number; // 0-1000
  trustLevel: TrustLevel;
  consistencyScore: number; // 0-100
  networkTrust: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
}
```

---

## 🎯 Environment Variables

Currently using **zero environment variables** (fully frontend).

**Future additions** (if backend needed):
```bash
# .env.local
VITE_API_URL=https://api.example.com
VITE_PI_SDK_KEY=your_pi_sdk_key
```

**Usage**:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 📊 Performance Targets

### Load Time
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- First Input Delay: < 100ms

### Bundle Size
- Main bundle: ~250 KB (gzipped ~80 KB)
- Vendor bundle: ~180 KB (gzipped ~60 KB)
- UI bundle: ~70 KB (gzipped ~25 KB)

### Lighthouse Scores (Target)
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

---

## 🔍 Code Quality

### TypeScript
- Strict mode enabled
- No implicit any
- Proper type exports

### React
- Functional components
- Hooks best practices
- No prop drilling
- Error boundaries

### CSS
- Utility-first approach
- No style conflicts
- Responsive by default
- Dark mode ready

---

## 🌐 Browser Compatibility

### Supported
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Pi Browser (latest)

### Features Used
- ES2020 syntax
- CSS Grid & Flexbox
- SVG animations
- CSS Variables

---

## 📚 Related Documentation

- [README.md](../README.md) - Complete project overview
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Deployment instructions (Arabic)
- [QUICKSTART.md](../QUICKSTART.md) - Quick start guide
- [CHANGES_SUMMARY.md](../CHANGES_SUMMARY.md) - Migration changes

---

## ✅ Pre-Deploy Checklist

- [ ] Logo exists: `src/assets/logo.svg`
- [ ] Dependencies installed: `npm install`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] All components render
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Works in Pi Browser

---

**Project Status**: ✅ Production Ready

**Last Updated**: 2024
**Version**: 2.5.0
