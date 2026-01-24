import { CheckCircle2, Clock, Zap } from 'lucide-react';

export interface OneTimeTask {
  id: number;
  name: string;
  description: string | null;
  assigned_to: number;
  created_by: number;
  created_at: number;
  completed_at: number | null;
  due_date: number | null;
  priority: 'low' | 'medium' | 'high';
  assigned_to_name?: string;
  created_by_name?: string;
}

interface OneTimeTaskCardProps {
  task: OneTimeTask;
  onComplete: (taskId: number) => void;
}

export function OneTimeTaskCard({ task, onComplete }: OneTimeTaskCardProps) {
  const isCompleted = task.completed_at !== null;
  //eslint-disable-next-line
  const isOverdue = task.due_date && task.due_date * 1000 < Date.now() && !isCompleted;

  const getUrgencyLevel = () => {
    if (isOverdue) return 'high';
    if (task.priority === 'high') return 'high';
    if (task.priority === 'medium') return 'medium';
    return 'low';
  };

  const getStatusText = () => {
    if (isOverdue) return 'Überfällig';
    if (task.priority === 'high') return 'Hoch';
    if (task.priority === 'medium') return 'Mittel';
    return 'Niedrig';
  };

  const formatDueDate = () => {
    if (!task.due_date) return 'Einmalige Aufgabe';

    const dueDate = new Date(task.due_date * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) return 'Heute fällig';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'Morgen fällig';

    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return `${Math.abs(daysDiff)} Tage überfällig`;
    if (daysDiff <= 7) return `In ${daysDiff} Tagen`;

    return dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
    });
  };

  const urgency = getUrgencyLevel();

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
      badge: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      dot: 'bg-purple-500',
      icon: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30',
      overlay: 'bg-purple-500/60',
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
          {getStatusText()}
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
              className="h-20 w-20 text-purple-400"
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
          {isCompleted ? (
            <CheckCircle2
              className="h-16 w-16"
              strokeWidth={2}
            />
          ) : (
            <Zap
              className="h-16 w-16"
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="mb-1 text-3xl font-bold text-slate-100">{task.name}</h3>
          {task.description && (
            <p className="line-clamp-1 text-xl text-slate-400">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Clock
            className="h-5 w-5"
            strokeWidth={2}
          />
          <span className={`text-base ${isOverdue ? 'font-semibold text-pink-400' : ''}`}>
            {formatDueDate()}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className={`w-full rounded-xl px-8 py-5 text-xl font-semibold text-white shadow-lg transition-all ${
            isCompleted
              ? 'cursor-not-allowed border border-slate-700 bg-slate-900/50 text-slate-500'
              : `${colors.button} active:scale-[0.98]`
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? 'Erledigt' : 'Als erledigt markieren'}
        </button>
      </div>
    </div>
  );
}
