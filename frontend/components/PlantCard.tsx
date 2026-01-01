import { Droplet, Calendar, Check } from 'lucide-react';
import { Plant } from "@/lib/types";

interface PlantCardProps {
  plant: Plant;
  onWater: (plantId: number) => void;
}

export function PlantCard({ plant, onWater }: PlantCardProps) {
  const daysSinceWatered = plant.last_pour != null ? Math.floor((Date.now() - plant.last_pour * 1000) / (1000 * 60 * 60 * 24)) : 0;

  const getStatusColor = () => {
    if (daysSinceWatered > 5) return 'red';
    if (daysSinceWatered > 2) return 'amber';
    return 'emerald';
  };

  const statusColor = getStatusColor();
  const isCompleted = daysSinceWatered === 0;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-gray-200 shadow-xl hover:shadow-2xl transition-all w-full h-[400px] sm:h-[460px] lg:h-[520px] flex flex-col select-none relative overflow-hidden">
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between mb-4 sm:mb-5 lg:mb-6 relative z-10">
        <div className={`px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase ${
          statusColor === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
          statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          Braucht Wasser
        </div>
        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
          statusColor === 'red' ? 'bg-red-500' :
          statusColor === 'amber' ? 'bg-amber-500' :
          'bg-emerald-500'
        }`} />
      </div>

      {/* Completed Overlay */}
      {isCompleted && plant.last_pour != null && (
        <div className="absolute inset-0 bg-emerald-500/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl lg:rounded-[2rem] flex items-center justify-center z-20 animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-white rounded-full p-6 sm:p-7 lg:p-8 shadow-2xl animate-[scaleIn_0.5s_ease-out]">
            <Check className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-emerald-600" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-xl sm:rounded-2xl flex items-center justify-center ${
          statusColor === 'red' ? 'bg-red-50 border border-red-200' :
          statusColor === 'amber' ? 'bg-amber-50 border border-amber-200' :
          'bg-emerald-50 border border-emerald-200'
        }`}>
          <Droplet
            className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 ${
              statusColor === 'red' ? 'text-red-600' :
              statusColor === 'amber' ? 'text-amber-600' :
              'text-emerald-600'
            }`}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-3.5 lg:space-y-4 relative z-10">
        <div>
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-1">{plant.name}</h3>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-500">Wohnung</p>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
          <span className="text-base sm:text-lg">
            {plant.last_pour == null
              ? 'Noch nie gegossen'
              : daysSinceWatered === 0
                ? 'Heute gegossen'
                : `vor ${daysSinceWatered} Tagen gegossen`}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
              e.stopPropagation()
              onWater(plant.id)
          }}
          className={`w-full px-6 py-4 sm:px-7 sm:py-4 lg:px-8 lg:py-5 rounded-xl text-xl sm:text-xl lg:text-2xl font-semibold flex items-center justify-center gap-2.5 sm:gap-3 transition-all ${
            statusColor === 'red' ? 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-600/30' :
            statusColor === 'amber' ? 'bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] shadow-lg shadow-amber-600/30' :
            'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/30'
          }`}
        >
          <Droplet className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
          Pflanze gießen
        </button>
      </div>
    </div>
  );
}