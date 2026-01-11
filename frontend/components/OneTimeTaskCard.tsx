import { CheckCircle2, Circle, Clock, Check, Zap } from 'lucide-react';

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

  return (
    <div className="relative flex min-h-100 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all select-none hover:shadow-2xl sm:min-h-115 sm:rounded-3xl sm:p-8 lg:h-130 lg:rounded-[2rem] lg:p-10">
      {/* Header */}
      <div className="relative z-10 mb-4 flex items-start justify-between sm:mb-5 lg:mb-6">
        <div
          className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase sm:px-4 sm:py-2 sm:text-sm lg:px-5 lg:py-2 ${
            urgency === 'high'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : urgency === 'medium'
                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                : 'border border-purple-200 bg-purple-50 text-purple-700'
          }`}
        >
          {getStatusText()}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full bg-purple-500 sm:h-3 sm:w-3`} />
      </div>

      {/* Completed Overlay */}
      {isCompleted && task.completed_at != null && (
        <div className="absolute inset-0 z-20 flex animate-[fadeIn_0.5s_ease-out] items-center justify-center rounded-2xl bg-purple-500/60 backdrop-blur-sm sm:rounded-3xl lg:rounded-[2rem]">
          <div className="animate-[scaleIn_0.5s_ease-out] rounded-full bg-white p-6 shadow-2xl sm:p-7 lg:p-8">
            <Check
              className="h-16 w-16 text-purple-600 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              strokeWidth={3}
            />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-xl sm:h-28 sm:w-28 sm:rounded-2xl lg:h-36 lg:w-36 ${
            urgency === 'high'
              ? 'border border-red-200 bg-red-50'
              : urgency === 'medium'
                ? 'border border-amber-200 bg-amber-50'
                : 'border border-purple-200 bg-purple-50'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2
              className="h-14 w-14 text-purple-600 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              strokeWidth={2}
            />
          ) : (
            <Zap
              className={`h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 ${
                urgency === 'high'
                  ? 'text-red-600'
                  : urgency === 'medium'
                    ? 'text-amber-600'
                    : 'text-purple-600'
              }`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-3 sm:space-y-3.5 lg:space-y-4">
        <div>
          <h3 className="mb-0.5 text-2xl font-bold text-gray-900 sm:mb-1 sm:text-3xl lg:text-4xl">
            {task.name}
          </h3>
          {task.description && (
            <p className="line-clamp-1 text-base text-gray-500 sm:text-lg lg:text-xl">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock
            className="h-4 w-4 sm:h-5 sm:w-5"
            strokeWidth={2}
          />
          <span className={`text-base sm:text-lg ${isOverdue ? 'font-semibold text-red-600' : ''}`}>
            {formatDueDate()}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className={`w-full rounded-xl px-6 py-4 text-xl font-semibold transition-all sm:px-7 sm:py-4 sm:text-xl lg:px-8 lg:py-5 lg:text-2xl ${
            isCompleted
              ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
              : 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 active:scale-[0.98]'
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? 'Erledigt' : 'Als erledigt markieren'}
        </button>
      </div>
    </div>
  );
}
