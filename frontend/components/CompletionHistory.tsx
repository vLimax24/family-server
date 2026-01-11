import { useState, useEffect } from 'react';
import { CheckCircle2, Droplet, Clock, RotateCw, History, Zap } from 'lucide-react';
import { apiService } from '@/services/apiService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompletionRecord {
  id: number;
  name: string;
  completed_at: number;
  task_type: 'plant' | 'chore' | 'one_time';
  rotation_enabled: number;
}

interface CompletionHistoryProps {
  personId: number;
  refreshTrigger?: number;
}

export default function CompletionHistory({ personId, refreshTrigger }: CompletionHistoryProps) {
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTodayCompletionHistory(personId);
      setCompletions(data);
    } catch (error) {
      console.error('Failed to load completion history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [personId, refreshTrigger]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp * 1000) / 1000);

    if (diff < 60) return 'Gerade eben';
    if (diff < 3600) return `Vor ${Math.floor(diff / 60)} Min.`;
    return `Vor ${Math.floor(diff / 3600)} Std.`;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="relative flex items-center gap-2 border-slate-200 bg-white/80 text-slate-700 backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900"
        >
          <History
            className="h-4 w-4"
            strokeWidth={2}
          />
          <span className="hidden sm:inline">Verlauf</span>
          {completions.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full bg-emerald-500 px-1.5 text-xs text-white hover:bg-emerald-600"
            >
              {completions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            Heute erledigt
          </SheetTitle>
          <SheetDescription>Alle Aufgaben, die du heute abgeschlossen hast</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground text-sm">Lade Verlauf...</div>
          </div>
        ) : completions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="rounded-full bg-slate-100 p-4">
              <CheckCircle2
                className="h-8 w-8 text-slate-400"
                strokeWidth={2}
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-900">Noch keine Aufgaben erledigt</p>
              <p className="text-muted-foreground text-sm">Erledigte Aufgaben erscheinen hier</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
            <div className="space-y-3 px-4">
              {completions.map((completion, index) => (
                <div
                  key={`${completion.task_type}-${completion.id}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  {/* Completion indicator line */}
                  <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500" />

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 transition-colors group-hover:bg-emerald-200">
                      {completion.task_type === 'plant' ? (
                        <Droplet
                          className="h-5 w-5 text-emerald-600"
                          strokeWidth={2}
                        />
                      ) : completion.task_type === 'one_time' ? (
                        <Zap
                          className="h-5 w-5 text-purple-600"
                          strokeWidth={2}
                        />
                      ) : (
                        <CheckCircle2
                          className="h-5 w-5 text-emerald-600"
                          strokeWidth={2}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">{completion.name}</h4>
                        <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700">
                          <Clock
                            className="h-3 w-3"
                            strokeWidth={2}
                          />
                          {formatTime(completion.completed_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {completion.task_type === 'plant'
                            ? 'Pflanze'
                            : completion.task_type === 'one_time'
                              ? 'Einmalig'
                              : 'Aufgabe'}
                        </Badge>

                        {completion.rotation_enabled === 1 && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs"
                          >
                            <RotateCw className="h-3 w-3" />
                            Rotation
                          </Badge>
                        )}

                        <span className="text-muted-foreground text-xs">
                          {getTimeAgo(completion.completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Summary Footer */}
        {completions.length > 0 && (
          <div className="absolute right-0 bottom-0 left-0 border-t bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Gesamt: </span>
                <span className="font-semibold text-slate-900">
                  {completions.length} {completions.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                </span>
              </div>
              <CheckCircle2
                className="h-5 w-5 text-emerald-600"
                strokeWidth={2}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
