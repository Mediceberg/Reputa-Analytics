-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  wallet_address VARCHAR(255),
  is_vip BOOLEAN DEFAULT FALSE,
  tx_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reputation table
CREATE TABLE IF NOT EXISTS reputation (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  reputation_score DECIMAL(12,2) DEFAULT 0,
  blockchain_score DECIMAL(12,2) DEFAULT 0,
  daily_check_in_points DECIMAL(12,2) DEFAULT 0,
  total_check_in_days INTEGER DEFAULT 0,
  last_check_in TIMESTAMP,
  interaction_history JSONB DEFAULT '[]',
  blockchain_events JSONB DEFAULT '[]',
  wallet_snapshot JSONB,
  last_blockchain_sync TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pioneers table
CREATE TABLE IF NOT EXISTS pioneers (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  wallet VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet states table
CREATE TABLE IF NOT EXISTS wallet_states (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255),
  state_data JSONB NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_reputation_score ON reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_pioneers_username ON pioneers(username);
CREATE INDEX IF NOT EXISTS idx_wallet_states_uid ON wallet_states(uid);
