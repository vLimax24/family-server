import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, RotateCw, Droplet, ListTodo } from 'lucide-react';
import { FamilyMember, Plant, Chore } from '@/lib/types';
import { apiService } from '@/services/apiService';
import { PlantFormDialog } from '@/components/PlantFormDialog';
import { ChoreFormDialog } from '@/components/ChoreFormDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface ManageTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: FamilyMember;
  familyMembers: FamilyMember[];
  onTasksUpdated: () => void;
}

export function ManageTasksDialog({
  open,
  onOpenChange,
  selectedMember,
  familyMembers,
  onTasksUpdated,
}: ManageTasksDialogProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);

  // Form dialogs
  const [plantFormOpen, setPlantFormOpen] = useState(false);
  const [choreFormOpen, setChoreFormOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plant' | 'chore'; id: number } | null>(
    null,
  );

  const loadTasks = async () => {
    setLoading(true);
    try {
      const memberChores = await apiService.getChoresOfPerson(selectedMember.id);
      const memberPlants = await apiService.getPlantsOfPerson(selectedMember.id);
      setChores(memberChores);
      setPlants(memberPlants);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks
  useEffect(() => {
    if (open) {
      loadTasks();
    }
  }, [open, selectedMember.id]);

  const handleEdit = (type: 'plant' | 'chore', item: Plant | Chore) => {
    if (type === 'plant') {
      setEditingPlant(item as Plant);
      onOpenChange(false); // Close main dialog
      setPlantFormOpen(true); // Open form dialog
    } else {
      setEditingChore(item as Chore);
      onOpenChange(false);
      setChoreFormOpen(true);
    }
  };

  const handleCreate = (type: 'plant' | 'chore') => {
    if (type === 'plant') {
      setEditingPlant(null);
      onOpenChange(false);
      setPlantFormOpen(true);
    } else {
      setEditingChore(null);
      onOpenChange(false);
      setChoreFormOpen(true);
    }
  };

  const handleDeleteClick = (type: 'plant' | 'chore', id: number) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'plant') {
        await apiService.deletePlant(deleteTarget.id);
      } else {
        await apiService.deleteChore(deleteTarget.id);
      }

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      onTasksUpdated();
      loadTasks();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleFormSuccess = () => {
    setPlantFormOpen(false);
    setChoreFormOpen(false);
    setEditingPlant(null);
    setEditingChore(null);
    onTasksUpdated();
    onOpenChange(true); // Reopen main dialog
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Aufgaben verwalten - {selectedMember.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Chores Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-indigo-400 uppercase">
                <ListTodo className="h-4 w-4" />
                Aufgaben
              </div>

              {loading ? (
                <div className="text-muted-foreground py-8 text-center text-sm">Lädt...</div>
              ) : chores.length === 0 ? (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Keine Aufgaben vorhanden
                </div>
              ) : (
                <div className="space-y-2">
                  {chores.map((chore) => (
                    <div
                      key={chore.id}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-3 transition-colors hover:bg-slate-800"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {chore.rotation_enabled === 1 && (
                          <RotateCw className="h-4 w-4 shrink-0 text-indigo-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-100">
                            {chore.name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Alle {chore.interval} {chore.interval === 1 ? 'Tag' : 'Tage'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit('chore', chore)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick('chore', chore.id)}
                          className="h-8 w-8 p-0 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Chore Button */}
              <button
                onClick={() => handleCreate('chore')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-indigo-500/30 bg-indigo-500/10 p-3 text-sm font-medium text-indigo-400 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/20"
              >
                <Plus className="h-4 w-4" />
                Neue Aufgabe erstellen
              </button>
            </div>

            {/* Plants Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-teal-400 uppercase">
                <Droplet className="h-4 w-4" />
                Pflanzen
              </div>

              {loading ? (
                <div className="text-muted-foreground py-8 text-center text-sm">Lädt...</div>
              ) : plants.length === 0 ? (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Keine Pflanzen vorhanden
                </div>
              ) : (
                <div className="space-y-2">
                  {plants.map((plant) => (
                    <div
                      key={plant.id}
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-3 transition-colors hover:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-100">
                          {plant.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Alle {plant.interval} {plant.interval === 1 ? 'Tag' : 'Tage'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit('plant', plant)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick('plant', plant.id)}
                          className="h-8 w-8 p-0 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Plant Button */}
              <button
                onClick={() => handleCreate('plant')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-teal-500/30 bg-teal-500/10 p-3 text-sm font-medium text-teal-400 transition-all hover:border-teal-500/50 hover:bg-teal-500/20"
              >
                <Plus className="h-4 w-4" />
                Neue Pflanze erstellen
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialogs */}
      <PlantFormDialog
        open={plantFormOpen}
        onOpenChange={setPlantFormOpen}
        plant={editingPlant}
        currentMember={selectedMember}
        familyMembers={familyMembers}
        onSuccess={handleFormSuccess}
      />

      <ChoreFormDialog
        open={choreFormOpen}
        onOpenChange={setChoreFormOpen}
        chore={editingChore}
        currentMember={selectedMember}
        familyMembers={familyMembers}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={
          deleteTarget?.type === 'plant'
            ? plants.find((p) => p.id === deleteTarget?.id)?.name
            : chores.find((c) => c.id === deleteTarget?.id)?.name
        }
        itemType={deleteTarget?.type === 'plant' ? 'Pflanze' : 'Aufgabe'}
      />
    </>
  );
}
