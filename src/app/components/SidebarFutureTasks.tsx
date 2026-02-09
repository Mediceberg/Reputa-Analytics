import { Sparkles } from 'lucide-react';
import { FUTURE_TASKS_CONFIG, type FutureTaskMission } from '../protocol/futureTasks';

const statusLabels: Record<FutureTaskMission['status'], string> = {
  coming_soon: 'Coming Soon',
  active: 'Active',
  completed: 'Completed',
};

export function SidebarFutureTasks() {
  const missions = FUTURE_TASKS_CONFIG.missions;
  const isClaimLocked = FUTURE_TASKS_CONFIG.mode === 'ui_placeholder';

  if (!FUTURE_TASKS_CONFIG.enabled) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'rgba(0, 217, 255, 0.7)' }}
        >
          Earn Points
        </p>
      </div>
      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">{mission.title}</p>
                <p className="mt-1 text-[10px] font-semibold text-cyan-300">
                  +{mission.points} pts
                </p>
                <p className="text-[9px] uppercase tracking-wide text-gray-500">
                  {statusLabels[mission.status]}
                </p>
              </div>
              <button
                disabled
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500"
              >
                {isClaimLocked ? 'Coming Soon' : 'Claim'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
