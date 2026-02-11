export interface ReputationAtomicInput {
  Mainnet_Points: number;
  Testnet_Points: number;
  App_Engagement_Points: number;
}

export interface ReputationAtomicResult {
  Mainnet_Points: number;
  Testnet_Points: number;
  App_Engagement_Points: number;
  totalScore: number;
}

const SCORE_CAP = 100000;

function sanitize(points: number): number {
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.round(points));
}

export function calculateReputationAtomic(input: ReputationAtomicInput): ReputationAtomicResult {
  const Mainnet_Points = sanitize(input.Mainnet_Points);
  const Testnet_Points = sanitize(input.Testnet_Points);
  const App_Engagement_Points = sanitize(input.App_Engagement_Points);

  const totalScore = Math.min(
    SCORE_CAP,
    Mainnet_Points + Testnet_Points + App_Engagement_Points,
  );

  return {
    Mainnet_Points,
    Testnet_Points,
    App_Engagement_Points,
    totalScore,
  };
}

export function getReputationAtomicScoreCap(): number {
  return SCORE_CAP;
}
