import { CheckCircle2, Circle, Clock, RotateCw } from 'lucide-react';
import { Chore } from '@/lib/types';

interface ChoreCardProps {
  chore: Chore;
  onComplete: (choreId: number) => void;
}

export function ChoreCard({ chore, onComplete }: ChoreCardProps) {
  //eslint-disable-next-line
  const time = Date.now();

  const daysSinceDone = chore.last_done
    ? Math.floor((time - chore.last_done * 1000) / (1000 * 60 * 60 * 24))
    : null;

  const getLastCompletedText = () => {
    if (daysSinceDone === null) return 'Noch nie erledigt';
    if (daysSinceDone === 0) return 'Heute erledigt';
    if (daysSinceDone === 1) return 'Gestern erledigt';
    return `Vor ${daysSinceDone} Tagen erledigt`;
  };

  const getUrgencyLevel = () => {
    if (daysSinceDone === null) return 'low';
    if (daysSinceDone > 3) return 'high';
    if (daysSinceDone > 1) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();
  const isCompleted = daysSinceDone === 0;

  const colorClasses = {
    high: {
      badge: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
      dot: 'bg-pink-500',
      icon: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
      button: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/30',
      overlay: 'bg-pink-500/60',
    },
    medium: {
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      dot: 'bg-amber-500',
      icon: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
      overlay: 'bg-amber-500/60',
    },
    low: {
      badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
      dot: 'bg-indigo-500',
      icon: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30',
      overlay: 'bg-indigo-500/60',
    },
  };

  const colors = colorClasses[urgency];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl transition-all">
      {/* Header */}
      <div className="relative z-10 mb-5 flex items-start justify-between">
        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase ${colors.badge}`}
        >
          {urgency === 'high' ? 'Dringend' : urgency === 'medium' ? 'Mittel' : 'Niedrig'}
        </div>
        <div className={`h-3 w-3 rounded-full ${colors.dot}`} />
      </div>

      {/* Completed Overlay */}
      {isCompleted && (
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm ${colors.overlay}`}
        >
          <div className="rounded-full bg-slate-800 p-8 shadow-2xl">
            <svg
              className="h-20 w-20 text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div
          className={`flex h-32 w-32 items-center justify-center rounded-2xl border ${colors.icon}`}
        >
          {daysSinceDone !== null ? (
            <CheckCircle2
              className="h-16 w-16"
              strokeWidth={2}
            />
          ) : (
            <Circle
              className="h-16 w-16"
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="mb-1 text-3xl font-bold text-slate-100">{chore.name}</h3>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Clock
            className="h-5 w-5"
            strokeWidth={2}
          />
          <span className="text-base">{getLastCompletedText()}</span>
        </div>

        {chore.rotation_enabled === 1 && (
          <div className="flex items-center gap-2 text-slate-400">
            <RotateCw
              className="h-5 w-5"
              strokeWidth={2}
            />
            <span className="text-base">Rotierende Aufgabe</span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(chore.id);
          }}
          className={`w-full rounded-xl px-8 py-5 text-xl font-semibold text-white shadow-lg transition-all ${
            isCompleted
              ? 'cursor-not-allowed border border-slate-700 bg-slate-900/50 text-slate-500'
              : `${colors.button} active:scale-[0.98]`
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? 'Heute erledigt' : 'Als erledigt markieren'}
        </button>
      </div>
    </div>
  );
}
