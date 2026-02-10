codex/add-modular-future-tasks-system-lzo2gq
export type FutureTasksMode = 'ui_placeholder' | 'active' | 'disabled';
export type FutureTaskStatus = 'coming_soon' | 'active' | 'completed';

export interface FutureTaskMission {
  id: string;
  title: string;
  points: number;
  type: 'social' | 'community' | 'ads' | 'other';
  status: FutureTaskStatus;
  
export type FutureTaskVerificationType = 'social' | 'api' | 'blockchain' | 'manual';
export type FutureTaskVerificationStatus = 'pending' | 'verified' | 'failed';
export type FutureTaskClaimType = 'api' | 'contract' | 'none';

export interface FutureTaskVerificationConfig {
  type: FutureTaskVerificationType;
  status: FutureTaskVerificationStatus;
  provider?: string;
  reference?: string;
  endpoint?: string;
  network?: string;
  contractAddress?: string;
}

export interface FutureTaskClaimConfig {
  type: FutureTaskClaimType;
  endpoint?: string;
  network?: string;
  contractAddress?: string;
}

export interface FutureTaskDefinition {
  id: string;
  label: string;
  description?: string;
  points: number;
  enabled?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  verification: FutureTaskVerificationConfig;
  claim: FutureTaskClaimConfig;
 main
}

export interface FutureTasksConfig {
  enabled: boolean;
 codex/add-modular-future-tasks-system-lzo2gq
  mode: FutureTasksMode;
  missions: FutureTaskMission[];
}

export const FUTURE_TASKS_CONFIG: FutureTasksConfig = {
  enabled: true,
  mode: 'ui_placeholder',
  missions: [
    {
      id: 'follow_x',
      title: 'Follow us on X',
      points: 50,
      type: 'social',
      status: 'coming_soon',
    },
    {
      id: 'join_telegram',
      title: 'Join Telegram',
      points: 50,
      type: 'community',
      status: 'coming_soon',
    },
    {
      id: 'watch_ads',
      title: 'Watch Ads',
      points: 100,
      type: 'ads',
      status: 'coming_soon',
    },
    {
      id: 'share_post_x',
      title: 'Share post on X',
      points: 75,
      type: 'social',
      status: 'coming_soon',
    },
    {
      id: 'share_score_fireside',
      title: 'Share Score on Fireside',
      points: 100,
      type: 'social',
      status: 'coming_soon',
    },
  ],
};

export const isFutureTasksEnabled = () => FUTURE_TASKS_CONFIG.enabled && FUTURE_TASKS_CONFIG.mode !== 'disabled';

  sectionLabel: string;
  sectionDescription?: string;
  tasks: FutureTaskDefinition[];
}

export const FUTURE_TASKS_CONFIG: FutureTasksConfig = {
  enabled: false,
  sectionLabel: 'Earn Points',
  sectionDescription: 'Community missions with future verification hooks.',
  tasks: [
    {
      id: 'follow-x',
      label: 'Follow on X (Twitter)',
      description: 'Follow the official account for updates.',
      points: 75,
      actionLabel: 'Open X',
      actionUrl: 'https://x.com',
      verification: {
        type: 'social',
        status: 'pending',
        provider: 'x',
        reference: '@reputa',
      },
      claim: {
        type: 'api',
        endpoint: '/api/v3/missions/claim',
      },
    },
    {
      id: 'join-telegram',
      label: 'Join Telegram',
      description: 'Join the community chat for announcements.',
      points: 50,
      actionLabel: 'Open Telegram',
      actionUrl: 'https://t.me',
      verification: {
        type: 'social',
        status: 'pending',
        provider: 'telegram',
      },
      claim: {
        type: 'api',
        endpoint: '/api/v3/missions/claim',
      },
    },
    {
      id: 'watch-ads',
      label: 'Watch Ads',
      description: 'Watch approved ads to support the protocol.',
      points: 60,
      verification: {
        type: 'api',
        status: 'pending',
        endpoint: '/api/v3/missions/verify',
      },
      claim: {
        type: 'api',
        endpoint: '/api/v3/missions/claim',
      },
    },
    {
      id: 'share-post-x',
      label: 'Share post on X',
      description: 'Share an official post on your timeline.',
      points: 80,
      actionLabel: 'Share on X',
      actionUrl: 'https://x.com/intent/post',
      verification: {
        type: 'social',
        status: 'pending',
        provider: 'x',
      },
      claim: {
        type: 'api',
        endpoint: '/api/v3/missions/claim',
      },
    },
    {
      id: 'share-score-fireside',
      label: 'Share score screenshot on Fireside',
      description: 'Post your score screenshot on Fireside.',
      points: 100,
      verification: {
        type: 'manual',
        status: 'pending',
      },
      claim: {
        type: 'api',
        endpoint: '/api/v3/missions/claim',
      },
    },
    {
      id: 'future-missions',
      label: 'Future Missions',
      description: 'New community tasks will appear here.',
      points: 50,
      verification: {
        type: 'manual',
        status: 'pending',
      },
      claim: {
        type: 'none',
      },
    },
  ],
};
 main
