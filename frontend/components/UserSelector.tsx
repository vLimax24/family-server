import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AvailabilityDialog } from './AvailabilityDialog';
import { FamilyMember } from '@/lib/types';
import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, BarChart3, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';

interface UserSelectorProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
  onMemberAvailabilityChange: (memberId: number, newAvailability: number) => void;
}

interface MemberData {
  plants: number;
  chores: number;
  loading: boolean;
}

export function UserSelector({
  members,
  onSelectMember,
  onMemberAvailabilityChange,
}: UserSelectorProps) {
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(members);
  const [memberData, setMemberData] = useState<Record<number, MemberData>>({});

  useEffect(() => {
    setFamilyMembers(members);
  }, [members]);

  useEffect(() => {
    // Fetch data for all members
    const fetchMemberData = async () => {
      for (const member of familyMembers) {
        setMemberData((prev) => ({
          ...prev,
          [member.id]: { plants: 0, chores: 0, loading: true },
        }));

        try {
          const { plants, chores } = await apiService.getDashboardData(member.id);
          setMemberData((prev) => ({
            ...prev,
            [member.id]: {
              plants: plants?.length || 0,
              chores: chores?.length || 0,
              loading: false,
            },
          }));
        } catch (error) {
          console.error(`Error fetching data for member ${member.id}:`, error);
          setMemberData((prev) => ({
            ...prev,
            [member.id]: { plants: 0, chores: 0, loading: false },
          }));
        }
      }
    };

    if (familyMembers.length > 0) {
      fetchMemberData();
    }
  }, [familyMembers]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const handleAvailabilityChange = (memberId: number, newAvailability: number) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, is_available: newAvailability } : member,
      ),
    );

    onMemberAvailabilityChange(memberId, newAvailability);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-indigo-500 to-indigo-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700',
      'from-amber-500 to-amber-700',
    ];
    return gradients[index % gradients.length];
  };

  const getMemberStats = (memberId: number) => {
    const data = memberData[memberId];
    if (!data) return { plants: 0, chores: 0, loading: true };
    return data;
  };

  const formatCount = (count: number, singular: string, plural: string) => {
    if (count === 0) return '-';
    if (count === 1) return `1 ${singular}`;
    return `${count} ${plural}`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 p-5 sm:p-8 lg:p-10">
      <div className="mx-auto w-full max-w-7xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1
            className="pt-3 pb-1 text-4xl font-semibold text-white sm:text-5xl"
            suppressHydrationWarning
          >
            {getGreeting()}
          </h1>
          <p className="text-lg text-slate-400">FamilyOS - Dashboard</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => router.push('/shopping-list')}
            className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:scale-[1.02] hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/30"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-teal-500 to-teal-700"></div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-teal-700 transition-transform group-hover:scale-110">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="mb-1 text-base font-semibold text-slate-100">Einkaufsliste</h3>
              <p className="text-sm text-slate-400">Gemeinsame Liste verwalten</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/calendar')}
            className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:scale-[1.02] hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/30"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-amber-500 to-amber-700"></div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-amber-700 transition-transform group-hover:scale-110">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="mb-1 text-base font-semibold text-slate-100">Kalender</h3>
              <p className="text-sm text-slate-400">Familienkalender ansehen</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/statistics')}
            className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:scale-[1.02] hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/30"
          >
            <div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-pink-500 to-pink-700"></div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-pink-500 to-pink-700 transition-transform group-hover:scale-110">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="mb-1 text-base font-semibold text-slate-100">Statistiken</h3>
              <p className="text-sm text-slate-400">Übersicht & Auswertungen</p>
            </div>
          </button>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2 text-slate-100">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Profile auswählen</h2>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {familyMembers.map((member, index) => {
            const stats = getMemberStats(member.id);

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-7 transition-all hover:scale-[1.02] hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 ${
                  member.is_available !== 1 ? 'opacity-50' : ''
                }`}
              >
                {/* Top gradient bar - appears on hover */}
                <div className="absolute top-0 right-0 left-0 h-1 scale-x-0 bg-linear-to-r from-indigo-500 to-pink-500 transition-transform group-hover:scale-x-100"></div>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`absolute top-3 right-3 text-xs ${
                    member.is_available === 1
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-600 bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {member.is_available === 1 ? 'Verfügbar' : 'Abwesend'}
                </Badge>

                {/* Profile Header */}
                <div className="mb-5 flex items-center gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${getAvatarGradient(index)} text-2xl font-semibold text-white shadow-lg`}
                  >
                    {getInitial(member.name)}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-slate-100">{member.name}</div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          member.is_available === 1
                            ? 'animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'bg-slate-500'
                        }`}
                      ></span>
                      {member.is_available === 1 ? 'Verfügbar' : 'Nicht verfügbar'}
                    </div>
                  </div>
                </div>

                {/* Profile Meta */}
                <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
                  <div>
                    <div className="text-xs text-slate-500">Aufgaben</div>
                    {stats.loading ? (
                      <Skeleton className="mt-1 h-5 w-20 bg-slate-700" />
                    ) : (
                      <div
                        className={`mt-1 font-medium ${stats.chores === 0 ? 'text-slate-500' : 'text-slate-300'}`}
                      >
                        {formatCount(stats.chores, 'Aufgabe', 'Aufgaben')}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pflanzen</div>
                    {stats.loading ? (
                      <Skeleton className="mt-1 h-5 w-20 bg-slate-700" />
                    ) : (
                      <div
                        className={`mt-1 font-medium ${stats.plants === 0 ? 'text-slate-500' : 'text-slate-300'}`}
                      >
                        {formatCount(stats.plants, 'Pflanze', 'Pflanzen')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Wähle dein Profil aus, um deine personalisierten Einstellungen zu laden
          </p>
        </div>
      </div>
    </div>
  );
}
