import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { FUTURE_TASKS_CONFIG, type FutureTaskDefinition } from '../protocol/futureTasks';

const statusLabels: Record<FutureTaskDefinition['verification']['status'], string> = {
  pending: 'Verification Pending',
  verified: 'Verified',
  failed: 'Verification Failed',
};

export function SidebarFutureTasks() {
  const [claimedTasks, setClaimedTasks] = useState<Record<string, boolean>>({});

  const tasks = useMemo(
    () => FUTURE_TASKS_CONFIG.tasks.filter((task) => task.enabled !== false),
    []
  );

  if (!FUTURE_TASKS_CONFIG.enabled || tasks.length === 0) {
    return null;
  }

  const handleClaim = (task: FutureTaskDefinition) => {
    if (task.verification.status !== 'verified' || claimedTasks[task.id]) {
      return;
    }
    setClaimedTasks((prev) => ({ ...prev, [task.id]: true }));
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(0, 217, 255, 0.7)' }}>
          {FUTURE_TASKS_CONFIG.sectionLabel}
        </p>
      </div>
      {FUTURE_TASKS_CONFIG.sectionDescription && (
        <p className="mb-4 text-[10px] text-gray-400">{FUTURE_TASKS_CONFIG.sectionDescription}</p>
      )}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isVerified = task.verification.status === 'verified';
          const isClaimed = claimedTasks[task.id];
          const isClaimDisabled = !isVerified || isClaimed;
          return (
            <div
              key={task.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white">{task.label}</p>
                  {task.description && (
                    <p className="text-[10px] text-gray-400">{task.description}</p>
                  )}
                  <p className="mt-1 text-[10px] font-semibold text-cyan-300">
                    +{task.points} pts
                  </p>
                  <p className="text-[9px] uppercase tracking-wide text-gray-500">
                    {statusLabels[task.verification.status]}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {task.actionUrl && (
                    <a
                      href={task.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/10"
                    >
                      {task.actionLabel || 'Open'}
                    </a>
                  )}
                  <button
                    onClick={() => handleClaim(task)}
                    disabled={isClaimDisabled}
                    aria-disabled={isClaimDisabled}
                    className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      isClaimDisabled
                        ? 'cursor-not-allowed bg-white/5 text-gray-500'
                        : 'bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                    }`}
                  >
                    {isClaimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
