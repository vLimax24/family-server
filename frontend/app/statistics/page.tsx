'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, User, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TotalTasksData {
  name: string;
  total_tasks: number;
}

interface TasksByTypeData {
  task_type: string;
  total_tasks: number;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [totalTasksData, setTotalTasksData] = useState<TotalTasksData[]>([]);
  const [tasksByTypeData, setTasksByTypeData] = useState<TasksByTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Fetch total tasks per person
      const totalResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/completions`,
      );
      const totalData = await totalResponse.json();
      setTotalTasksData(totalData);

      // Fetch tasks by type
      const typeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/tasks-by-type`,
      );
      const typeData = await typeResponse.json();
      setTasksByTypeData(typeData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find the person with the most tasks
  const maxTasks = Math.max(...totalTasksData.map((d) => d.total_tasks));

  const chartConfig = {
    total_tasks: {
      label: 'Aufgaben',
      color: '#3b82f6',
    },
  } satisfies ChartConfig;

  // Colors for pie chart
  const COLORS = {
    chore: '#3b82f6', // blue
    plant: '#10b981', // green
    one_time: '#a855f7', // purple
  };

  // Transform data for pie chart with German labels
  const pieChartData = tasksByTypeData.map((item) => ({
    name:
      item.task_type === 'chore'
        ? 'Aufgaben'
        : item.task_type === 'plant'
          ? 'Pflanzen'
          : 'Einmalig',
    value: item.total_tasks,
    type: item.task_type,
    fill: COLORS[item.task_type as keyof typeof COLORS],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="h-9 w-9 shrink-0 rounded-lg hover:cursor-pointer sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                Statistiken
              </h1>
              <p className="hidden text-sm text-gray-600 sm:block">
                Übersicht über erledigte Aufgaben
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Tabs
          defaultValue="family"
          className="space-y-4 sm:space-y-6"
        >
          {/* Tab Selector */}
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 p-1">
            <TabsTrigger
              value="family"
              className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Familie</span>
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Persönlich</span>
            </TabsTrigger>
          </TabsList>

          {/* Family Statistics */}
          <TabsContent
            value="family"
            className="space-y-4 sm:space-y-6"
          >
            {/* Total Tasks Chart */}
            <Card>
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" />
                  <span className="line-clamp-2">Erledigte Aufgaben pro Person</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Gesamtanzahl aller erledigten Aufgaben (Pflanzen, Aufgaben, Einmalige)
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {loading ? (
                  <div className="flex h-64 items-center justify-center sm:h-80">
                    <p className="text-muted-foreground text-sm">Laden...</p>
                  </div>
                ) : totalTasksData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center sm:h-80">
                    <p className="text-muted-foreground text-center text-sm">
                      Noch keine Daten vorhanden
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="h-64 w-full sm:h-80"
                  >
                    <BarChart data={totalTasksData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="total_tasks"
                        radius={[8, 8, 0, 0]}
                      >
                        {totalTasksData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={chartConfig.total_tasks.color}
                            fillOpacity={entry.total_tasks === maxTasks ? 1 : 0.4}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Placeholder for future family metrics */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Task Type Distribution - Pie Chart */}
              <Card>
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                  <CardTitle className="text-base sm:text-lg">Aufgabenverteilung</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Anteil der verschiedenen Aufgabentypen
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {loading ? (
                    <div className="flex h-64 items-center justify-center sm:h-80">
                      <p className="text-muted-foreground text-sm">Laden...</p>
                    </div>
                  ) : tasksByTypeData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center sm:h-80">
                      <p className="text-muted-foreground text-center text-sm">
                        Noch keine Daten vorhanden
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-auto min-h-64 flex-col items-center justify-center gap-4 sm:h-80 sm:flex-row sm:justify-between sm:gap-8">
                      {/* Pie Chart */}
                      <div className="flex w-full shrink-0 items-center justify-center sm:w-auto sm:flex-1">
                        <PieChart
                          width={Math.min(
                            280,
                            typeof window !== 'undefined' ? window.innerWidth - 80 : 280,
                          )}
                          height={280}
                        >
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </div>

                      {/* Stats Panel */}
                      <div className="flex w-full flex-col gap-3 sm:w-auto sm:gap-4 sm:pr-4">
                        {pieChartData.map((item) => (
                          <div
                            key={item.type}
                            className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3 sm:gap-4 sm:p-4"
                          >
                            <div
                              className="h-3 w-3 shrink-0 rounded-full sm:h-4 sm:w-4"
                              style={{ backgroundColor: item.fill }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium sm:text-sm">{item.name}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xl font-bold sm:text-2xl">{item.value}</p>
                              <p className="text-muted-foreground text-[10px] sm:text-xs">
                                Aufgaben
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                  <CardTitle className="text-muted-foreground text-base sm:text-lg">
                    Weitere Metriken
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Werden bald hinzugefügt...
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex h-40 items-center justify-center sm:h-48">
                  <p className="text-muted-foreground text-center text-xs sm:text-sm">
                    Platz für neue Statistiken
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Statistics */}
          <TabsContent
            value="personal"
            className="space-y-4 sm:space-y-6"
          >
            <Card className="border-dashed">
              <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                <CardTitle className="text-muted-foreground text-base sm:text-lg">
                  Persönliche Statistiken
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Werden bald hinzugefügt...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center sm:h-96">
                <div className="text-center">
                  <User className="text-muted-foreground/50 mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                  <p className="text-muted-foreground mt-4 px-4 text-xs sm:text-sm">
                    Persönliche Metriken wie Streaks, Completion Rate, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
