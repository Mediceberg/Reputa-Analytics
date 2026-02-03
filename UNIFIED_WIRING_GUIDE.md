/**
 * UNIFIED REPUTATION PROTOCOL - COMPLETE WIRING GUIDE
 * 
 * This file shows exactly how to integrate everything together
 */

// ============================================
// STEP 1: Server Setup (server/api-server.ts)
// ============================================

import express from 'express';
import unifiedReputationRoutes from '../api/unifiedReputationRoutes';

const app = express();

// Add the unified reputation API routes
app.use('/api', unifiedReputationRoutes);

// Your other routes...
app.listen(3000, () => {
  console.log('✅ Server running with Unified Reputation Protocol');
});

// ============================================
// STEP 2: Login Integration (src/app/App.tsx)
// ============================================

import { initializeUnifiedReputationOnLogin } from './services/reputationInitializer';

function App() {
  const handleLogin = async (user: PiUser) => {
    // ... existing login logic ...
    
    // Initialize unified reputation system
    try {
      const reputationState = await initializeUnifiedReputationOnLogin(
        user.uid,                    // Pioneer ID
        user.wallet_address || '',   // Wallet address
        user.username                // Username
      );
      
      console.log('✅ User reputation initialized:', reputationState);
      // User is now ready to use the reputation system!
    } catch (error) {
      console.error('Failed to initialize reputation:', error);
      // Handle error but allow user to continue
    }
  };

  return (
    // ... your app JSX ...
  );
}

// ============================================
// STEP 3: Dashboard Integration
// ============================================

import { useUnifiedReputation } from './hooks/useUnifiedReputation';

interface DashboardProps {
  pioneerId: string;
}

function Dashboard({ pioneerId }: DashboardProps) {
  const {
    userReputation,
    isLoading,
    error,
    syncReputation,
    recordDailyCheckin,
    addReferral,
    recordTaskCompletion
  } = useUnifiedReputation(pioneerId);

  // Display reputation
  if (isLoading) return <div>Loading reputation...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Display User Reputation */}
      <h1>{userReputation?.username}</h1>
      <p>Score: {userReputation?.totalReputationScore.toLocaleString()}</p>
      <p>Level: {userReputation?.level}</p>
      <p>Trust Rank: {userReputation?.trustRank}</p>
      
      {/* Sync wallet button */}
      <button onClick={() => syncReputation(walletData)}>
        Sync Wallet
      </button>

      {/* Daily check-in button */}
      <button onClick={() => recordDailyCheckin()}>
        Daily Check-in
      </button>
    </div>
  );
}

// ============================================
// STEP 4: Share Card Integration
// ============================================

import { ShareReputaCard } from './components/ShareReputaCard';

function ProfilePage() {
  const [showShare, setShowShare] = useState(false);
  const { userReputation } = useUnifiedReputation(pioneerId);

  return (
    <div>
      <button onClick={() => setShowShare(true)}>Share Score</button>

      {showShare && (
        <ShareReputaCard
          username={userReputation?.username || ''}
          score={userReputation?.totalReputationScore || 0}
          level={userReputation?.level_numeric || 1}
          trustRank={userReputation?.trustRank || 'Unknown'}
          walletAddress={userReputation?.walletAddress}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

// ============================================
// STEP 5: VIP Modal Integration
// ============================================

import { VIPModal } from './components/VIPModal';

function PaymentPage() {
  const [showVip, setShowVip] = useState(false);

  return (
    <div>
      <button onClick={() => setShowVip(true)}>Upgrade to VIP</button>

      <VIPModal
        isOpen={showVip}
        onClose={() => setShowVip(false)}
        onPurchase={() => {
          // Handle successful purchase
          console.log('VIP purchased!');
          setShowVip(false);
        }}
        uid={currentUser?.uid}
      />
    </div>
  );
}

// ============================================
// STEP 6: Leaderboard Integration
// ============================================

import { unifiedReputationService } from './services/unifiedReputationService';

async function LoadLeaderboard() {
  const topUsers = await unifiedReputationService.getLeaderboard(100);
  
  return (
    <div>
      {topUsers.map((user, rank) => (
        <div key={user.pioneerId}>
          <span>#{rank + 1}</span>
          <span>{user.username}</span>
          <span>{user.totalReputationScore.toLocaleString()} pts</span>
          <span>{user.level}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// STEP 7: MongoDB Collections Created
// ============================================

/*
These collections are automatically created by the API routes:

1. Users
   - pioneerId (unique)
   - username
   - walletAddress
   - totalPoints
   - reputationScore (0-100000)
   - mainnetScore
   - testnetScore
   - appPoints
   - level (Bronze/Silver/Gold/Platinum/Diamond)
   - level_numeric (1-5)
   - trustRank
   - isVIP
   - dailyCheckinStreak
   - referralCount
   - completedTasks
   - pointsBreakdown (object with all components)
   - createdAt, updatedAt

2. Points_Log
   - pioneerId
   - action (sync, login, referral, task, etc.)
   - points
   - timestamp
   - details (object)

3. Daily_Checkin
   - pioneerId
   - date
   - checkedIn
   - earnedPoints
   - streak
   - timestamp

4. Referrals
   - referrerId
   - referredId
   - confirmed
   - earnedPoints
   - createdAt

5. (And 4 more for complete system...)
*/

// ============================================
// ENVIRONMENT VARIABLES NEEDED
// ============================================

/*
.env file should contain:

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=reputa-analytics
PI_API_KEY=your_pi_api_key
PI_MAINNET_API=https://api.mainnet.pi
PI_TESTNET_API=https://api.testnet.pi
*/

// ============================================
// TESTING THE INTEGRATION
// ============================================

/*
1. Login User:
   - Opens app in Pi Browser
   - Logs in with Pi ID
   - App calls initializeUnifiedReputationOnLogin()
   - User record created in MongoDB
   - App shows reputation dashboard

2. Test Wallet Sync:
   - Navigate to dashboard
   - Provides wallet data
   - Click "Sync Wallet"
   - API calculates scores
   - MongoDB updated
   - UI shows new score

3. Test Daily Check-in:
   - Click "Daily Check-in"
   - Adds 30 points
   - Increments streak
   - Updates Daily_Checkin collection

4. Test Referral:
   - User A refers User B
   - Call addReferral()
   - User A gets 100 points
   - Referrals collection updated

5. Test Leaderboard:
   - API endpoint: GET /api/reputation/leaderboard
   - Returns top 100 users by score
   - Update in real-time
*/

// ============================================
// API ENDPOINTS REFERENCE
// ============================================

/*
POST /api/reputation/init
- Body: { pioneerId, walletAddress, username }
- Response: UserReputationState

GET /api/reputation/:pioneerId
- Response: UserReputationState

POST /api/reputation/sync
- Body: { pioneerId, walletData }
- Response: Updated UserReputationState

POST /api/reputation/daily-checkin
- Body: { pioneerId }
- Response: { earnedPoints, newStreak, user }

POST /api/reputation/referral
- Body: { pioneerId, referredPioneerId }
- Response: Updated UserReputationState

POST /api/reputation/task-complete
- Body: { pioneerId, taskId, points }
- Response: Updated UserReputationState

GET /api/reputation/leaderboard?limit=100&network=all
- Response: Array of top users
*/

// ============================================
// QUICK START CHECKLIST
// ============================================

// [ ] 1. Copy api/unifiedReputationRoutes.ts to your project
// [ ] 2. Add to server: app.use('/api', unifiedReputationRoutes);
// [ ] 3. Set MongoDB env variables
// [ ] 4. Import initializeUnifiedReputationOnLogin in App.tsx
// [ ] 5. Call it on successful login
// [ ] 6. Use useUnifiedReputation hook in components
// [ ] 7. Test all endpoints
// [ ] 8. Deploy to production

export const UNIFIED_PROTOCOL_READY = true;
