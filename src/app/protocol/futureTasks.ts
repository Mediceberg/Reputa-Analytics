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
}

export interface FutureTasksConfig {
  enabled: boolean;
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
