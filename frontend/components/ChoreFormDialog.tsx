import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FamilyMember, Chore } from '@/lib/types';
import { apiService } from '@/services/apiService';

interface ChoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chore: Chore | null;
  currentMember: FamilyMember;
  familyMembers: FamilyMember[];
  onSuccess: () => void;
}

export function ChoreFormDialog({
  open,
  onOpenChange,
  chore,
  currentMember,
  familyMembers,
  onSuccess,
}: ChoreFormDialogProps) {
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('7');
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [workerId, setWorkerId] = useState(currentMember.id.toString());
  const [rotationMembers, setRotationMembers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditing = !!chore;

  // Reset form when dialog opens/closes or chore changes
  useEffect(() => {
    if (open) {
      if (chore) {
        setName(chore.name);
        setInterval(chore.interval.toString());
        setRotationEnabled(chore.rotation_enabled === 1);
        setWorkerId(chore.worker_id?.toString() || currentMember.id.toString());

        // Parse rotation order
        if (chore.rotation_enabled === 1 && chore.rotation_order) {
          try {
            const rotationList = JSON.parse(chore.rotation_order);
            setRotationMembers(rotationList);
          } catch (e) {
            setRotationMembers([]);
            console.error(e);
          }
        } else {
          setRotationMembers([]);
        }
      } else {
        setName('');
        setInterval('7');
        setRotationEnabled(false);
        setWorkerId(currentMember.id.toString());
        setRotationMembers([]);
      }
    }
  }, [open, chore, currentMember.id]);

  const handleRotationToggle = (checked: boolean) => {
    setRotationEnabled(checked);
    if (checked && rotationMembers.length === 0) {
      // Pre-select current member when enabling rotation
      setRotationMembers([currentMember.id]);
    }
  };

  const handleMemberToggle = (memberId: number, checked: boolean) => {
    if (checked) {
      setRotationMembers([...rotationMembers, memberId]);
    } else {
      setRotationMembers(rotationMembers.filter((id) => id !== memberId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Bitte einen Namen eingeben');
      return;
    }

    const intervalNum = parseInt(interval);
    if (isNaN(intervalNum) || intervalNum < 1) {
      alert('Bitte ein gültiges Intervall eingeben (mindestens 1 Tag)');
      return;
    }

    if (rotationEnabled && rotationMembers.length === 0) {
      alert('Bitte mindestens eine Person für die Rotation auswählen');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        interval: intervalNum,
        rotation_enabled: rotationEnabled ? 1 : 0,
        rotation_order: rotationEnabled ? JSON.stringify(rotationMembers) : null,
        worker_id: rotationEnabled ? null : parseInt(workerId),
      };

      if (isEditing) {
        await apiService.updateChore(chore.id, data);
      } else {
        await apiService.createChore(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save chore:', error);
      alert('Fehler beim Speichern der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-137.5">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl">
              {isEditing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {isEditing
                ? 'Ändere die Details deiner Aufgabe.'
                : 'Füge eine neue wiederkehrende Aufgabe hinzu.'}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Chore Name */}
            <div className="space-y-2">
              <Label htmlFor="chore-name">Name der Aufgabe *</Label>
              <Input
                id="chore-name"
                placeholder="z.B. Müll rausbringen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Interval */}
            <div className="space-y-2">
              <Label htmlFor="chore-interval">Intervall (Tage) *</Label>
              <Input
                id="chore-interval"
                type="number"
                min="1"
                placeholder="z.B. 7"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Wie oft soll die Aufgabe erledigt werden?
              </p>
            </div>

            {/* Rotation Toggle */}
            <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="rotation-toggle"
                    className="text-base font-medium"
                  >
                    Rotation aktivieren
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Die Aufgabe wechselt zwischen ausgewählten Personen
                  </p>
                </div>
                <Switch
                  id="rotation-toggle"
                  checked={rotationEnabled}
                  onCheckedChange={handleRotationToggle}
                />
              </div>

              {/* Rotation Member Selection */}
              {rotationEnabled && (
                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium">Personen in Rotation *</Label>
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-background flex items-center space-x-3 rounded-md border p-3"
                      >
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={rotationMembers.includes(member.id)}
                          onCheckedChange={(checked) =>
                            handleMemberToggle(member.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`member-${member.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {member.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Wähle die Reihenfolge durch Klicken aus. Die Aufgabe rotiert automatisch.
                  </p>
                </div>
              )}

              {/* Single Worker Selection */}
              {!rotationEnabled && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="chore-worker">Verantwortliche Person *</Label>
                  <Select
                    value={workerId}
                    onValueChange={setWorkerId}
                  >
                    <SelectTrigger id="chore-worker">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id.toString()}
                        >
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Speichert...' : isEditing ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
