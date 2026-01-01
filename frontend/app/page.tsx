"use client"

import { useState, useEffect } from 'react';
import { ArrowLeft, Sprout, ListTodo, Check } from 'lucide-react';
import { UserSelector } from '@/components/UserSelector';
import { PlantCard } from '@/components/PlantCard';
import { ChoreCard } from '@/components/ChoreCard';
import { TaskCarousel } from '@/components/TaskCarousel';
import { FamilyMember, Plant, Chore } from '@/lib/types';
import { apiService } from '@/services/apiService';

export default function Page() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Lade Familie beim Mount
  useEffect(() => {
    apiService.getFamilyMembers()
      .then(setFamilyMembers)
      .catch(console.error);
  }, []);

  // Lade Dashboard-Daten wenn Member ausgewählt
  useEffect(() => {
    if (!selectedMember) return;

    apiService.getDashboardData(selectedMember.id)
      .then(({ plants, chores }) => {
        setPlants(plants);
        console.log(chores)
        setChores(chores);
      })
      .catch(console.error);
  }, [selectedMember]);

  // Handler für Pflanze gießen
  const handleWaterPlant = async (plantId: number) => {
    try {
      await apiService.waterPlant(plantId);

      // Optimistisches Update
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === plantId ? { ...plant, last_pour: Date.now() / 1000 } : plant
        )
      );
    } catch (error) {
      console.error('Failed to water plant:', error);
    }
  };

  // Handler für Aufgabe erledigen
  const handleCompleteChore = async (choreId: number) => {
    try {
      await apiService.completeChore(choreId);

      // Optimistisches Update
      setChores((prev) =>
        prev.map((chore) =>
          chore.id === choreId ? { ...chore, last_done: Date.now() / 1000 } : chore
        )
      );
    } catch (error) {
      console.error('Failed to complete chore:', error);
    }
  };

  // Erstelle Carousel-Items
  const allTasks = [
    ...plants.map((plant) => (
      <PlantCard key={`plant-${plant.id}`} plant={plant} onWater={handleWaterPlant} />
    )),
    ...chores.map((chore) => (
      <ChoreCard key={`chore-${chore.id}`} chore={chore} onComplete={handleCompleteChore} />
    )),
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {!selectedMember ? (
          <div className="flex-1 flex items-center justify-center">
            <UserSelector members={familyMembers} onSelectMember={setSelectedMember} />
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4 sm:gap-6">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="p-1.5 sm:p-2 rounded-lg transition-all hover:bg-gray-100 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" strokeWidth={2} />
                  </button>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl sm:text-2xl">
                      {selectedMember.name == 'Linas' ? '🧑' : selectedMember.name == "Amelie" ? '👧' : selectedMember.name == "Katrin" ? '👩' : '👨'}
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                        {selectedMember.name}'s Aufgaben
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500">Täglicher Überblick</p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="flex gap-3 sm:gap-6 items-center">
                  <StatCard icon={Sprout} count={plants.length} label="Pflanzen zu wässern" color="amber" />
                  <div className="w-px h-8 sm:h-10 bg-gray-200" />
                  <StatCard icon={ListTodo} count={chores.length} label="Aufgaben ausstehend" color="blue" />
                </div>
              </div>
            </div>

            {/* Carousel */}
            <div className="flex-1 relative">
              {allTasks.length > 0 ? (
                <TaskCarousel items={allTasks} />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, count, label, color }: {
  icon: any;
  count: number;
  label: string;
  color: 'amber' | 'blue'
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 sm:gap-1">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${color}-600`} strokeWidth={2} />
        <div className={`text-lg sm:text-xl lg:text-2xl font-bold text-${color}-700`}>{count}</div>
      </div>
      <div className="text-[10px] sm:text-xs hidden sm:block text-gray-600 text-right">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-gray-200 shadow-xl w-full max-w-[520px] mx-4 sm:w-[520px] min-h-[350px] sm:min-h-[400px] lg:h-[520px] flex flex-col items-center justify-center select-none">
        {/* Icon */}
        <div className="mb-5 sm:mb-6 lg:mb-8">
          <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Check className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-emerald-600" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Alle Aufgaben erledigt!
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600">
            Gute Arbeit!
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-5 sm:mt-6 lg:mt-8 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          Alles geschafft
        </div>
      </div>
    </div>
  );
}