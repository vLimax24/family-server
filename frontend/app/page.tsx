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
          <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="p-2 rounded-lg transition-all hover:bg-gray-100 active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl">
                      {selectedMember.role === "child" ? "👧" : "🧒"}
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900">
                        {selectedMember.name}'s Aufgaben
                      </h1>
                      <p className="text-sm text-gray-500">Täglicher Überblick</p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="flex gap-6 items-center">
                  <StatCard icon={Sprout} count={plants.length} label="Pflanzen zu wässern" color="amber" />
                  <div className="w-px h-10 bg-gray-200" />
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

// Komponenten für bessere Lesbarkeit extrahiert
function StatCard({ icon: Icon, count, label, color }: {
  icon: any;
  count: number;
  label: string;
  color: 'amber' | 'blue'
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 text-${color}-600`} strokeWidth={2} />
        <div className={`text-2xl font-bold text-${color}-700`}>{count}</div>
      </div>
      <div className="text-xs text-gray-600 text-right">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-[2rem] p-10 border border-gray-200 shadow-xl w-[520px] h-[520px] flex flex-col items-center justify-center select-none">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-36 h-36 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Check className="w-20 h-20 text-emerald-600" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold text-gray-900">
            Alle Aufgaben erledigt!
          </h2>
          <p className="text-2xl text-gray-600">
            Gute Arbeit!
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-8 px-5 py-2 rounded-full text-sm font-semibold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          Alles geschafft
        </div>
      </div>
    </div>
  );
}