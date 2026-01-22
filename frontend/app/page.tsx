'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sprout, Settings, ListTodo, Check, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserSelector } from '@/components/UserSelector';
import { PlantCard } from '@/components/PlantCard';
import { ChoreCard } from '@/components/ChoreCard';
import { OneTimeTaskCard, OneTimeTask } from '@/components/OneTimeTaskCard';
import { TaskCarousel } from '@/components/TaskCarousel';
import CompletionHistory from '@/components/CompletionHistory';
import { CreateOneTimeTaskDialog } from '@/components/CreateOneTimeTaskDialog';
import { FamilyMember, Plant, Chore } from '@/lib/types';
import { apiService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { ManageTasksDialog } from '@/components/ManageTasksDialog';
import { pushService } from '@/services/pushService';

export default function Page() {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [oneTimeTasks, setOneTimeTasks] = useState<OneTimeTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [manageDialogOpen, setManageDialogOpen] = useState<boolean>(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState<boolean>(false);
  const [historyRefresh, setHistoryRefresh] = useState(0); // Trigger history refresh

  // Load family members on mount
  useEffect(() => {
    apiService.getFamilyMembers().then(setFamilyMembers).catch(console.error);
  }, []);

  // Handle push notifications
  useEffect(() => {
    if (selectedMember) {
      const notificationsSupported =
        'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

      if (!notificationsSupported) {
        console.log('Push notifications not supported on this device/browser');
        return;
      }

      if (Notification.permission === 'default') {
        setTimeout(async () => {
          const granted = await pushService.requestPermission();
          if (granted) {
            await pushService.subscribeToPush(selectedMember.id);
          }
        }, 2000);
      } else if (Notification.permission === 'granted') {
        pushService.subscribeToPush(selectedMember.id);
      }
    }
  }, [selectedMember]);

  const handleTasksUpdated = () => {
    if (selectedMember) {
      apiService
        .getDashboardData(selectedMember.id)
        .then(({ plants, chores }) => {
          setPlants(plants);
          setChores(chores);
        })
        .catch(console.error);

      // Also reload one-time tasks
      loadOneTimeTasks();
    }
  };

  const loadOneTimeTasks = async () => {
    if (!selectedMember) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/one-time-tasks/${selectedMember.id}`,
      );
      const data = await response.json();
      setOneTimeTasks(data);
    } catch (error) {
      console.error('Failed to load one-time tasks:', error);
    }
  };

  // Load dashboard data when member is selected
  useEffect(() => {
    if (!selectedMember) return;

    apiService
      .getDashboardData(selectedMember.id)
      .then(({ plants, chores }) => {
        setPlants(plants);
        setChores(chores);
      })
      .catch(console.error);

    loadOneTimeTasks();
  }, [selectedMember]);

  // Handler for watering plant
  const handleWaterPlant = async (plantId: number) => {
    try {
      await apiService.waterPlant(plantId);
      // Note: The PlantCard now handles localStorage updates internally
      // We keep the optimistic update here for the backend state
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === plantId ? { ...plant, last_pour: Date.now() / 1000 } : plant,
        ),
      );
      // Trigger history refresh
      setHistoryRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to water plant:', error);
    }
  };

  // Handler for completing chore
  const handleCompleteChore = async (choreId: number) => {
    try {
      await apiService.completeChore(choreId);
      // Note: The ChoreCard now handles localStorage updates internally
      setChores((prev) =>
        prev.map((chore) =>
          chore.id === choreId ? { ...chore, last_done: Date.now() / 1000 } : chore,
        ),
      );
      // Trigger history refresh
      setHistoryRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to complete chore:', error);
    }
  };

  // Handler for completing one-time task
  const handleCompleteOneTimeTask = async (taskId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/one-time-tasks/${taskId}/complete`, {
        method: 'PATCH',
      });

      // Update the task to show as completed instead of removing it
      setOneTimeTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed_at: Math.floor(Date.now() / 1000) } : task,
        ),
      );

      // Trigger history refresh
      setHistoryRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleMemberAvailabilityChange = (memberId: number, newAvailability: number) => {
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({
        ...selectedMember,
        is_available: newAvailability,
      });
    }

    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, is_available: newAvailability } : member,
      ),
    );
  };

  // Create carousel items
  const allTasks = [
    ...plants.map((plant) => (
      <PlantCard
        key={`plant-${plant.id}`}
        plant={plant}
        onWater={handleWaterPlant}
      />
    )),
    ...chores.map((chore) => (
      <ChoreCard
        key={`chore-${chore.id}`}
        chore={chore}
        onComplete={handleCompleteChore}
      />
    )),
    ...oneTimeTasks.map((task) => (
      <OneTimeTaskCard
        key={`onetimetask-${task.id}`}
        task={task}
        onComplete={handleCompleteOneTimeTask}
      />
    )),
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-linear-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="flex h-full flex-col">
        {!selectedMember ? (
          <div className="flex flex-1 items-center justify-center">
            <UserSelector
              members={familyMembers}
              onSelectMember={setSelectedMember}
              onMemberAvailabilityChange={handleMemberAvailabilityChange}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left: User Info */}
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="shrink-0 rounded-lg p-1.5 transition-all hover:bg-gray-100 active:scale-95 sm:p-2"
                  >
                    <ArrowLeft
                      className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5"
                      strokeWidth={2}
                    />
                  </button>
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-lg text-white sm:h-11 sm:w-11 sm:text-xl">
                      {selectedMember.name == 'Linas'
                        ? '🧑'
                        : selectedMember.name == 'Amelie'
                          ? '👧'
                          : selectedMember.name == 'Katrin'
                            ? '👩'
                            : '👨'}
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-lg lg:text-xl">
                        {selectedMember.name}
                      </h1>
                      <p className="hidden text-xs text-gray-500 sm:block">Aufgaben</p>
                    </div>
                  </div>
                </div>

                {/* Center: Stats - Hidden on mobile */}
                <div className="hidden items-center gap-4 lg:flex xl:gap-6">
                  <div className="flex items-center gap-2">
                    <Sprout
                      className="h-4 w-4 text-amber-600"
                      strokeWidth={2}
                    />
                    <div className="text-lg font-bold text-amber-700">{plants.length}</div>
                    <span className="text-xs text-gray-600">Pflanzen</span>
                  </div>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <ListTodo
                      className="h-4 w-4 text-blue-600"
                      strokeWidth={2}
                    />
                    <div className="text-lg font-bold text-blue-700">
                      {chores.length + oneTimeTasks.length}
                    </div>
                    <span className="text-xs text-gray-600">Aufgaben</span>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-200 bg-purple-50 p-2 text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100 sm:gap-2 sm:px-3"
                    onClick={() => setCreateTaskDialogOpen(true)}
                  >
                    <Plus
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                    <span className="hidden xl:inline">Neue Aufgabe</span>
                  </Button>
                  <CompletionHistory
                    personId={selectedMember.id}
                    refreshTrigger={historyRefresh}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-slate-200 bg-white p-2 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 sm:gap-2 sm:px-3"
                    onClick={() => setManageDialogOpen(true)}
                  >
                    <Settings
                      className="h-4 w-4 text-slate-600"
                      strokeWidth={2}
                    />
                    <span className="hidden xl:inline">Verwalten</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Carousel */}
            <div className="relative flex-1">
              {allTasks.length > 0 ? <TaskCarousel items={allTasks} /> : <EmptyState />}
            </div>
          </div>
        )}
      </div>
      {selectedMember && (
        <>
          <ManageTasksDialog
            open={manageDialogOpen}
            onOpenChange={setManageDialogOpen}
            selectedMember={selectedMember}
            familyMembers={familyMembers}
            onTasksUpdated={handleTasksUpdated}
          />
          <CreateOneTimeTaskDialog
            open={createTaskDialogOpen}
            onOpenChange={setCreateTaskDialogOpen}
            currentMember={selectedMember}
            familyMembers={familyMembers}
            onSuccess={loadOneTimeTasks}
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  count,
  label,
  color,
}: {
  icon: LucideIcon;
  count: number;
  label: string;
  color: 'amber' | 'blue';
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 sm:gap-1">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Icon
          className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600`}
          strokeWidth={2}
        />
        <div className={`text-lg font-bold sm:text-xl lg:text-2xl text-${color}-700`}>{count}</div>
      </div>
      <div className="hidden text-right text-[10px] text-gray-600 sm:block sm:text-xs">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-4 flex min-h-87.5 w-full max-w-130 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-xl select-none sm:min-h-100 sm:w-130 sm:rounded-3xl sm:p-8 lg:h-130 lg:rounded-[2rem] lg:p-10">
        {/* Icon */}
        <div className="mb-5 sm:mb-6 lg:mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 sm:h-28 sm:w-28 sm:rounded-2xl lg:h-36 lg:w-36">
            <Check
              className="h-12 w-12 text-emerald-600 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-center sm:space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
            Alle Aufgaben erledigt!
          </h2>
          <p className="text-lg text-gray-600 sm:text-xl lg:text-2xl">Gute Arbeit!</p>
        </div>

        {/* Status Badge */}
        <div className="mt-5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700 uppercase sm:mt-6 sm:px-5 sm:py-2 sm:text-sm lg:mt-8">
          Alles geschafft
        </div>
      </div>
    </div>
  );
}
