🗑️ **OLD SYSTEMS - OPTIONAL CLEANUP**

════════════════════════════════════════════════════════════════════════════════

**NOTE:** These are optional removals. The new unified system replaces them.

════════════════════════════════════════════════════════════════════════════════

## 📋 FILES THAT CAN BE REMOVED (Optional)

The following old reputation systems are now **replaced by the unified protocol**:

### Old Scoring/Reputation Files
```
src/app/protocol/atomicScoring.ts     ← Replaced by unified service
src/app/protocol/scoring.ts           ← Replaced by unified service
src/app/protocol/scoringRulesEngine.ts ← Replaced by unified service
src/app/protocol/report.ts            ← Replaced by unified service
src/app/services/reputationService.ts ← Replaced by unified service (if exists)
```

### Old Database Files
```
src/app/protocol/imageVerification.ts ← No longer needed
src/db/schema.sql                      ← MongoDB replaces this
```

### Old Report/Component Files (if not using)
```
src/app/components/ReputaReports.tsx   ← If not used
src/app/components/LegacyReputation.tsx ← If not used
```

════════════════════════════════════════════════════════════════════════════════

## ⚠️ BEFORE YOU DELETE

### Check These First

1. **Search for imports:**
   ```bash
   grep -r "atomicScoring" src/
   grep -r "scoringRules" src/
   grep -r "reputationService" src/ | grep -v "unifiedReputationService"
   ```

2. **If imports exist:**
   - Replace with: `useUnifiedReputation` hook
   - Or: `unifiedReputationService` service

3. **Check components:**
   ```bash
   grep -r "atomicScoring\|scoringRules\|oldReputation" src/app/
   ```

4. **Update imports:**
   - Old: `import { calculateScore } from '../protocol/scoring'`
   - New: `import { useUnifiedReputation } from '../hooks/useUnifiedReputation'`

════════════════════════════════════════════════════════════════════════════════

## 🔄 MIGRATION CHECKLIST

Before removing old files:

- [ ] All components use `useUnifiedReputation` hook
- [ ] No imports of old scoring files
- [ ] No direct calls to old reputation functions
- [ ] Tests updated to use new system
- [ ] Dashboard uses new reputation data
- [ ] Leaderboard uses new API endpoint
- [ ] Admin console uses new data
- [ ] All git changes committed

════════════════════════════════════════════════════════════════════════════════

## 🛠️ HOW TO REMOVE SAFELY

### Option 1: Gradual Removal (Safest)
```bash
# Step 1: Just replace imports in code
# Don't delete files yet

# Step 2: Test thoroughly
npm run dev
# Test all reputation features

# Step 3: Once confident, delete
rm src/app/protocol/atomicScoring.ts
rm src/app/protocol/scoring.ts
# etc...
```

### Option 2: All at Once
```bash
# Only do this if you're 100% confident

# Create a new branch first
git checkout -b cleanup/remove-old-systems

# Delete old files
rm src/app/protocol/atomicScoring.ts
rm src/app/protocol/scoring.ts
rm src/app/protocol/scoringRulesEngine.ts
# ... etc

# Test
npm run dev

# Commit
git add -A
git commit -m "chore: remove legacy reputation systems, unified protocol active"
```

════════════════════════════════════════════════════════════════════════════════

## ✨ WHAT'S SAFE TO KEEP

**NEVER DELETE:**
- ✅ src/app/protocol/types.ts (still used)
- ✅ src/app/protocol/TrustProvider.tsx (still used)
- ✅ src/app/protocol/wallet.ts (still used)
- ✅ src/app/protocol/mining.ts (still used)
- ✅ src/app/protocol/staking.ts (still used)
- ✅ src/app/protocol/transactions.ts (still used)
- ✅ src/app/protocol/piPayment.ts (still used)

**SAFE TO DELETE (After Migration):**
- ❌ src/app/protocol/atomicScoring.ts
- ❌ src/app/protocol/scoring.ts
- ❌ src/app/protocol/scoringRulesEngine.ts
- ❌ src/app/protocol/report.ts
- ❌ src/app/protocol/imageVerification.ts

════════════════════════════════════════════════════════════════════════════════

## 🔍 FIND ALL OLD IMPORTS

```bash
# Find all imports of old systems
grep -r "from.*atomicScoring\|from.*scoring\|from.*scoringRules" src/

# Find all function calls
grep -r "calculateAtomicReputation\|calculateScore\|getScoreBreakdown" src/

# Check if any components still use them
grep -r "processScoreBreakdown\|processTrustLevel" src/
```

════════════════════════════════════════════════════════════════════════════════

## 📋 COMPONENTS THAT MIGHT NEED UPDATES

These files might be importing old systems:
```
src/app/pages/UnifiedDashboard.tsx
src/app/pages/ReputationPage.tsx
src/app/pages/ReputaDashboard.tsx
src/app/components/MainCard.tsx
src/app/components/ScoreBreakdownChart.tsx
src/app/components/TrustGauge.tsx
```

**Check Each For:**
```typescript
// OLD - to be replaced
import { calculateAtomicReputation } from '../protocol/atomicScoring';

// NEW - use this instead
import { useUnifiedReputation } from '../hooks/useUnifiedReputation';
```

════════════════════════════════════════════════════════════════════════════════

## ✅ VERIFICATION AFTER CLEANUP

After removing old files:

```bash
# 1. Build should succeed
npm run build

# 2. No import errors
npm run dev
# Check console for any "module not found" errors

# 3. Functionality works
# - Login
# - View reputation
# - Sync wallet
# - Daily check-in
# - View leaderboard

# 4. No broken references
grep -r "atomicScoring\|scoringRules\|oldReputation" src/
# Should return nothing
```

════════════════════════════════════════════════════════════════════════════════

## 🎯 RECOMMENDED APPROACH

1. ✅ Keep new unified system (already working)
2. ✅ Keep utility files (types, wallet, etc)
3. ⚠️ Comment out old imports first (don't delete)
4. ✅ Test everything works
5. ✅ Then safely delete old files
6. ✅ Commit changes

════════════════════════════════════════════════════════════════════════════════

## ⚠️ IF SOMETHING BREAKS

If you delete something and something breaks:

```bash
# 1. Check git history
git log --oneline | head -20

# 2. Restore the file
git restore <filename>

# 3. Find what needed it
grep -r "<deleted-function>" src/

# 4. Update that component to use new system

# 5. Delete again (safely this time)
```

════════════════════════════════════════════════════════════════════════════════

## 📚 IMPORTANT

**The unified system replaces ALL old functionality:**

- ❌ Old: Multiple scattered systems
- ✅ New: Single `useUnifiedReputation` hook

- ❌ Old: calculateAtomicReputation()
- ✅ New: useUnifiedReputation().userReputation

- ❌ Old: Direct file imports
- ✅ New: REST API endpoints

**Everything the old system did, the new system does better.**

════════════════════════════════════════════════════════════════════════════════

## ✨ SUMMARY

You can:
- ✅ Delete old reputation systems
- ✅ Delete old scoring files
- ✅ Keep utility files
- ✅ Keep type definitions

But:
- 🛑 Do it gradually
- 🛑 Test after each deletion
- 🛑 Keep the new unified system
- 🛑 Commit changes to git

════════════════════════════════════════════════════════════════════════════════

**Recommendation: Don't delete anything for now. Just start using the new system.**

Once you're 100% confident everything works, then clean up the old files.

The unified system will work alongside the old one without conflicts. 🎉
