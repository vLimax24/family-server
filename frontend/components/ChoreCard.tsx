import { CheckCircle2, Circle, Clock, Check, RotateCw } from 'lucide-react';
import { Chore } from "@/lib/types";

interface ChoreCardProps {
  chore: Chore;
  onComplete: (choreId: number) => void;
}

export function ChoreCard({ chore, onComplete }: ChoreCardProps) {
  const daysSinceDone = chore.last_done
    ? Math.floor((Date.now() - chore.last_done * 1000) / (1000 * 60 * 60 * 24))
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
    <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-gray-200 shadow-xl hover:shadow-2xl transition-all w-full min-h-[400px] sm:min-h-[460px] lg:h-[520px] flex flex-col select-none relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-5 lg:mb-6 relative z-10">
        <div className={`px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase ${
          urgency === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
          urgency === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {urgency === 'high' ? 'Dringend' : urgency === 'medium' ? 'Mittel' : 'Niedrig'}
        </div>
        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-600`}/>
      </div>

      {/* Completed Overlay */}
      {isCompleted && chore.last_done != null && (
        <div className="absolute inset-0 bg-blue-500/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl lg:rounded-[2rem] flex items-center justify-center z-20 animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-white rounded-full p-6 sm:p-7 lg:p-8 shadow-2xl animate-[scaleIn_0.5s_ease-out]">
            <Check className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-blue-600" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-xl sm:rounded-2xl flex items-center justify-center ${
          urgency === 'high' ? 'bg-red-50 border border-red-200' :
          urgency === 'medium' ? 'bg-amber-50 border border-amber-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {daysSinceDone !== null ? (
            <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-blue-600" strokeWidth={2} />
          ) : (
            <Circle className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-blue-600" strokeWidth={2} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-3.5 lg:space-y-4 relative z-10">
        <div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-1">{chore.name}</h3>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
          <span className="text-base sm:text-lg">{getLastCompletedText()}</span>
        </div>
        {chore.rotation_enabled == 1 && (
          <div className="flex items-center gap-2 text-gray-600">
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            <span className="text-base sm:text-lg">Rotierende Aufgabe</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
              e.stopPropagation()
              onComplete(chore.id)
          }}
          className={`w-full px-6 py-4 sm:px-7 sm:py-4 lg:px-8 lg:py-5 rounded-xl text-xl sm:text-xl lg:text-2xl font-semibold transition-all ${
            daysSinceDone === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/30'
          }`}
          disabled={daysSinceDone === 0}
        >
          {daysSinceDone === 0 ? 'Erledigt' : 'Als erledigt markieren'}
        </button>
      </div>
    </div>
  );
}