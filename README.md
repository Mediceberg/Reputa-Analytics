# Reputa Score v2.5 - Pi Network Wallet Reputation Analyzer

🚀 **Production-ready React + Vite application for analyzing Pi Network wallet reputation**

## 📁 Project Structure

```
reputa-analytics/
├── public/                    # Static assets served directly
│   └── favicon.ico           # App favicon
├── src/
│   ├── app/
│   │   ├── App.tsx           # Main application component
│   │   └── components/       # React components
│   │       ├── AccessUpgradeModal.tsx
│   │       ├── AuditReport.tsx
│   │       ├── TransactionList.tsx
│   │       ├── TrustGauge.tsx
│   │       ├── WalletAnalysis.tsx
│   │       ├── WalletChecker.tsx
│   │       └── ui/           # Shadcn UI components
│   ├── assets/               # Images and media files
│   │   └── logo.svg          # Application logo
│   ├── styles/               # Global styles
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   ├── theme.css
│   │   └── fonts.css
│   └── main.tsx              # Application entry point
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🛠️ Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Assets Management

### Logo Setup
1. Place your logo file in `/src/assets/` directory
2. Supported formats: SVG (recommended), PNG, JPG
3. Update import path in components if needed:
   ```typescript
   import logoImage from '../assets/logo.svg';
   ```

### Adding New Images
1. Place images in `/src/assets/` directory
2. Import in component:
   ```typescript
   import myImage from '../assets/my-image.png';
   ```
3. Use in JSX:
   ```tsx
   <img src={myImage} alt="Description" />
   ```

## 🚀 Deployment on Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Your code pushed to GitHub repository

### Step-by-Step Deployment

1. **Prepare Your Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables** (if needed)
   - Add any API keys or environment variables in Vercel dashboard
   - Example: `VITE_API_URL=https://api.example.com`

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Get your live URL: `https://your-project.vercel.app`

### Auto-Deploy on Git Push

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push
```

## 🔧 Configuration Files

### vite.config.ts
Ensure your Vite config is properly set up:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

### vercel.json (Optional)
Create this file for custom Vercel configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## ⚠️ Important Notes

### Case Sensitivity
- Vercel's servers are **case-sensitive**
- Always use consistent casing for file names
- Example: `Logo.svg` vs `logo.svg` - choose one and stick to it

### Path Resolution
- Use relative paths for local assets: `../assets/logo.svg`
- Avoid absolute paths: ❌ `/assets/logo.svg`
- Let Vite handle path resolution: ✅ `import logo from '../assets/logo.svg'`

### Asset Optimization
- Vite automatically optimizes images during build
- SVG files are processed and can be imported directly
- Large images are hashed for cache busting

## 🎯 Features

### Core Features
- ✅ Pi Network wallet address validation
- ✅ Trust score calculation (0-1000 Reputa Score)
- ✅ Transaction history analysis
- ✅ Risk assessment and behavioral analysis
- ✅ Professional audit reports

### Pro Access Features
- 🔐 Advanced trust analytics
- 🔐 AI-powered insights
- 🔐 Detailed risk heatmaps
- 🔐 Full audit reports
- 🔐 Consistency & stability metrics

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Pi Browser (optimized)

## 🐛 Troubleshooting

### Build Errors

**Issue**: `Cannot find module '../assets/logo.svg'`
- **Solution**: Ensure the logo file exists in `/src/assets/`
- Check import path matches file location

**Issue**: `CORS errors on images`
- **Solution**: All assets should be imported via ES modules
- Use `import` statements, not public URLs

**Issue**: `404 on refresh in production`
- **Solution**: Add Vercel rewrites in `vercel.json` (see above)

### Development Issues

**Issue**: Hot reload not working
- **Solution**: Restart dev server: `npm run dev`

**Issue**: Styles not applying
- **Solution**: Check Tailwind CSS is properly configured
- Verify `tailwind.css` is imported in `main.tsx`

## 📄 License

© 2024 Reputa Analytics. All rights reserved.

## 🤝 Support

For issues or questions:
- Create an issue on GitHub
- Contact: support@reputa-analytics.com

---

**Built with ❤️ for the Pi Network Community**
