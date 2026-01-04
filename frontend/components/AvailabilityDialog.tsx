import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FamilyMember } from '@/lib/types';
import { Switch } from './ui/switch';
import { ChevronDownIcon, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SetAvailability } from '@/lib/types';
import { apiService } from '@/services/apiService';

export const AvailabilityDialog = (props: {
  member: FamilyMember;
  onAvailabilityChange: (memberId: number, newAvailability: number) => void;
}) => {
  const [advanced, setAdvanced] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [availabiltyState, setAvailabilityState] = useState<number>(props.member.is_available);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const convertToUnixTimestamp = (date: Date) => {
    return Math.floor(new Date(date).getTime() / 1000);
  };

  const submitAvailabilityForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const unavailable_since = advanced
      ? startDate
        ? convertToUnixTimestamp(startDate)
        : null
      : null;
    const unavailable_until = advanced ? (endDate ? convertToUnixTimestamp(endDate) : null) : null;

    const data: SetAvailability = {
      person_id: props.member.id,
      is_available: availabiltyState,
      unavailable_since: unavailable_since,
      unavailable_until: unavailable_until,
    };

    try {
      await apiService.setAvailability(data);
      props.onAvailabilityChange(props.member.id, availabiltyState);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full border border-slate-200/60 bg-white/50 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          Verfügbarkeit ändern
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={submitAvailabilityForm}>
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl">Verfügbarkeit für {props.member.name}</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Lege fest, ob {props.member.name} verfügbar ist oder nicht. Bei Abwesenheit können
              Aufgaben automatisch umverteilt werden.
            </p>
          </DialogHeader>

          <Tabs
            defaultValue={props.member.is_available == 0 ? 'unavailable' : 'available'}
            className="w-full"
            onValueChange={(value) => {
              setAvailabilityState(value === 'unavailable' ? 0 : 1);
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Verfügbar</TabsTrigger>
              <TabsTrigger value="unavailable">Abwesend</TabsTrigger>
            </TabsList>

            <TabsContent
              value="available"
              className="space-y-4 pt-6"
            >
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-sm text-emerald-900">
                  ✓ {props.member.name} ist verfügbar und erhält alle zugewiesenen Aufgaben.
                </p>
              </div>
            </TabsContent>

            <TabsContent
              value="unavailable"
              className="space-y-6 pt-6"
            >
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm text-amber-900">
                  ⚠ Alle nicht-rotierenden Aufgaben werden automatisch an verfügbare Personen
                  umverteilt.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="advanced"
                      className="text-base font-medium"
                    >
                      Zeitraum festlegen
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Optional: Start- und Enddatum der Abwesenheit
                    </p>
                  </div>
                  <Switch
                    id="advanced"
                    checked={advanced}
                    onCheckedChange={setAdvanced}
                  />
                </div>

                {advanced && (
                  <div className="bg-card space-y-4 rounded-lg border p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Startdatum</Label>
                        <Popover
                          open={startDateOpen}
                          onOpenChange={setStartDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? (
                                startDate.toLocaleDateString('de-DE', {
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
                              selected={startDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                setStartDate(date);
                                setStartDateOpen(false);
                              }}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Enddatum</Label>
                        <Popover
                          open={endDateOpen}
                          onOpenChange={setEndDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? (
                                endDate.toLocaleDateString('de-DE', {
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
                              selected={endDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                setEndDate(date);
                                setEndDateOpen(false);
                              }}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                (startDate ? date < startDate : false)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 grid-cols-1 gap-2 sm:grid sm:grid-cols-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                Abbrechen
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="w-full"
            >
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
