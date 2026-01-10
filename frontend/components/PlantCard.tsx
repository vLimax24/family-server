import { Droplet, Calendar, Check } from 'lucide-react';
import { Plant } from '@/lib/types';
import { completionTracker } from '@/services/completionTracker';

interface PlantCardProps {
  plant: Plant;
  onWater: (plantId: number) => void;
}

export function PlantCard({ plant, onWater }: PlantCardProps) {
  //eslint-disable-next-line
  const time = Date.now();

  // Check if completed today via localStorage
  const completedToday = completionTracker.isCompletedToday(plant.id, 'plant');
  const localCompletionTime = completionTracker.getCompletionTime(plant.id, 'plant');

  // Use local completion time if available, otherwise use server time
  const effectiveLastPour =
    completedToday && localCompletionTime ? localCompletionTime : plant.last_pour;

  const daysSinceWatered =
    effectiveLastPour != null
      ? Math.floor((time - effectiveLastPour * 1000) / (1000 * 60 * 60 * 24))
      : null;

  const getStatusColor = () => {
    if (daysSinceWatered === null) return 'emerald';
    if (daysSinceWatered > 5) return 'red';
    if (daysSinceWatered > 2) return 'amber';
    return 'emerald';
  };

  const statusColor = getStatusColor();
  const isCompleted = daysSinceWatered === 0 || completedToday;

  const handleWater = () => {
    // Mark as completed in localStorage immediately
    completionTracker.markCompleted(plant.id, 'plant');

    // Call the API to update on server
    onWater(plant.id);
  };

  return (
    <div className="relative flex h-100 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all select-none hover:shadow-2xl sm:h-155 sm:rounded-3xl sm:p-8 lg:h-130 lg:rounded-[2rem] lg:p-10">
      {/* Header with Status Badge */}
      <div className="relative z-10 mb-4 flex items-start justify-between sm:mb-5 lg:mb-6">
        <div
          className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase sm:px-4 sm:py-2 sm:text-sm lg:px-5 lg:py-2 ${
            statusColor === 'red'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : statusColor === 'amber'
                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isCompleted ? 'Gegossen' : 'Braucht Wasser'}
        </div>
        <div
          className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${
            statusColor === 'red'
              ? 'bg-red-500'
              : statusColor === 'amber'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          }`}
        />
      </div>

      {/* Completed Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 z-20 flex animate-[fadeIn_0.5s_ease-out] items-center justify-center rounded-2xl bg-emerald-500/60 backdrop-blur-sm sm:rounded-3xl lg:rounded-[2rem]">
          <div className="animate-[scaleIn_0.5s_ease-out] rounded-full bg-white p-6 shadow-2xl sm:p-7 lg:p-8">
            <Check
              className="h-16 w-16 text-emerald-600 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              strokeWidth={3}
            />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-xl sm:h-28 sm:w-28 sm:rounded-2xl lg:h-36 lg:w-36 ${
            statusColor === 'red'
              ? 'border border-red-200 bg-red-50'
              : statusColor === 'amber'
                ? 'border border-amber-200 bg-amber-50'
                : 'border border-emerald-200 bg-emerald-50'
          }`}
        >
          <Droplet
            className={`h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 ${
              statusColor === 'red'
                ? 'text-red-600'
                : statusColor === 'amber'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }`}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-3 sm:space-y-3.5 lg:space-y-4">
        <div>
          <h3 className="mb-0.5 text-2xl font-bold text-gray-900 sm:mb-1 sm:text-3xl lg:text-4xl">
            {plant.name}
          </h3>
          <p className="text-lg text-gray-500 sm:text-xl lg:text-2xl">Wohnung</p>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar
            className="h-4 w-4 sm:h-5 sm:w-5"
            strokeWidth={2}
          />
          <span className="text-base sm:text-lg">
            {daysSinceWatered === null
              ? 'Noch nie gegossen'
              : daysSinceWatered === 0
                ? 'Heute gegossen'
                : `vor ${daysSinceWatered} Tagen gegossen`}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWater();
          }}
          className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-xl font-semibold transition-all sm:gap-3 sm:px-7 sm:py-4 sm:text-xl lg:px-8 lg:py-5 lg:text-2xl ${
            isCompleted
              ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
              : statusColor === 'red'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-[0.98]'
                : statusColor === 'amber'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-[0.98]'
                  : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.98]'
          }`}
          disabled={isCompleted}
        >
          <Droplet
            className="h-5 w-5 sm:h-6 sm:w-6"
            strokeWidth={2.5}
          />
          {isCompleted ? 'Heute gegossen' : 'Pflanze gießen'}
        </button>
      </div>
    </div>
  );
}
