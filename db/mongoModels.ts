import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
  walletAddress: String,
  pioneerId: String,
  username: String,
  email: String,
  reputationScore: Number,
  walletScore: Number,
  appScore: Number,
  level: Number,
  lastScan: Date,
  createdAt: { type: Date, default: Date.now }
});

const ReputationScoreSchema = new mongoose.Schema({
  pioneerId: { type: String, unique: true, required: true },
  totalReputationScore: { type: Number, default: 0 },
  reputationLevel: { type: Number, default: 1 },
  blockchainScore: { type: Number, default: 0 },
  checkInScore: { type: Number, default: 0 },
  adBonusScore: { type: Number, default: 0 },
  walletAddress: String,
  walletSnapshots: [Object],
  dailyCheckinHistory: [Object],
  scoreEvents: [Object],
  lastCheckInDate: String,
  lastScanTimestamp: Number,
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  protocolVersion: { type: String, default: "3.0" }
});

const DailyCheckinSchema = new mongoose.Schema({
  pioneerId: String,
  date: String,
  points: Number,
  streak: Number,
  timestamp: { type: Date, default: Date.now }
});

const PointsLogSchema = new mongoose.Schema({
  pioneerId: String,
  type: String,
  points: Number,
  timestamp: { type: Date, default: Date.now },
  description: String,
  details: Object
});

export const WalletModel =
  mongoose.models.Wallet ||
  mongoose.model("Wallet", WalletSchema);

export const ReputationScoreModel =
  mongoose.models.ReputationScore ||
  mongoose.model("ReputationScore", ReputationScoreSchema);

export const DailyCheckinModel =
  mongoose.models.DailyCheckin ||
  mongoose.model("DailyCheckin", DailyCheckinSchema);

export const PointsLogModel =
  mongoose.models.PointsLog ||
  mongoose.model("PointsLog", PointsLogSchema);
