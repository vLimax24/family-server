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

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'plant':
        return {
          bg: 'bg-teal-500/10',
          hoverBg: 'group-hover:bg-teal-500/20',
          icon: 'text-teal-400',
          badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        };
      case 'one_time':
        return {
          bg: 'bg-purple-500/10',
          hoverBg: 'group-hover:bg-purple-500/20',
          icon: 'text-purple-400',
          badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
      default:
        return {
          bg: 'bg-indigo-500/10',
          hoverBg: 'group-hover:bg-indigo-500/20',
          icon: 'text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        };
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative flex items-center gap-2 border-slate-700 bg-slate-900/50 text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"
        >
          <History
            className="h-4 w-4"
            strokeWidth={2}
          />
          <span className="hidden sm:inline">Verlauf</span>
          {completions.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-4 min-w-5 rounded-full bg-teal-500 px-1.5 text-xs text-white hover:bg-teal-600"
            >
              {completions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full border-slate-700 bg-slate-800 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-slate-100">
            <History className="h-5 w-5 text-teal-400" />
            Heute erledigt
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Alle Aufgaben, die du heute abgeschlossen hast
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-slate-400">Lade Verlauf...</div>
          </div>
        ) : completions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="rounded-full bg-slate-700 p-4">
              <CheckCircle2
                className="h-8 w-8 text-slate-500"
                strokeWidth={2}
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-100">Noch keine Aufgaben erledigt</p>
              <p className="text-sm text-slate-400">Erledigte Aufgaben erscheinen hier</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
            <div className="space-y-3 pr-4">
              {completions.map((completion, index) => {
                const colors = getTaskTypeColor(completion.task_type);
                return (
                  <div
                    key={`${completion.task_type}-${completion.id}-${index}`}
                    className="group relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800"
                  >
                    {/* Completion indicator line */}
                    <div
                      className={`absolute top-0 left-0 h-full w-1 ${completion.task_type === 'plant' ? 'bg-teal-500' : completion.task_type === 'one_time' ? 'bg-purple-500' : 'bg-indigo-500'}`}
                    />

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg} transition-colors ${colors.hoverBg}`}
                      >
                        {completion.task_type === 'plant' ? (
                          <Droplet
                            className={`h-5 w-5 ${colors.icon}`}
                            strokeWidth={2}
                          />
                        ) : completion.task_type === 'one_time' ? (
                          <Zap
                            className={`h-5 w-5 ${colors.icon}`}
                            strokeWidth={2}
                          />
                        ) : (
                          <CheckCircle2
                            className={`h-5 w-5 ${colors.icon}`}
                            strokeWidth={2}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-100">{completion.name}</h4>
                          <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-teal-400">
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
                            className={`text-xs ${colors.badge}`}
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
                              className="gap-1 border-slate-600 text-xs text-slate-400"
                            >
                              <RotateCw className="h-3 w-3" />
                              Rotation
                            </Badge>
                          )}

                          <span className="text-xs text-slate-500">
                            {getTimeAgo(completion.completed_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary Footer */}
        {completions.length > 0 && (
          <div className="absolute right-0 bottom-0 left-0 border-t border-slate-700 bg-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-slate-400">Gesamt: </span>
                <span className="font-semibold text-slate-100">
                  {completions.length} {completions.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                </span>
              </div>
              <CheckCircle2
                className="h-5 w-5 text-teal-400"
                strokeWidth={2}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
