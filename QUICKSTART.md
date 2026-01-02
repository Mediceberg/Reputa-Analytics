# ⚡ Quick Start Guide - Reputa Score v2.5

## 🎯 Ready to Deploy in 5 Minutes!

### Step 1: Verify Your Setup ✅

```bash
# Check if logo exists
ls src/assets/logo.svg

# Install dependencies
npm install

# Test locally
npm run dev
```

Open browser: `http://localhost:3000`

---

### Step 2: Build for Production 🔨

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

If build succeeds → You're ready! ✅

---

### Step 3: Deploy to Vercel 🚀

#### Option A: GitHub + Vercel (Recommended)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# 2. Go to vercel.com
# 3. Click "New Project"
# 4. Import your GitHub repo
# 5. Click "Deploy"

# Done! 🎉
```

#### Option B: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 📝 File Checklist

- ✅ `/src/assets/logo.svg` - Logo file
- ✅ `/src/app/App.tsx` - Main app (updated paths)
- ✅ `/src/app/components/` - All components (updated paths)
- ✅ `/vercel.json` - Vercel config
- ✅ `/vite.config.ts` - Build config
- ✅ `/package.json` - Dependencies

---

## 🎨 Customize Logo

Replace `/src/assets/logo.svg` with your logo:

```bash
# Supported formats
cp your-logo.svg src/assets/logo.svg
# or
cp your-logo.png src/assets/logo.png
```

If you change filename, update imports in:
- `src/app/App.tsx`
- `src/app/components/WalletChecker.tsx`
- `src/app/components/AuditReport.tsx`

---

## 🐛 Troubleshooting

### Build Fails?
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Logo Not Showing?
- Check file exists: `ls src/assets/logo.svg`
- Check import path: `import logoImage from '../assets/logo.svg'`

### 404 on Refresh?
- ✅ Already fixed in `vercel.json`

---

## 📚 Full Documentation

- 📖 [README.md](./README.md) - Complete documentation
- 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment guide (Arabic)

---

## 🎉 That's It!

Your app is production-ready and deployable to Vercel!

**Live in 5 minutes** ⚡

---

## 🔗 Useful Links

- [Vite Docs](https://vitejs.dev/)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Questions?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed help.
