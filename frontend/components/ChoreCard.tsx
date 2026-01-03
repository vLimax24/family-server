import { CheckCircle2, Circle, Clock, Check, RotateCw } from 'lucide-react';
import { Chore } from '@/lib/types';

interface ChoreCardProps {
  chore: Chore;
  onComplete: (choreId: number) => void;
}

export function ChoreCard({ chore, onComplete }: ChoreCardProps) {
  // eslint-disable-next-line
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
                : 'border border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {urgency === 'high' ? 'Dringend' : urgency === 'medium' ? 'Mittel' : 'Niedrig'}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full bg-blue-600 sm:h-3 sm:w-3`} />
      </div>

      {/* Completed Overlay */}
      {isCompleted && chore.last_done != null && (
        <div className="absolute inset-0 z-20 flex animate-[fadeIn_0.5s_ease-out] items-center justify-center rounded-2xl bg-blue-500/60 backdrop-blur-sm sm:rounded-3xl lg:rounded-[2rem]">
          <div className="animate-[scaleIn_0.5s_ease-out] rounded-full bg-white p-6 shadow-2xl sm:p-7 lg:p-8">
            <Check
              className="h-16 w-16 text-blue-600 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
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
                : 'border border-blue-200 bg-blue-50'
          }`}
        >
          {daysSinceDone !== null ? (
            <CheckCircle2
              className="h-14 w-14 text-blue-600 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              strokeWidth={2}
            />
          ) : (
            <Circle
              className="h-14 w-14 text-blue-600 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-3 sm:space-y-3.5 lg:space-y-4">
        <div>
          <h3 className="mb-0.5 text-2xl font-bold text-gray-900 sm:mb-1 sm:text-3xl lg:text-4xl">
            {chore.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock
            className="h-4 w-4 sm:h-5 sm:w-5"
            strokeWidth={2}
          />
          <span className="text-base sm:text-lg">{getLastCompletedText()}</span>
        </div>
        {chore.rotation_enabled == 1 && (
          <div className="flex items-center gap-2 text-gray-600">
            <RotateCw
              className="h-4 w-4 sm:h-5 sm:w-5"
              strokeWidth={2}
            />
            <span className="text-base sm:text-lg">Rotierende Aufgabe</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(chore.id);
          }}
          className={`w-full rounded-xl px-6 py-4 text-xl font-semibold transition-all sm:px-7 sm:py-4 sm:text-xl lg:px-8 lg:py-5 lg:text-2xl ${
            daysSinceDone === 0
              ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98]'
          }`}
          disabled={daysSinceDone === 0}
        >
          {daysSinceDone === 0 ? 'Erledigt' : 'Als erledigt markieren'}
        </button>
      </div>
    </div>
  );
}
