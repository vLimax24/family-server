import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { FamilyMember } from '@/lib/types';
import { apiService } from '@/services/apiService';

interface CreateOneTimeTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMember: FamilyMember;
  familyMembers: FamilyMember[];
  onSuccess: () => void;
}

export function CreateOneTimeTaskDialog({
  open,
  onOpenChange,
  currentMember,
  familyMembers,
  onSuccess,
}: CreateOneTimeTaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentMember.id.toString());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Bitte einen Namen eingeben');
      return;
    }

    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/one-time-tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          assigned_to: parseInt(assignedTo),
          created_by: currentMember.id,
          due_date: dueDate ? Math.floor(dueDate.getTime() / 1000) : null,
          priority,
        }),
      });

      // Reset form
      setName('');
      setDescription('');
      setAssignedTo(currentMember.id.toString());
      setPriority('medium');
      setDueDate(undefined);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Fehler beim Erstellen der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-137.5">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl">Einmalige Aufgabe erstellen</DialogTitle>
            <DialogDescription>
              Erstelle eine Aufgabe für eine einmalige Tätigkeit wie z.B. &quot;Extra viel Geschirr
              spülen&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="task-name">Aufgabenname *</Label>
              <Input
                id="task-name"
                placeholder="z.B. Extra Geschirr spülen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="task-description">Beschreibung (optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Zusätzliche Details zur Aufgabe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assigned-to">Zugewiesen an *</Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
              >
                <SelectTrigger id="assigned-to">
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

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Fälligkeitsdatum (optional)</Label>
              <Popover
                open={dueDateOpen}
                onOpenChange={setDueDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      dueDate.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    ) : (
                      <span className="text-muted-foreground">Datum wählen</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setDueDateOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDueDate(undefined)}
                  className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs"
                >
                  Datum entfernen
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              {loading ? 'Erstellt...' : 'Aufgabe erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
