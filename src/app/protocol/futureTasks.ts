export type FutureTasksMode = 'ui_placeholder' | 'active' | 'disabled';
export type FutureTaskStatus = 'coming_soon' | 'active' | 'completed';

export interface FutureTaskMission {
  id: string;
  title: string;
  points: number;
  type: 'social' | 'community' | 'ads' | 'other';
  status: FutureTaskStatus;
}

export interface FutureTasksConfig {
  enabled: boolean;
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
