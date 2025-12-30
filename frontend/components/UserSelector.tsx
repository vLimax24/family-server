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
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="space-y-12 select-none max-w-6xl w-full">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <h2 className="text-6xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent">
              {getGreeting()}
            </h2>
            <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full mt-2"></div>
          </div>
          <p className="text-xl text-slate-600 font-light">Wer nutzt heute das Dashboard?</p>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelectMember(member)}
              className="group relative flex flex-col items-center gap-6 p-8 rounded-3xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-xl hover:shadow-slate-200 hover:scale-105 hover:bg-white border border-slate-200"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-indigo-50 shadow-slate-200">
                  {member.name == 'Linas' ? '🧑' : member.name == "Amelie" ? '👧' : member.name == "Katrin" ? '👩' : '👨'}
                </div>
              </div>

              <span className="text-2xl font-semibold transition-colors duration-300 text-slate-700 group-hover:text-slate-900">
                {member.name}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-400 font-light">Profil auswählen für dein personalisiertes Smart Home</p>
        </div>
      </div>
    </div>
  );
}

// Demo
const demoMembers = [
  { id: '1', name: 'Sarah', avatar: '👩' },
  { id: '2', name: 'Michael', avatar: '👨' },
  { id: '3', name: 'Emma', avatar: '👧' },
  { id: '4', name: 'Alex', avatar: '👦' },
];