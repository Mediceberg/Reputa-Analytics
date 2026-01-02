# 👨‍💻 Developer Notes - Reputa Score v2.5

## 🎯 Quick Reference for Developers

### Essential Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Check TypeScript errors

# Deployment
vercel                   # Deploy to Vercel
vercel --prod           # Deploy to production
git push                # Auto-deploy (after Vercel setup)
```

---

## 🏗️ Architecture Decisions

### Why Vite instead of Create React App?
- ✅ **Faster**: Native ESM, instant HMR
- ✅ **Smaller**: Better tree-shaking
- ✅ **Modern**: Out-of-box TypeScript, JSX
- ✅ **Flexible**: Easy plugin system

### Why Tailwind CSS v4?
- ✅ **Fast**: JIT compilation
- ✅ **Small**: Purges unused styles
- ✅ **Maintainable**: Utility-first approach
- ✅ **Consistent**: Design system built-in

### Why Shadcn UI instead of Material-UI?
- ✅ **Lightweight**: Copy components, not library
- ✅ **Customizable**: Own the code
- ✅ **Accessible**: Built on Radix UI
- ✅ **Modern**: Tailwind integration

### Why Motion (Framer Motion)?
- ✅ **Powerful**: Physics-based animations
- ✅ **Simple**: Declarative API
- ✅ **Performant**: GPU-accelerated
- ✅ **Production-ready**: Used by major apps

---

## 📁 File Organization Philosophy

### Component Structure
```typescript
// ✅ Good - Single responsibility
function TrustGauge({ score }: TrustGaugeProps) {
  // Only handles gauge display
}

// ❌ Bad - Multiple responsibilities
function TrustGaugeAndReport({ score, transactions, ... }) {
  // Does too much
}
```

### Import Organization
```typescript
// ✅ Good - Grouped and ordered
// 1. External libraries
import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

// 2. Internal components
import { Card } from './ui/card';
import { Button } from './ui/button';

// 3. Types
import type { WalletData } from '../App';

// 4. Assets
import logoImage from '../../assets/logo.svg';

// ❌ Bad - Random order
import logoImage from '../../assets/logo.svg';
import { useState } from 'react';
import { Card } from './ui/card';
```

---

## 🎨 Styling Guidelines

### Tailwind Best Practices

```tsx
// ✅ Good - Responsive, semantic
<div className="p-4 md:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">

// ❌ Bad - Hard-coded sizes, no responsiveness
<div className="p-6 bg-white rounded-lg shadow-md">
```

### Color Usage
```tsx
// ✅ Good - Use color tokens
<div className="bg-purple-600 text-white">

// ❌ Bad - Hard-coded hex
<div style={{ backgroundColor: '#9333ea', color: '#ffffff' }}>
```

### Custom Styles
```tsx
// ✅ Good - When Tailwind isn't enough
<svg style={{ transformOrigin: '100px 80px' }}>

// ❌ Bad - Everything in style prop
<div style={{ padding: '24px', backgroundColor: 'white' }}>
```

---

## 🔧 TypeScript Best Practices

### Type Exports
```typescript
// ✅ Good - Export types for reuse
export interface WalletData {
  address: string;
  balance: number;
  // ...
}

export type TrustLevel = 'Low' | 'Medium' | 'High' | 'Elite';
```

### Props Typing
```typescript
// ✅ Good - Explicit interface
interface TrustGaugeProps {
  score: number;
  trustLevel: TrustLevel;
}

export function TrustGauge({ score, trustLevel }: TrustGaugeProps) {
  // ...
}

// ❌ Bad - Inline types
export function TrustGauge({ score, trustLevel }: { score: number; trustLevel: string }) {
  // ...
}
```

### Type Narrowing
```typescript
// ✅ Good - Type guards
function getColor(level: TrustLevel): string {
  switch (level) {
    case 'Elite': return '#10b981';
    case 'High': return '#3b82f6';
    case 'Medium': return '#eab308';
    case 'Low': return '#ef4444';
  }
}

// ❌ Bad - Any or object indexing
function getColor(level: string): string {
  return colors[level]; // Not type-safe
}
```

---

## 🎯 State Management

### Current Approach: useState
```typescript
// Simple app state in App.tsx
const [walletData, setWalletData] = useState<WalletData | null>(null);
const [hasProAccess, setHasProAccess] = useState(false);
```

### When to Upgrade
**Consider Context API when**:
- Prop drilling > 3 levels
- Multiple components need same state
- State updates frequently

**Consider Redux/Zustand when**:
- Complex state logic
- Many state updates
- Time-travel debugging needed

**Current assessment**: ✅ useState is sufficient

---

## 🧪 Testing Strategy (Future)

### Recommended Setup
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Test Structure
```typescript
// TrustGauge.test.tsx
import { render, screen } from '@testing-library/react';
import { TrustGauge } from './TrustGauge';

describe('TrustGauge', () => {
  it('displays correct score', () => {
    render(<TrustGauge score={750} trustLevel="High" />);
    expect(screen.getByText('750')).toBeInTheDocument();
  });
});
```

---

## 🔄 Adding New Features

### 1. New Component
```bash
# Create file
touch src/app/components/MyComponent.tsx

# Structure
import { ... } from 'react';

interface MyComponentProps {
  // props
}

export function MyComponent({ ... }: MyComponentProps) {
  return (
    // JSX
  );
}
```

### 2. New Asset
```bash
# Add to assets folder
cp new-image.svg src/assets/

# Import in component
import newImage from '../assets/new-image.svg';
```

### 3. New Page/Route
Currently single-page. For multiple pages:
```bash
npm install react-router-dom

# Update App.tsx with router
```

---

## 🐛 Common Issues & Solutions

### Issue: Image not showing after build

**Cause**: Wrong import path or using public URL

**Solution**:
```typescript
// ✅ Correct
import logo from '../assets/logo.svg';
<img src={logo} />

// ❌ Wrong
<img src="/assets/logo.svg" />
<img src="figma:asset/..." />
```

---

### Issue: Tailwind styles not applying

**Cause**: Class not in purge safelist

**Solution**: Check `tailwind.css` includes all content:
```css
@import 'tailwindcss';
```

---

### Issue: TypeScript error in production build

**Cause**: Missing types or any usage

**Solution**:
```bash
npm run type-check
# Fix all errors before building
```

---

### Issue: Build succeeds but app crashes

**Cause**: Runtime error not caught by TypeScript

**Solution**: Check browser console, add error boundary
```typescript
// Already implemented in main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 🚀 Performance Optimization

### Current Optimizations
- ✅ Code splitting (vendor, UI chunks)
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Lazy loading (motion library)

### Future Optimizations
```typescript
// Lazy load heavy components
const AuditReport = lazy(() => import('./components/AuditReport'));

// Memoize expensive calculations
const trustScore = useMemo(() => calculateScore(data), [data]);

// Debounce input
const debouncedValue = useDebounce(address, 300);
```

---

## 🔐 Security Best Practices

### Current Security
- ✅ No backend = no API keys exposed
- ✅ No user data stored
- ✅ No cookies/localStorage (yet)
- ✅ CSP-ready HTML

### If Adding Backend
```typescript
// Never expose API keys in frontend
const apiKey = import.meta.env.VITE_API_KEY; // ❌ Still visible

// Use backend proxy instead
fetch('/api/wallet', { ... }); // ✅ Backend handles auth
```

---

## 📦 Deployment Checklist

### Before Deploy
```bash
# 1. Clean install
rm -rf node_modules dist
npm install

# 2. Type check
npm run type-check

# 3. Build
npm run build

# 4. Test build
npm run preview
# Open http://localhost:4173 and test
```

### Vercel Deployment
```bash
# First time
vercel

# Update
git add .
git commit -m "Update"
git push
# Auto-deploys!
```

---

## 🎨 Design Tokens Reference

### Colors
```css
/* Trust Levels */
Elite:   #10b981 (emerald-500)
High:    #3b82f6 (blue-500)
Medium:  #eab308 (yellow-500)
Low:     #ef4444 (red-500)

/* Brand */
Primary:   #8b5cf6 (purple-600)
Secondary: #3b82f6 (blue-500)
Accent:    #06b6d4 (cyan-500)

/* UI */
Background: #ffffff
Text:       #111827 (gray-900)
Muted:      #6b7280 (gray-500)
Border:     #e5e7eb (gray-200)
```

### Spacing
```
xs:  4px   (0.5 rem)
sm:  8px   (1 rem)
md:  16px  (2 rem)
lg:  24px  (3 rem)
xl:  32px  (4 rem)
2xl: 48px  (6 rem)
```

### Typography
```
xs:   12px / 1.5
sm:   14px / 1.5
base: 16px / 1.5
lg:   18px / 1.5
xl:   20px / 1.5
2xl:  24px / 1.5
```

---

## 🔄 Git Workflow

### Branch Strategy
```bash
main        # Production
develop     # Development
feature/*   # New features
fix/*       # Bug fixes
```

### Commit Messages
```bash
# Format: type(scope): message

feat(wallet): Add transaction filtering
fix(gauge): Correct score animation
docs(readme): Update deployment guide
style(ui): Improve button hover states
refactor(types): Extract common interfaces
```

---

## 📝 Code Comments

### When to Comment
```typescript
// ✅ Good - Explains WHY
// Convert 0-1000 score to 0-100 for gauge rotation
const normalizedScore = score / 10;

// ✅ Good - Complex logic
// Calculate deterministic random based on wallet address
// This ensures same address always gets same mock data
const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

// ❌ Bad - Obvious code
// Set the score
setScore(value);
```

---

## 🎓 Learning Resources

### React
- [React Docs](https://react.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)
- [Vite Config Reference](https://vitejs.dev/config/)

### Tailwind
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

---

## 🆘 Getting Help

### Documentation
1. Check [README.md](./README.md)
2. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

### Debug Steps
1. Check browser console
2. Check Vercel build logs
3. Run `npm run type-check`
4. Clear cache: `rm -rf node_modules dist`
5. Rebuild: `npm install && npm run build`

### Common Commands
```bash
# Fix most issues
rm -rf node_modules dist .vite
npm install
npm run build

# Check logs
vercel logs [deployment-url]

# Redeploy
vercel --prod --force
```

---

## 🎯 Future Roadmap

### Short Term
- [ ] Add real Pi SDK integration
- [ ] Implement actual blockchain data fetching
- [ ] Add more wallet metrics
- [ ] Create PDF export for reports

### Medium Term
- [ ] Multi-language support (Arabic, etc.)
- [ ] Dark mode
- [ ] Historical trend charts
- [ ] Wallet comparison feature

### Long Term
- [ ] Backend API
- [ ] User accounts
- [ ] Saved wallets
- [ ] Real-time updates
- [ ] Mobile app

---

## ✅ Production Checklist

Before going live:

- [ ] Replace mock data with real API
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (Google Analytics / Plausible)
- [ ] Add monitoring (Vercel Analytics)
- [ ] Security audit
- [ ] Performance audit
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Pi Browser testing

---

**Happy Coding!** 🚀

**Maintained by**: Reputa Analytics Team
**Last Updated**: 2024
**Version**: 2.5.0
