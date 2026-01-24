import { Droplet, Calendar } from 'lucide-react';
import { Plant } from '@/lib/types';

interface PlantCardProps {
  plant: Plant;
  onWater: (plantId: number) => void;
}

export function PlantCard({ plant, onWater }: PlantCardProps) {
  //eslint-disable-next-line
  const time = Date.now();

  const daysSinceWatered =
    plant.last_pour != null
      ? Math.floor((time - plant.last_pour * 1000) / (1000 * 60 * 60 * 24))
      : null;

  const getStatusColor = () => {
    if (daysSinceWatered === null) return 'teal';
    if (daysSinceWatered > 5) return 'pink';
    if (daysSinceWatered > 2) return 'amber';
    return 'teal';
  };

  const statusColor = getStatusColor();
  const isCompleted = daysSinceWatered === 0;

  const colorClasses = {
    teal: {
      badge: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
      dot: 'bg-teal-500',
      icon: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
      button: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30',
      overlay: 'bg-teal-500/60',
      check: 'text-teal-400',
    },
    amber: {
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      dot: 'bg-amber-500',
      icon: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
      overlay: 'bg-amber-500/60',
      check: 'text-amber-400',
    },
    pink: {
      badge: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
      dot: 'bg-pink-500',
      icon: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
      button: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/30',
      overlay: 'bg-pink-500/60',
      check: 'text-pink-400',
    },
  };

  const colors = colorClasses[statusColor];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl transition-all">
      {/* Header */}
      <div className="relative z-10 mb-5 flex items-start justify-between">
        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase ${colors.badge}`}
        >
          {isCompleted ? 'Gegossen' : 'Braucht Wasser'}
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
              className={`h-20 w-20 ${colors.check}`}
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
          <Droplet
            className="h-16 w-16"
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="mb-1 text-3xl font-bold text-slate-100">{plant.name}</h3>
          <p className="text-xl text-slate-400">Wohnung</p>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Calendar
            className="h-5 w-5"
            strokeWidth={2}
          />
          <span className="text-base">
            {daysSinceWatered === null
              ? 'Noch nie gegossen'
              : daysSinceWatered === 0
                ? 'Heute gegossen'
                : `vor ${daysSinceWatered} Tagen gegossen`}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onWater(plant.id);
          }}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-8 py-5 text-xl font-semibold text-white shadow-lg transition-all ${
            isCompleted
              ? 'cursor-not-allowed border border-slate-700 bg-slate-900/50 text-slate-500'
              : `${colors.button} active:scale-[0.98]`
          }`}
          disabled={isCompleted}
        >
          <Droplet
            className="h-6 w-6"
            strokeWidth={2.5}
          />
          {isCompleted ? 'Heute gegossen' : 'Pflanze gießen'}
        </button>
      </div>
    </div>
  );
}
