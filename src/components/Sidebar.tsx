import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Persona } from '../types';

export interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Persona[];
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['L1', 'L2', 'L3'] },
  { id: 'catalogue', label: 'Catalogue', icon: BookOpen, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'capture', label: 'Capture a process', icon: PlusCircle, roles: ['L1', 'L2', 'L3', 'L4'] },
  { id: 'refinement', label: 'AI Refinement', icon: Sparkles, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'notifications', label: 'Inbox', icon: Bell, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'admin', label: 'Programme admin', icon: ShieldCheck, roles: ['L1', 'Admin'] },
];

const PERSONA_LABELS: Record<Persona, string> = {
  L1: 'CFO',
  L2: 'GM / Head',
  L3: 'Manager',
  L4: 'Executor',
  Admin: 'Admin',
};

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentPersona,
  setPersona,
  unreadNotifications,
  onCaptureNew,
  onLock,
}: {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentPersona: Persona;
  setPersona: (persona: Persona) => void;
  unreadNotifications: number;
  onCaptureNew: () => void;
  onLock: () => void;
}) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(currentPersona));

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-30 px-3 pt-2
        pb-[max(0.65rem,env(safe-area-inset-bottom))]
        md:static md:inset-auto md:z-10 md:shrink-0 md:flex md:flex-col
        md:py-4 md:pl-4 md:pr-0 md:pb-4
      "
    >
      <div
        className="
          glass rounded-full flex flex-row items-center justify-between gap-0.5 px-1.5 py-1.5
          md:flex-col md:items-center md:justify-start md:gap-1.5 md:px-2 md:py-3
          md:flex-1 md:max-h-full
        "
      >
        <button
          onClick={() => setCurrentTab('catalogue')}
          title="Blueprint — go to the process catalogue"
          aria-label="Blueprint — go to the process catalogue"
          className="hidden md:grid w-11 h-11 rounded-full bg-ink text-citron place-items-center mb-2 shrink-0 cursor-pointer transition-transform hover:scale-105"
        >
          <Sparkles size={17} />
        </button>

        <nav className="flex flex-1 items-center justify-around gap-0.5 md:flex-col md:flex-none md:justify-start md:gap-1.5">
          {items.map((item) => {
            const active = currentTab === item.id;
            const badge = item.id === 'notifications' ? unreadNotifications : 0;
            return (
              <button
                key={item.id}
                onClick={() => (item.id === 'capture' ? onCaptureNew() : setCurrentTab(item.id))}
                title={item.label}
                aria-label={item.label}
                className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-ink text-white shadow-lift'
                    : 'text-mute hover:bg-white/80 hover:text-ink'
                }`}
              >
                <item.icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-citron text-ink text-[10px] font-bold grid place-items-center border-2 border-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block flex-1" />

        <div className="hidden md:flex flex-col items-center gap-1 pb-1" title="Demo: view the app as another role">
          <span className="text-[9px] font-bold text-faint tracking-wide">VIEW AS</span>
          {(['L1', 'L2', 'L3', 'L4', 'Admin'] as Persona[]).map((level) => (
            <button
              key={level}
              onClick={() => setPersona(level)}
              title={`View as ${PERSONA_LABELS[level]} (${level})`}
              className={`w-8 h-8 rounded-full text-[10px] font-bold grid place-items-center transition-all cursor-pointer ${
                currentPersona === level ? 'bg-veil text-ink' : 'text-faint hover:bg-white/80 hover:text-ink'
              }`}
            >
              {level === 'Admin' ? 'AD' : level}
            </button>
          ))}
        </div>

        <button
          onClick={onLock}
          title="Log out"
          aria-label="Log out"
          className="w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center text-mute hover:bg-white/80 hover:text-ink transition-all cursor-pointer shrink-0"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
}
