'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, User, TrendingUp, Flame, Target, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  Label,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface TotalTasksData {
  name: string;
  total_tasks: number;
}

interface TasksByTypeData {
  task_type: string;
  total_tasks: number;
}

interface WeeklyTrendData {
  week: string;
  task_count: number;
}

interface StreakData {
  person_id: number;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
}

interface CompletionRateData {
  person_id: number;
  total_completed: number;
  on_time: number;
  overdue: number;
  on_time_percentage: number;
  overdue_percentage: number;
}

interface Person {
  id: number;
  name: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [totalTasksData, setTotalTasksData] = useState<TotalTasksData[]>([]);
  const [tasksByTypeData, setTasksByTypeData] = useState<TasksByTypeData[]>([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState<WeeklyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  // Personal stats
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [completionRate, setCompletionRate] = useState<CompletionRateData | null>(null);
  const [personalWeeklyTrend, setPersonalWeeklyTrend] = useState<WeeklyTrendData[]>([]);
  const [personalLoading, setPersonalLoading] = useState(false);

  useEffect(() => {
    loadFamilyStatistics();
    loadPersons();
  }, []);

  useEffect(() => {
    if (selectedPersonId) {
      loadPersonalStatistics(selectedPersonId);
    }
  }, [selectedPersonId]);

  const loadPersons = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/persons`);
      const data = await response.json();
      setPersons(data);
      if (data.length > 0) {
        setSelectedPersonId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  };

  const loadFamilyStatistics = async () => {
    try {
      setLoading(true);

      const totalResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/completions`,
      );
      const totalData = await totalResponse.json();
      setTotalTasksData(totalData);

      const typeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/tasks-by-type`,
      );
      const typeData = await typeResponse.json();
      setTasksByTypeData(typeData);

      const trendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/weekly-trend`,
      );
      const trendData = await trendResponse.json();
      setWeeklyTrendData(trendData);
    } catch (error) {
      console.error('Failed to load family statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalStatistics = async (personId: number) => {
    try {
      setPersonalLoading(true);

      const streakResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/personal-streak/${personId}`,
      );
      const streakData = await streakResponse.json();
      setStreakData(streakData);

      const rateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/completion-rate/${personId}`,
      );
      const rateData = await rateResponse.json();
      setCompletionRate(rateData);

      const trendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/statistics/weekly-trend?person_id=${personId}`,
      );
      const trendData = await trendResponse.json();
      setPersonalWeeklyTrend(trendData);
    } catch (error) {
      console.error('Failed to load personal statistics:', error);
    } finally {
      setPersonalLoading(false);
    }
  };

  const maxTasks = Math.max(...totalTasksData.map((d) => d.total_tasks));

  const chartConfig = {
    total_tasks: {
      label: 'Aufgaben',
      color: '#6366f1',
    },
    task_count: {
      label: 'Aufgaben',
      color: '#6366f1',
    },
  } satisfies ChartConfig;

  const COLORS = {
    chore: '#6366f1',
    plant: '#14b8a6',
    one_time: '#ec4899',
  };

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

  const totalTasks = useMemo(() => {
    return pieChartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieChartData]);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700',
      'from-amber-500 to-amber-700',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-slate-900 pt-5 pb-10 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-10 w-10 shrink-0 rounded-lg border bg-slate-800 text-slate-300 hover:cursor-pointer hover:border-indigo-500 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Statistiken</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="family"
          className="space-y-6"
        >
          {/* Tab Selector */}
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-2 bg-slate-800 p-1">
            <TabsTrigger
              value="family"
              className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 text-white" />
              <span className="text-white">Familie</span>
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 text-white" />
              <span className="text-white">Persönlich</span>
            </TabsTrigger>
          </TabsList>

          {/* Family Statistics */}
          <TabsContent
            value="family"
            className="space-y-6"
          >
            {/* Total Tasks Chart */}
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
              <div className="border-b border-slate-700 p-6">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-slate-100">
                    Erledigte Aufgaben pro Person
                  </h3>
                </div>
                <p className="text-sm text-slate-400">
                  Gesamtanzahl aller erledigten Aufgaben (Pflanzen, Aufgaben, Einmalige)
                </p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex h-80 items-center justify-center">
                    <Skeleton className="h-full w-full bg-slate-700" />
                  </div>
                ) : totalTasksData.length === 0 ? (
                  <div className="flex h-80 items-center justify-center">
                    <p className="text-slate-500">Noch keine Daten vorhanden</p>
                  </div>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="h-80 w-full"
                  >
                    <BarChart data={totalTasksData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <YAxis
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={false}
                      />
                      <Bar
                        dataKey="total_tasks"
                        radius={[8, 8, 0, 0]}
                      >
                        {totalTasksData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={chartConfig.total_tasks.color}
                            fillOpacity={entry.total_tasks === maxTasks ? 1 : 0.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Task Type Distribution - Donut Chart */}
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                <div className="border-b border-slate-700 p-6">
                  <h3 className="mb-2 text-lg font-semibold text-slate-100">Aufgabenverteilung</h3>
                  <p className="text-sm text-slate-400">Anteil der verschiedenen Aufgabentypen</p>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex h-80 items-center justify-center">
                      <Skeleton className="h-full w-full bg-slate-700" />
                    </div>
                  ) : tasksByTypeData.length === 0 ? (
                    <div className="flex h-80 items-center justify-center">
                      <p className="text-slate-500">Noch keine Daten vorhanden</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6">
                      <div className="mx-auto">
                        <PieChart
                          width={280}
                          height={280}
                        >
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            itemStyle={{
                              color: '#f1f5f9',
                            }}
                            labelStyle={{
                              color: '#f1f5f9',
                            }}
                          />
                          <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            strokeWidth={5}
                            stroke="#1e293b"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.fill}
                              />
                            ))}
                            <Label
                              content={({ viewBox }) => {
                                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                  return (
                                    <text
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                    >
                                      <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-slate-100 text-4xl font-bold"
                                      >
                                        {totalTasks.toLocaleString()}
                                      </tspan>
                                      <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy || 0) + 28}
                                        className="fill-slate-400 text-sm"
                                      >
                                        Gesamt
                                      </tspan>
                                    </text>
                                  );
                                }
                              }}
                            />
                          </Pie>
                        </PieChart>
                      </div>

                      <div className="w-full space-y-3">
                        {pieChartData.map((item) => (
                          <div
                            key={item.type}
                            className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3"
                          >
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-200">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-slate-100">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                <div className="border-b border-slate-700 p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-slate-100">Wöchentlicher Verlauf</h3>
                  </div>
                  <p className="text-sm text-slate-400">Aufgaben der letzten 12 Wochen</p>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="flex h-80 items-center justify-center">
                      <Skeleton className="h-full w-full bg-slate-700" />
                    </div>
                  ) : weeklyTrendData.length === 0 ? (
                    <div className="flex h-80 items-center justify-center">
                      <p className="text-slate-500">Noch keine Daten vorhanden</p>
                    </div>
                  ) : (
                    <ChartContainer
                      config={chartConfig}
                      className="h-80 w-full"
                    >
                      <LineChart data={weeklyTrendData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                        />
                        <XAxis
                          dataKey="week"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                        />
                        <YAxis
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="task_count"
                          stroke={chartConfig.task_count.color}
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#6366f1' }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Personal Statistics */}
          <TabsContent
            value="personal"
            className="space-y-6"
          >
            {/* Person Selector */}
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-100">Person auswählen</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {persons.map((person, index) => (
                  <button
                    key={person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`group flex flex-col items-center gap-3 rounded-xl border p-4 transition-all ${
                      selectedPersonId === person.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-900/50 hover:border-indigo-400'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(index)} text-lg font-semibold text-white shadow-lg`}
                    >
                      {getInitial(person.name)}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{person.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPersonId && (
              <>
                {/* Streak Cards */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                    <div className="border-b border-slate-700 p-6">
                      <div className="mb-2 flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold text-slate-100">Aktuelle Serie</h3>
                      </div>
                      <p className="text-sm text-slate-400">
                        Tage in Folge mit erledigten Aufgaben
                      </p>
                    </div>
                    <div className="p-6">
                      {personalLoading ? (
                        <Skeleton className="mx-auto h-20 w-32 bg-slate-700" />
                      ) : (
                        <div className="text-center">
                          <div className="mb-2 text-6xl font-bold text-orange-500">
                            {streakData?.current_streak || 0}
                          </div>
                          <p className="text-sm text-slate-400">
                            {streakData?.current_streak === 1 ? 'Tag' : 'Tage'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                    <div className="border-b border-slate-700 p-6">
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-slate-100">Längste Serie</h3>
                      </div>
                      <p className="text-sm text-slate-400">Rekord an aufeinanderfolgenden Tagen</p>
                    </div>
                    <div className="p-6">
                      {personalLoading ? (
                        <Skeleton className="mx-auto h-20 w-32 bg-slate-700" />
                      ) : (
                        <div className="text-center">
                          <div className="mb-2 text-6xl font-bold text-indigo-500">
                            {streakData?.longest_streak || 0}
                          </div>
                          <p className="text-sm text-slate-400">
                            {streakData?.longest_streak === 1 ? 'Tag' : 'Tage'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                  <div className="border-b border-slate-700 p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-teal-400" />
                      <h3 className="text-lg font-semibold text-slate-100">Abschlussrate</h3>
                    </div>
                    <p className="text-sm text-slate-400">Pünktlich vs. Überfällig</p>
                  </div>
                  <div className="p-6">
                    {personalLoading ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-32 bg-slate-700" />
                        <Skeleton className="h-32 bg-slate-700" />
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-6">
                          <div className="mb-2 text-sm font-medium text-teal-400">Pünktlich</div>
                          <div className="mb-1 text-4xl font-bold text-teal-500">
                            {completionRate?.on_time || 0}
                          </div>
                          <div className="text-xs text-teal-400">
                            {completionRate?.on_time_percentage.toFixed(1)}% aller Aufgaben
                          </div>
                        </div>
                        <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-6">
                          <div className="mb-2 text-sm font-medium text-pink-400">Überfällig</div>
                          <div className="mb-1 text-4xl font-bold text-pink-500">
                            {completionRate?.overdue || 0}
                          </div>
                          <div className="text-xs text-pink-400">
                            {completionRate?.overdue_percentage.toFixed(1)}% aller Aufgaben
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Weekly Trend */}
                <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                  <div className="border-b border-slate-700 p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-400" />
                      <h3 className="text-lg font-semibold text-slate-100">
                        Persönlicher Wochenverlauf
                      </h3>
                    </div>
                    <p className="text-sm text-slate-400">Deine Aufgaben der letzten 12 Wochen</p>
                  </div>
                  <div className="p-6">
                    {personalLoading ? (
                      <div className="flex h-80 items-center justify-center">
                        <Skeleton className="h-full w-full bg-slate-700" />
                      </div>
                    ) : personalWeeklyTrend.length === 0 ? (
                      <div className="flex h-80 items-center justify-center">
                        <p className="text-slate-500">Noch keine Daten vorhanden</p>
                      </div>
                    ) : (
                      <ChartContainer
                        config={chartConfig}
                        className="h-80 w-full"
                      >
                        <LineChart data={personalWeeklyTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#334155"
                          />
                          <XAxis
                            dataKey="week"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <YAxis
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="task_count"
                            stroke={chartConfig.task_count.color}
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#6366f1' }}
                          />
                        </LineChart>
                      </ChartContainer>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
