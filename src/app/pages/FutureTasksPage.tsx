import { Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FUTURE_TASKS_CONFIG } from '../protocol/futureTasks';

export function FutureTasksPage() {
  const isClaimLocked = FUTURE_TASKS_CONFIG.mode === 'ui_placeholder';

  if (!FUTURE_TASKS_CONFIG.enabled) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div
        className="glass-card p-5"
        style={{ border: '1px solid rgba(0, 217, 255, 0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
            }}
          >
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              Earn Points
            </p>
            <p className="text-xs text-gray-400">
              Future community missions are coming soon. Complete tasks once verification is live.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {FUTURE_TASKS_CONFIG.tasks.map((mission) => (
          <div
            key={mission.id}
            className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div>
              <p className="text-sm font-semibold text-white">{mission.label}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-gray-500">
                <span className="rounded-full border border-white/10 px-2 py-0.5">{mission.verification.type}</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5">{mission.verification.status.replace('_', ' ')}</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-cyan-300">+{mission.points} pts</p>
            </div>
            <Button disabled className="self-start sm:self-center" variant="outline">
              {isClaimLocked ? 'Coming Soon' : 'Claim'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
