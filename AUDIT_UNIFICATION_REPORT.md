# Comprehensive Audit & Unification Report

## 1) Inventory: Critical Integration Points

### MongoDB Integration (primary persistence)
- `api/server.app.ts`: unified API routes and Mongo-backed reputation endpoints.
- `api/server.ts`: bootstrap entrypoint (startup only).
- `server/db/mongoModels.ts`: canonical MongoDB connection + schema/index setup for users/reputation/check-ins/points logs/wallet snapshots.
- `server/services/reputationService.ts`: reputation logic built around MongoDB as source of truth with cache helper.
- `src/db/mongodb.ts`: frontend/service-side Mongo integration utilities.

### Upstash / Redis Integration (caching + fast leaderboard access)
- `api/server.app.ts` + `api/server.redis.ts`: shared redis client used by admin/user endpoints and leaderboard cache.
- `api/server.redis.ts`: isolated Redis factory wrapper.
- `server/services/reputationService.ts`: Redis cache layer (`reputa:score:*`) above MongoDB.

### Pi Network / Pi SDK invocation points
- `src/app/services/piSdk.ts`, `src/services/piSdkAdvanced.ts`: browser-side Pi SDK bootstrap and auth.
- `src/app/services/piPayments.ts`: Pi payment flows from app.
- `api/server.app.ts`: server-side Pi payment approval/completion + Horizon submission via Stellar SDK.

## 2) Conflict/Blocker Scan

### Merge conflict markers
- No code-level git merge conflict markers found in executable source files.
- Decorative separators (`====`) exist in markdown docs only and do not block runtime.

### Runtime blockers detected
- `api/server.app.ts` had legacy reputation paths writing only to Redis for `/api/user?action=getReputation|saveReputation`, which diverges from v3 Mongo-first architecture.
- Admin endpoint `/api/admin` used hardcoded password query (`admin123`) for non-POST operations, causing frequent `401 Unauthorized` when clients send Bearer token only.

## 3) Duplication/Drift Observations

### Notable duplicated or overlapping modules
- API bootstrap unification applied: `api/server.ts` now entry-only and `api/server.app.ts` owns route definitions.
- Protocol/reputation logic spread across:
  - `server/services/reputationService.ts` (Mongo-first)
  - inline legacy handlers in `api/server.app.ts` (Redis-first before this patch)
- Protocol naming drift: `src/app/protocol/futureTasks.ts` and `src/app/protocol/futurtask.ts` (alias export)

## 4) Unification Work Applied

### MongoDB + Upstash smart integration
- Upgraded legacy `/api/user` reputation flow in `api/server.app.ts`:
  - **MongoDB as source of truth** (save/load via `ReputationScores` collection with legacy mapping).
  - **Upstash as cache layer** with TTL (`REPUTATION_CACHE_TTL_SECONDS`, default 300s).
  - Cache-hit/cached source indicators added to responses.
- Added legacy-to-Mongo and Mongo-to-legacy mappers so old client contracts remain stable while backend storage is unified.

### 401 Unauthorized fix (admin)
- `/api/admin` now supports:
  - `password` query param (legacy)
  - `Authorization: Bearer <ADMIN_PASSWORD>` token
- Admin password moved to `ADMIN_PASSWORD` env var (fallback remains `admin123` for backward compatibility).

### Environment compatibility
- Redis config now accepts both Vercel KV and native Upstash env naming:
  - `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

## 5) Recommended Next Cleanup (phase-2)
1. Move remaining legacy Redis-only user/admin routes into service layer wrappers.
2. Finalize one protocol entrypoint (`server/services/reputationService.ts`) and deprecate duplicated scoring utilities.
3. Add integration tests for: Mongo write-through + cache read + fallback behavior.
