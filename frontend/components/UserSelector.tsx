interface FamilyMember {
  id: number;
  name: string;
  role: string;
}

interface UserSelectorProps {
  members: FamilyMember[];
  onSelectMember: (member: FamilyMember) => void;
}

export function UserSelector({ members, onSelectMember }: UserSelectorProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl space-y-8 select-none sm:space-y-10 lg:space-y-12">
        <div className="space-y-2 text-center sm:space-y-3">
          <div className="inline-block">
            <h2 className="bg-linear-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
              {getGreeting()}
            </h2>
            <div className="mt-1 h-0.5 rounded-full bg-linear-to-r from-transparent via-emerald-500 to-transparent sm:mt-2 sm:h-1"></div>
          </div>
          <p className="px-4 text-base font-light text-slate-600 sm:text-lg lg:text-xl">
            Wer nutzt heute das Dashboard?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-xl hover:shadow-slate-200 sm:gap-4 sm:rounded-3xl sm:p-6 lg:gap-6 lg:p-8"
            >
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-slate-100 via-slate-50 to-slate-100 text-4xl shadow-lg shadow-slate-200 transition-all duration-300 group-hover:from-blue-50 group-hover:to-indigo-50 sm:h-24 sm:w-24 sm:text-5xl lg:h-32 lg:w-32 lg:text-6xl">
                  {member.name == 'Linas'
                    ? '🧑'
                    : member.name == 'Amelie'
                      ? '👧'
                      : member.name == 'Katrin'
                        ? '👩'
                        : '👨'}
                </div>
              </div>

              <span className="text-lg font-semibold text-slate-700 transition-colors duration-300 group-hover:text-slate-900 sm:text-xl lg:text-2xl">
                {member.name}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-2 text-center sm:pt-3 lg:pt-4">
          <p className="px-4 text-xs font-light text-slate-400 sm:text-sm">
            Profil auswählen für dein personalisiertes Smart Home
          </p>
        </div>
      </div>
    </div>
  );
}
