# Data Structure & Protocol Documentation

## Database Keys (Structured Tables Logic)

### 1) Users Table
**Key:** `users:{pi_username}`
```json
{
  "pi_username": "string",
  "wallet": "string",
  "network": "mainnet | testnet",
  "createdAt": "timestamp",
  "lastActiveAt": "timestamp",
  "reputationScore": "number",
  "level": "number",
  "trustRank": "string"
}
```

### 2) Wallet Metrics
**Key:** `wallet:{wallet_address}`
```json
{
  "balance": "number",
  "txCount": "number",
  "walletAgeDays": "number",
  "activityScore": "number",
  "lastSyncedAt": "timestamp"
}
```

### 3) Daily Check-in
**Key:** `daily:{pi_username}`
```json
{
  "totalPoints": "number",
  "streak": "number",
  "lastLogin": "timestamp",
  "history": [ { "date": "string", "points": "number" } ]
}
```

### 4) Events / History
**Key:** `events:{pi_username}`
```json
[
  {
    "type": "wallet_scan | daily_login | activity | manual",
    "points": "number",
    "source": "mainnet | testnet",
    "timestamp": "number"
  }
]
```

## Admin Console
Accessible at `/admin-console`. Protected by `ADMIN_PASSWORD`.
Provides read-only access to all structured data above.
