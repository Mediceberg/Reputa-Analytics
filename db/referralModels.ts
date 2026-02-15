import mongoose from "mongoose";

// Referral Schema
const ReferralSchema = new mongoose.Schema({
  referrerCode: { type: String, required: true, index: true },
  referrerWallet: { type: String, index: true },
  referredWallet: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  pointsAwarded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  confirmedAt: Date
});

// Referral Claims Schema
const ReferralClaimsSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  totalClaimed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastClaimDate: Date
});

// Add indexes for performance
ReferralSchema.index({ referrerWallet: 1, status: 1 });
ReferralSchema.index({ referredWallet: 1 }, { unique: true });
ReferralSchema.index({ referrerCode: 1 });

export const ReferralModel =
  mongoose.models.Referral ||
  mongoose.model("Referral", ReferralSchema);

export const ReferralClaimsModel =
  mongoose.models.ReferralClaims ||
  mongoose.model("ReferralClaims", ReferralClaimsSchema);
