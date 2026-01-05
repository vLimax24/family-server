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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FamilyMember, Plant } from '@/lib/types';
import { apiService } from '@/services/apiService';

interface PlantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant | null;
  currentMember: FamilyMember;
  familyMembers: FamilyMember[];
  onSuccess: () => void;
}

export function PlantFormDialog({
  open,
  onOpenChange,
  plant,
  currentMember,
  familyMembers,
  onSuccess,
}: PlantFormDialogProps) {
  const [name, setName] = useState('');
  const [interval, setInterval] = useState('3');
  const [ownerId, setOwnerId] = useState(currentMember.id.toString());
  const [loading, setLoading] = useState(false);

  const isEditing = !!plant;

  // Reset form when dialog opens/closes or plant changes
  useEffect(() => {
    if (open) {
      if (plant) {
        setName(plant.name);
        setInterval(plant.interval.toString());
        setOwnerId(plant.owner_id.toString());
      } else {
        setName('');
        setInterval('3');
        setOwnerId(currentMember.id.toString());
      }
    }
  }, [open, plant, currentMember.id]);

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

    setLoading(true);
    try {
      if (isEditing) {
        await apiService.updatePlant(plant.id, {
          name: name.trim(),
          interval: intervalNum,
          owner_id: parseInt(ownerId),
        });
      } else {
        await apiService.createPlant({
          name: name.trim(),
          interval: intervalNum,
          owner_id: parseInt(ownerId),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save plant:', error);
      alert('Fehler beim Speichern der Pflanze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl">
              {isEditing ? 'Pflanze bearbeiten' : 'Neue Pflanze erstellen'}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {isEditing
                ? 'Ändere die Details deiner Pflanze.'
                : 'Füge eine neue Pflanze hinzu, die regelmäßig gegossen werden muss.'}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Plant Name */}
            <div className="space-y-2">
              <Label htmlFor="plant-name">Name der Pflanze *</Label>
              <Input
                id="plant-name"
                placeholder="z.B. Monstera im Wohnzimmer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Watering Interval */}
            <div className="space-y-2">
              <Label htmlFor="plant-interval">Gießintervall (Tage) *</Label>
              <Input
                id="plant-interval"
                type="number"
                min="1"
                placeholder="z.B. 3"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Wie oft soll die Pflanze gegossen werden?
              </p>
            </div>

            {/* Owner Selection */}
            <div className="space-y-2">
              <Label htmlFor="plant-owner">Verantwortliche Person *</Label>
              <Select
                value={ownerId}
                onValueChange={setOwnerId}
              >
                <SelectTrigger id="plant-owner">
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
