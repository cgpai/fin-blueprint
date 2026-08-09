import {
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Persona } from '../types';
import { useT } from '../lib/i18n';

export interface NavItem {
  id: string;
  labelKey: string;
  shortLabelKey: string;
  icon: typeof LayoutDashboard;
  roles: Persona[];
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', shortLabelKey: 'nav.dashboardShort', icon: LayoutDashboard, roles: ['L1', 'L2', 'L3'] },
  { id: 'catalogue', labelKey: 'nav.catalogue', shortLabelKey: 'nav.catalogueShort', icon: BookOpen, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'prd_hub', labelKey: 'nav.prdHub', shortLabelKey: 'nav.prdHubShort', icon: FileText, roles: ['L2', 'Admin'] },
  { id: 'capture', labelKey: 'nav.capture', shortLabelKey: 'nav.captureShort', icon: PlusCircle, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'refinement', labelKey: 'nav.refinement', shortLabelKey: 'nav.refinementShort', icon: Sparkles, roles: ['L1', 'L2', 'L3', 'L4', 'Admin'] },
  { id: 'notifications', labelKey: 'nav.projects', shortLabelKey: 'nav.projectsShort', icon: FolderKanban, roles: ['L2', 'L3', 'L4', 'Admin'] },
  { id: 'admin', labelKey: 'nav.admin', shortLabelKey: 'nav.adminShort', icon: ShieldCheck, roles: ['Admin'] },
];

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentPersona,
  unreadNotifications,
  onCaptureNew,
}: {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentPersona: Persona;
  setPersona: (persona: Persona) => void;
  unreadNotifications: number;
  onCaptureNew: () => void;
  onLock: () => void;
  profileRole: Persona;
}) {
  const t = useT();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(currentPersona));

  const badgeFor = (_itemId: string) => 0;

  return (
    <>
      {/* Desktop / tablet: vertical icon rail on the left */}
      <aside className="hidden sm:flex shrink-0 py-4 pl-4 flex-col z-10 print:hidden">
        <div className="glass rounded-full flex flex-col items-center gap-1.5 px-2 py-3 flex-1 max-h-full">
          <button
            onClick={() => setCurrentTab('catalogue')}
            title={t('nav.brandCatalogue')}
            aria-label={t('nav.brandCatalogue')}
            className="w-11 h-11 rounded-full bg-ink text-citron grid place-items-center mb-2 shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <Sparkles size={17} />
          </button>

          <nav className="flex flex-col items-center gap-1.5">
            {items.map((item) => {
              const active = currentTab === item.id;
              const badge = badgeFor(item.id);
              const label = t(item.labelKey);
              return (
                <button
                  key={item.id}
                  onClick={() => (item.id === 'capture' ? onCaptureNew() : setCurrentTab(item.id))}
                  title={label}
                  aria-label={label}
                  className={`relative w-11 h-11 rounded-full grid place-items-center transition-all cursor-pointer ${
                    active ? 'bg-ink text-white shadow-lift' : 'text-mute hover:bg-white/80 hover:text-ink'
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

          <div className="flex-1" />
        </div>
      </aside>

      {/* Phone: bottom tab bar */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 print:hidden bg-white/90 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="flex items-stretch overflow-x-auto scrollbar-none">
          {items.map((item) => {
            const active = currentTab === item.id;
            const badge = badgeFor(item.id);
            return (
              <button
                key={item.id}
                onClick={() => (item.id === 'capture' ? onCaptureNew() : setCurrentTab(item.id))}
                aria-label={t(item.labelKey)}
                className={`relative flex-1 min-w-16 flex flex-col items-center justify-center gap-0.5 py-2.5 cursor-pointer transition-colors ${
                  active ? 'text-ink' : 'text-faint'
                }`}
              >
                <item.icon size={19} className={active ? 'text-ink' : 'text-faint'} />
                {badge > 0 && (
                  <span className="absolute top-1 right-1/4 min-w-3.5 h-3.5 px-0.5 rounded-full bg-citron text-ink text-[8px] font-bold grid place-items-center border border-white">
                    {badge}
                  </span>
                )}
                <span className="text-[9px] font-semibold leading-none truncate max-w-full px-1">
                  {t(item.shortLabelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
