# 🎯 Quick Start Guide - Referral System | دليل البدء السريع - نظام الإحالات

## ⚡ 5-Minute Setup

### For Developers

✅ **Already Integrated!** The referral system is fully built and ready to use.

#### Key Files:
- 📍 **Database Schema**: `src/db/mongodb.ts` (Users & Referrals collections)
- 📍 **API Routes**: `api/referral.ts` (5 endpoints)
- 📍 **React Hook**: `src/app/hooks/useReferral.ts`
- 📍 **UI Component**: `src/app/components/ReferralSection.tsx`
- 📍 **Business Logic**: `src/app/services/referralService.ts`
- 📍 **Integration**: `src/app/App.tsx` (automatic initialization)

#### No Setup Required!
- Database collections created automatically on first run
- API endpoints ready immediately
- Component displays in Profile page automatically
- Event listeners set up on login

---

## 👥 For End Users

### 1️⃣ Get Your Referral Code

1. Login to your account
2. Navigate to your **Profile**
3. Look for **"Referral Program"** section
4. Your unique **Referral Code** is displayed

```
Example: ABC123F
```

### 2️⃣ Share Your Code

**Option A: Copy Link**
- Click the copy button (📋) next to your code
- Share the link: `https://reputa-score.vercel.app/?ref=ABC123F`

**Option B: Native Share**
- Click the share button (📤)
- Choose how to share (WhatsApp, Email, Telegram, etc.)

### 3️⃣ Monitor Your Referrals

In your **Profile > Referral Program** section, you'll see:

| Metric | Meaning |
|--------|---------|
| 🟢 **Confirmed** | Users who completed wallet analysis |
| 🟡 **Pending** | Users who joined but haven't finished setup |
| 💜 **Total Earned** | All points from confirmed referrals |
| 🔵 **Claimable** | Points ready to claim now |

### 4️⃣ Claim Your Points

When you have claimable points:
1. Click the **"Claim [X] Points"** button
2. Points will be added to your balance
3. Done! ✅

---

## 📊 The Numbers

| Item | Value |
|------|-------|
| Points per referral | **30 PTS** |
| Minimum to claim | **1 referral** |
| Referral expiry | **Never** |
| Claim limit | **Unlimited** |

---

## 🚀 Example Journey

### Day 1: You Sign Up
```
✅ You get a unique referral code: "PIONEER"
✅ You share: https://app.com/?ref=PIONEER
```

### Day 2: Friend Signs Up
```
Friend uses: https://app.com/?ref=PIONEER
Friend's account is linked to you
Status: PENDING
```

### Day 3: Friend Completes Analysis
```
Friend: "Just connected my wallet!"
You get notified: "Referral confirmed!"
Status: CONFIRMED ✅
You gain: 30 claimable points
```

### Day 4: You Claim Points
```
You: Click "Claim 30 Points"
✨ 30 points added to your balance!
Status: CLAIMED ✅
```

---

## ❓ FAQ

### Q: Can I change my referral code?
**A:** No, your code is permanent and unique to your wallet.

### Q: What if my friend doesn't complete the analysis?
**A:** They stay in PENDING status. You still get paid once they analyze their wallet.

### Q: Can I refer myself?
**A:** No, the system prevents self-referral.

### Q: What if someone uses my code twice?
**A:** The second referral is rejected. Each wallet can only be referred once.

### Q: Do points expire?
**A:** No! Your points never expire and can be claimed anytime.

### Q: In which wallet do points get credited?
**A:** Points are stored in your Reputa Score account, not on blockchain.

---

## 🔒 Security

Your referral system is protected with multiple security layers:

✅ **Self-Referral Prevention** - Can't refer yourself  
✅ **Duplicate Prevention** - One referral per wallet  
✅ **One-Time Claim** - Can't claim same referral twice  
✅ **Verified Points** - Only from completed wallet analyses  

---

## 🎮 Demo Mode

To test the system:

1. Login with Demo wallet
2. Share your referral code
3. Create a test account with the code
4. Complete wallet analysis
5. Watch your points appear!

---

## 📱 Mobile Friendly

The referral system works perfectly on:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ iOS & Android
- ✅ Tablet devices

---

## 🚨 Troubleshooting

### Issue: "Invalid referral code"
**Solution**: Make sure the code is correct (case-insensitive)

### Issue: "Cannot refer yourself"
**Solution**: You're using your own code. Share it with others instead!

### Issue: "Cannot claim - no points available"
**Solution**: Your referral status must be "CONFIRMED". The referred user must complete wallet analysis first.

### Issue: "This wallet already has a referrer"
**Solution**: Each wallet can only be referred once. You cannot change referrers.

---

## 💡 Pro Tips

1. **Share Early**: Share your code right after joining for more conversions
2. **Use Social Media**: Share on Twitter, Discord, etc. for maximum reach
3. **Track Progress**: Check your profile regularly to see pending confirmations
4. **Claim Regularly**: Don't forget to claim your points!
5. **Refer Quality Friends**: They're more likely to stay and upgrade

---

## 📞 Support

Having issues?

- 📧 Email: `reputa.score@gmail.com`
- 💬 Discord: [Link to server]
- 🐦 Twitter: `@ReputaScore`

---

## 🎁 Current Referral Campaign

**Earn up to 10,000 PTS!**
- Refer 1 user: 30 PTS
- Refer 5 users: 150 PTS
- Refer 10 users: 300 PTS
- Refer 50 users: 1,500 PTS+

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: ✅ Live
