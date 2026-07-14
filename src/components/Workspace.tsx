import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import ProcessCatalogue from './ProcessCatalogue';
import AIRefinementPanel from './AIRefinementPanel';
import DashboardCFO from './DashboardCFO';
import DashboardManager from './DashboardManager';
import AdminPanel from './AdminPanel';
import NotificationCenter from './NotificationCenter';
import { Avatar } from './ui';
import {
  ImprovementItem,
  NotificationLog,
  Persona,
  Process,
  SystemItem,
  UserNotification,
  UserProfile,
} from '../types';
import { greeting } from '../lib/utils';

export default function Workspace({
  profile,
  currentPersona,
  setCurrentPersona,
  initialTab,
  focusProcessId,
  clearFocusProcess,
  processes,
  availableSystems,
  registeredProfiles,
  notifications,
  adminBroadcastLogs,
  improvementItems,
  onSaveProcess,
  onDeleteProcess,
  onAddSystem,
  onMarkRead,
  onActionNotification,
  onTriggerReminder,
  onTriggerAdminNotification,
  onAddImprovementItem,
  onUpdateImprovementItem,
  onCaptureNew,
  onLock,
}: {
  profile: UserProfile;
  currentPersona: Persona;
  setCurrentPersona: (persona: Persona) => void;
  initialTab: string;
  focusProcessId: string | null;
  clearFocusProcess: () => void;
  processes: Process[];
  availableSystems: SystemItem[];
  registeredProfiles: UserProfile[];
  notifications: UserNotification[];
  adminBroadcastLogs: NotificationLog[];
  improvementItems: ImprovementItem[];
  onSaveProcess: (process: Process) => void;
  onDeleteProcess: (id: string) => void;
  onAddSystem: (name: string) => void;
  onMarkRead: (id: string) => void;
  onActionNotification: (id: string, response: string) => void;
  onTriggerReminder: (email: string, subject: string, msg: string) => void;
  onTriggerAdminNotification: (subject: string, msg: string, type: 'individual' | 'level' | 'subfunction' | 'all', val: string) => void;
  onAddImprovementItem: (item: ImprovementItem) => void;
  onUpdateImprovementItem: (item: ImprovementItem) => void;
  onCaptureNew: () => void;
  onLock: () => void;
}) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedViewProcess, setSelectedViewProcess] = useState<Process | null>(
    () => (focusProcessId && initialTab === 'catalogue' ? processes.find((p) => p.id === focusProcessId) ?? null : null),
  );

  // Keep the open detail view in sync when a process is updated elsewhere.
  useEffect(() => {
    if (selectedViewProcess) {
      const fresh = processes.find((p) => p.id === selectedViewProcess.id);
      if (fresh && fresh !== selectedViewProcess) setSelectedViewProcess(fresh);
    }
  }, [processes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePersonaChange = (persona: Persona) => {
    setCurrentPersona(persona);
    setSelectedViewProcess(null);
    if (persona === 'Admin') setCurrentTab('admin');
    else if (persona === 'L4') setCurrentTab('catalogue');
    else setCurrentTab('dashboard');
  };

  /**
   * Editing reuses the guided journey: pre-load the journey draft with this
   * process, then jump back into the capture phase at the review stage.
   */
  const handleEditProcess = (process: Process) => {
    localStorage.setItem(
      'bp_journey_draft_v2',
      JSON.stringify({
        stage: 'review',
        outputs: [],
        title: process.title,
        subFunction: process.subFunction,
        narrative: process.description,
        overallSummary: null,
        processes: [
          {
            id: process.id,
            title: process.title,
            subFunction: process.subFunction,
            summary: process.description,
            steps: process.steps,
            isShared: process.isShared,
            taggedUsers: process.taggedUsers,
          },
        ],
      }),
    );
    onCaptureNew();
  };

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length;
  const myProcessCount = processes.filter((p) => p.ownerName === profile.name).length;
  const avgCompleteness = processes.length
    ? Math.round(processes.reduce((sum, p) => sum + p.completenessScore, 0) / processes.length)
    : 0;

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(onLock, 900);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden canvas-wash">
      {loggingOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.28 }}
            className="glass rounded-card px-8 py-7 text-center"
          >
            <motion.div
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="mx-auto w-14 h-14 rounded-full bg-white/60 border border-white/70 shadow-lift"
            />
            <div className="font-display text-lg font-semibold mt-4">Logging out</div>
            <div className="text-xs text-mute mt-1">Clearing your session...</div>
          </motion.div>
        </div>
      )}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'catalogue') setSelectedViewProcess(null);
        }}
        currentPersona={currentPersona}
        setPersona={handlePersonaChange}
        unreadNotifications={unreadCount}
        onCaptureNew={onCaptureNew}
        onLock={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="app-header px-6 md:px-10 pt-7 pb-2 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light tracking-tight">
              {greeting()}, <span className="font-semibold">{profile.name.split(' ')[0]}!</span>
            </h1>
            <p className="text-sm text-mute mt-1">Let&rsquo;s make the way you work visible.</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-semibold text-mute">Processes documented</div>
              <div className="font-display text-2xl font-semibold leading-tight">
                {processes.length}
                <span className="text-sm text-faint font-normal ml-1.5">{myProcessCount} yours</span>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-semibold text-mute">Avg. completeness</div>
              <div className="font-display text-2xl font-semibold leading-tight">{avgCompleteness}%</div>
            </div>
            {currentPersona !== 'Admin' && (
              <button onClick={onCaptureNew} className="btn-dark">
                <Plus size={16} /> Capture process
              </button>
            )}
            <Avatar name={profile.name} size={42} />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
          <div className="max-w-6xl mx-auto space-y-6 pb-10">
            {currentTab === 'dashboard' &&
              (currentPersona === 'L3' ? (
                <DashboardManager
                  processes={processes}
                  improvementItems={improvementItems}
                  onAddImprovementItem={onAddImprovementItem}
                  onUpdateImprovementItem={onUpdateImprovementItem}
                  onTriggerReminder={onTriggerReminder}
                />
              ) : (
                <DashboardCFO
                  processes={processes}
                  currentPersona={currentPersona}
                  improvementItems={improvementItems}
                  onSelectProcess={(proc) => {
                    setSelectedViewProcess(proc);
                    setCurrentTab('catalogue');
                  }}
                />
              ))}

            {currentTab === 'catalogue' && (
              <ProcessCatalogue
                processes={processes}
                selectedViewProcess={selectedViewProcess}
                onSelectProcess={setSelectedViewProcess}
                onEditProcess={handleEditProcess}
                onDeleteProcess={(id) => {
                  if (confirm('Permanently remove this process from the catalogue?')) {
                    onDeleteProcess(id);
                    if (selectedViewProcess?.id === id) setSelectedViewProcess(null);
                  }
                }}
                currentPersona={currentPersona}
                profileName={profile.name}
                onCreateNew={onCaptureNew}
              />
            )}

            {currentTab === 'refinement' && (
              <AIRefinementPanel
                processes={processes}
                focusProcessId={focusProcessId}
                clearFocusProcess={clearFocusProcess}
                onUpdateProcess={(updated) => {
                  onSaveProcess(updated);
                  if (selectedViewProcess?.id === updated.id) setSelectedViewProcess(updated);
                }}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationCenter
                notifications={notifications}
                logs={adminBroadcastLogs}
                onMarkRead={onMarkRead}
                onActionNotification={onActionNotification}
                currentPersona={currentPersona}
              />
            )}

            {currentTab === 'admin' && (
              <AdminPanel
                processes={processes}
                availableSystems={availableSystems}
                registeredProfiles={registeredProfiles}
                improvementItems={improvementItems}
                onTriggerAdminNotification={onTriggerAdminNotification}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
