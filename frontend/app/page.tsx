'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Sprout, Settings, ListTodo, Plus } from 'lucide-react';
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
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    apiService.getFamilyMembers().then(setFamilyMembers).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedMember) return;

    const notificationsSupported =
      'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

    if (!notificationsSupported) {
      console.log('Push notifications not supported on this device/browser');
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const setupNotifications = async () => {
      if (Notification.permission === 'default') {
        timeoutId = setTimeout(async () => {
          try {
            const granted = await pushService.requestPermission();
            if (granted) {
              await pushService.subscribeToPush(selectedMember.id);
              console.log('✓ Push notifications enabled');
            }
          } catch (error) {
            console.error('Failed to enable notifications:', error);
          }
        }, 2000);
      } else if (Notification.permission === 'granted') {
        try {
          await pushService.subscribeToPush(selectedMember.id);
          console.log('✓ Push subscription refreshed');
        } catch (error) {
          console.error('Failed to subscribe to push:', error);
        }
      }
    };

    setupNotifications();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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

  const handleWaterPlant = async (plantId: number) => {
    try {
      await apiService.waterPlant(plantId);
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === plantId ? { ...plant, last_pour: Date.now() / 1000 } : plant,
        ),
      );
      setHistoryRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to water plant:', error);
    }
  };

  const handleCompleteChore = async (choreId: number) => {
    try {
      await apiService.completeChore(choreId);
      setChores((prev) =>
        prev.map((chore) =>
          chore.id === choreId ? { ...chore, last_done: Date.now() / 1000 } : chore,
        ),
      );
      setHistoryRefresh((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to complete chore:', error);
    }
  };

  const handleCompleteOneTimeTask = async (taskId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/one-time-tasks/${taskId}/complete`, {
        method: 'PATCH',
      });

      setOneTimeTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed_at: Math.floor(Date.now() / 1000) } : task,
        ),
      );

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

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getAvatarGradient = () => {
    const name = selectedMember?.name || '';
    if (name === 'Linas') return 'from-indigo-500 to-indigo-700';
    if (name === 'Amelie') return 'from-pink-500 to-pink-700';
    if (name === 'Katrin') return 'from-teal-500 to-teal-700';
    return 'from-amber-500 to-amber-700';
  };

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
    <div className="h-screen w-screen overflow-hidden bg-slate-900">
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
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b border-slate-700 bg-slate-800 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                {/* Left: User Info */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-slate-300 transition-all hover:border-indigo-500 hover:text-white"
                  >
                    <ArrowLeft
                      className="h-5 w-5"
                      strokeWidth={2}
                    />
                  </button>
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient()} text-xl font-semibold text-white shadow-lg`}
                    >
                      {getInitial(selectedMember.name)}
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-lg font-semibold text-slate-100">
                        {selectedMember.name}
                      </h1>
                      <p className="text-sm text-slate-400">Deine Aufgaben</p>
                    </div>
                  </div>
                </div>

                {/* Center: Stats */}
                <div className="hidden items-center gap-6 lg:flex">
                  <div className="flex items-center gap-2">
                    <Sprout
                      className="h-4 w-4 text-teal-400"
                      strokeWidth={2}
                    />
                    <div className="text-lg font-bold text-teal-400">{plants.length}</div>
                    <span className="text-sm text-slate-400">Pflanzen</span>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <ListTodo
                      className="h-4 w-4 text-indigo-400"
                      strokeWidth={2}
                    />
                    <div className="text-lg font-bold text-indigo-400">
                      {chores.length + oneTimeTasks.length}
                    </div>
                    <span className="text-sm text-slate-400">Aufgaben</span>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-pink-500/30 bg-pink-500/10 p-2 text-pink-400 transition-all hover:border-pink-500 hover:bg-pink-500/20 sm:gap-2 sm:px-3"
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
                    className="border-slate-700 bg-slate-900/50 p-2 text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 sm:gap-2 sm:px-3"
                    onClick={() => setManageDialogOpen(true)}
                  >
                    <Settings
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                    <span className="hidden xl:inline">Verwalten</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Carousel */}
            <div className="relative flex-1 overflow-hidden">
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

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 p-10">
        <div className="mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
            <svg
              className="h-12 w-12 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
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

        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold text-slate-100">Alle Aufgaben erledigt!</h2>
          <p className="text-xl text-slate-400">Gute Arbeit!</p>
        </div>

        <div className="mt-6 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold tracking-wide text-emerald-400 uppercase">
          Alles geschafft
        </div>
      </div>
    </div>
  );
}
