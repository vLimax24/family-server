import { Droplet, Calendar, Check } from 'lucide-react';
import { Plant } from "../lib/types";

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
    <div className="bg-white rounded-[2rem] p-10 border border-gray-200 shadow-xl hover:shadow-2xl transition-all w-[520px] h-[520px] flex flex-col select-none relative overflow-hidden">
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className={`px-5 py-2 rounded-full text-sm font-semibold tracking-wide uppercase ${
          statusColor === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
          statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          Braucht Wasser
        </div>
        <div className={`w-3 h-3 rounded-full ${
          statusColor === 'red' ? 'bg-red-500' :
          statusColor === 'amber' ? 'bg-amber-500' :
          'bg-emerald-500'
        }`} />
      </div>

      {/* Completed Overlay */}
      {isCompleted && plant.last_pour != null && (
        <div className="absolute inset-0 bg-emerald-500/60 backdrop-blur-sm rounded-[2rem] flex items-center justify-center z-20 animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-white rounded-full p-8 shadow-2xl animate-[scaleIn_0.5s_ease-out]">
            <Check className="w-24 h-24 text-emerald-600" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className={`w-36 h-36 rounded-2xl flex items-center justify-center ${
          statusColor === 'red' ? 'bg-red-50 border border-red-200' :
          statusColor === 'amber' ? 'bg-amber-50 border border-amber-200' :
          'bg-emerald-50 border border-emerald-200'
        }`}>
          <Droplet
            className={`w-20 h-20 ${
              statusColor === 'red' ? 'text-red-600' :
              statusColor === 'amber' ? 'text-amber-600' :
              'text-emerald-600'
            }`}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 relative z-10">
        <div>
          <h3 className="text-4xl font-bold text-gray-900 mb-1">{plant.name}</h3>
          <p className="text-2xl text-gray-500">Wohnung</p>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" strokeWidth={2} />
          <span className="text-lg">
            {plant.last_pour == null
              ? 'Noch nie gegossen'
              : daysSinceWatered === 0
                ? 'Heute gegossen'
                : `vor ${daysSinceWatered} Tagen gegossen`}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onWater(plant.id)}
          className={`w-full px-8 py-5 rounded-xl text-2xl font-semibold flex items-center justify-center gap-3 transition-all ${
            statusColor === 'red' ? 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-red-600/30' :
            statusColor === 'amber' ? 'bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] shadow-lg shadow-amber-600/30' :
            'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/30'
          }`}
        >
          <Droplet className="w-6 h-6" strokeWidth={2.5} />
          Pflanze gießen
        </button>
      </div>
    </div>
  );
}