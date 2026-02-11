import { useEffect, useState } from 'react';
import { reputationService, UnifiedScoreData } from '../services/reputationService';

export interface ReputationEngineData extends UnifiedScoreData {
  Mainnet_Points: number;
  Testnet_Points: number;
  App_Engagement_Points: number;
}

function toEngineData(score: UnifiedScoreData): ReputationEngineData {
  return {
    ...score,
    Mainnet_Points: score.blockchainScore || 0,
    Testnet_Points: 0,
    App_Engagement_Points: score.dailyCheckInPoints || 0,
  };
}

export function useReputationEngine(uid?: string): ReputationEngineData {
  const cached = uid ? reputationService.getCachedUnifiedScore(uid) : reputationService.getUnifiedScore();
  const [engineData, setEngineData] = useState<ReputationEngineData>(toEngineData(cached || reputationService.getUnifiedScore()));

  useEffect(() => {
    const unsubscribe = reputationService.subscribeUnifiedScore((score) => {
      if (!uid || score.uid === uid || !score.uid) {
        setEngineData(toEngineData(score));
      }
    });

    const eventHandler = (event: Event) => {
      const custom = event as CustomEvent<UnifiedScoreData>;
      if (custom.detail && (!uid || custom.detail.uid === uid || !custom.detail.uid)) {
        setEngineData(toEngineData(custom.detail));
      }
    };

    window.addEventListener('reputation:updated', eventHandler as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('reputation:updated', eventHandler as EventListener);
    };
  }, [uid]);

  return engineData;
}
