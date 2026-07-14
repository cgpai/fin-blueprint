import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';
import CaptureJourney from './components/journey/CaptureJourney';
import Workspace from './components/Workspace';

import {
  AppPhase,
  ImprovementItem,
  NotificationLog,
  Persona,
  Process,
  SystemItem,
  UserNotification,
  UserProfile,
} from './types';
import {
  MOCK_PROCESSES,
  MOCK_SYSTEMS,
  MOCK_NOTIFICATIONS,
  MOCK_NOTIFICATION_LOGS,
  MOCK_IMPROVEMENT_ITEMS,
} from './data/mockData';
import { uid } from './lib/utils';
import { AppSnapshot, loadSnapshot, saveSnapshot, spreadsheetEnabled } from './lib/spreadsheetDb';

const STORAGE = {
  profile: 'bp_profile',
  phase: 'bp_phase',
  processes: 'bp_processes',
  systems: 'bp_systems',
  unlocked: 'bp_unlocked', // sessionStorage — cleared when the browser tab closes
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadJSON<UserProfile | null>(STORAGE.profile, null));

  const [phase, setPhase] = useState<AppPhase>(() => {
    const saved = loadJSON<UserProfile | null>(STORAGE.profile, null);
    if (!saved) return 'landing';
    if (sessionStorage.getItem(STORAGE.unlocked) !== 'true') return 'locked';
    const savedPhase = localStorage.getItem(STORAGE.phase);
    return savedPhase === 'journey' || savedPhase === 'workspace' ? savedPhase : 'journey';
  });

  // Which workspace tab to open when entering the workspace (recap choices route here)
  const [workspaceTab, setWorkspaceTab] = useState<string>('dashboard');
  const [focusProcessId, setFocusProcessId] = useState<string | null>(null);

  const [currentPersona, setCurrentPersona] = useState<Persona>(() => loadJSON<UserProfile | null>(STORAGE.profile, null)?.role ?? 'L4');

  // ---------- Data layer (local-first, mock-seeded) ----------
  const [processes, setProcesses] = useState<Process[]>(() => loadJSON(STORAGE.processes, MOCK_PROCESSES));
  const [availableSystems, setAvailableSystems] = useState<SystemItem[]>(() => loadJSON(STORAGE.systems, MOCK_SYSTEMS));
  const [notifications, setNotifications] = useState<UserNotification[]>(MOCK_NOTIFICATIONS);
  const [adminBroadcastLogs, setAdminBroadcastLogs] = useState<NotificationLog[]>(MOCK_NOTIFICATION_LOGS);
  const [improvementItems, setImprovementItems] = useState<ImprovementItem[]>(MOCK_IMPROVEMENT_ITEMS);
  const [registeredProfiles, setRegisteredProfiles] = useState<UserProfile[]>([]);
  const [remoteReady, setRemoteReady] = useState(!spreadsheetEnabled);

  useEffect(() => {
    if (!spreadsheetEnabled) return;
    loadSnapshot()
      .then((remote) => {
        if (!remote) return;
        const remotePhase = remote.phase === 'journey' || remote.phase === 'workspace' ? remote.phase : null;
        if (remotePhase) localStorage.setItem(STORAGE.phase, remotePhase);
        if (profile && sessionStorage.getItem(STORAGE.unlocked) !== 'true') setPhase('locked');
        else if (remotePhase && profile) setPhase(remotePhase);
        if (remote.processes) setProcesses(remote.processes);
        if (remote.systems) setAvailableSystems(remote.systems);
        if (remote.notifications) setNotifications(remote.notifications);
        if (remote.adminBroadcastLogs) setAdminBroadcastLogs(remote.adminBroadcastLogs);
        if (remote.improvementItems) setImprovementItems(remote.improvementItems);
        if (remote.profiles) setRegisteredProfiles(Object.values(remote.profiles));
      })
      .catch((err) => console.error('Spreadsheet sync load failed:', err))
      .finally(() => setRemoteReady(true));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE.processes, JSON.stringify(processes));
  }, [processes]);

  useEffect(() => {
    localStorage.setItem(STORAGE.systems, JSON.stringify(availableSystems));
  }, [availableSystems]);

  useEffect(() => {
    if (phase === 'journey' || phase === 'workspace') {
      localStorage.setItem(STORAGE.phase, phase);
    }
  }, [phase]);

  useEffect(() => {
    if (!spreadsheetEnabled || !remoteReady) return;
    const persistedPhase = phase === 'journey' || phase === 'workspace' ? phase : localStorage.getItem(STORAGE.phase);
    const snapshot: AppSnapshot = {
      profile,
      profiles: Object.fromEntries(
        [
          ...registeredProfiles,
          ...(profile ? [profile] : []),
        ].map((p) => [(p.email || p.name).trim().toLowerCase(), p]),
      ),
      phase: persistedPhase === 'journey' || persistedPhase === 'workspace' ? persistedPhase : null,
      processes,
      systems: availableSystems,
      notifications,
      adminBroadcastLogs,
      improvementItems,
    };
    const timer = window.setTimeout(() => {
      saveSnapshot(snapshot).catch((err) => console.error('Spreadsheet sync save failed:', err));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [profile, phase, processes, availableSystems, notifications, adminBroadcastLogs, improvementItems, registeredProfiles, remoteReady]);

  // ---------- Phase transitions ----------
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    localStorage.setItem(STORAGE.profile, JSON.stringify(newProfile));
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    setProfile(newProfile);
    setRegisteredProfiles((prev) => {
      const key = (newProfile.email || newProfile.name).trim().toLowerCase();
      return [...prev.filter((p) => (p.email || p.name).trim().toLowerCase() !== key), newProfile];
    });
    setCurrentPersona(newProfile.role);
    setPhase('journey');
  };

  const handleExistingLogin = (existingProfile: UserProfile) => {
    localStorage.setItem(STORAGE.profile, JSON.stringify(existingProfile));
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    setProfile(existingProfile);
    setCurrentPersona(existingProfile.role);
    const savedPhase = localStorage.getItem(STORAGE.phase);
    setPhase(savedPhase === 'workspace' ? 'workspace' : 'journey');
  };

  const handleUpdateRegisteredProfile = (updatedProfile: UserProfile) => {
    setRegisteredProfiles((prev) => {
      const key = (updatedProfile.email || updatedProfile.name).trim().toLowerCase();
      return [...prev.filter((p) => (p.email || p.name).trim().toLowerCase() !== key), updatedProfile];
    });
    if ((profile?.email || profile?.name || '').trim().toLowerCase() === (updatedProfile.email || updatedProfile.name).trim().toLowerCase()) {
      localStorage.setItem(STORAGE.profile, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    }
  };

  const handleUnlock = () => {
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    const savedPhase = localStorage.getItem(STORAGE.phase);
    setPhase(savedPhase === 'workspace' ? 'workspace' : 'journey');
  };

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE.profile);
    localStorage.removeItem(STORAGE.phase);
    sessionStorage.removeItem(STORAGE.unlocked);
    setProfile(null);
    setPhase('landing');
  };

  // ---------- Process actions ----------
  const handleSaveProcess = (newProcess: Process) => {
    setProcesses((prev) => {
      const exists = prev.some((p) => p.id === newProcess.id);
      return exists ? prev.map((p) => (p.id === newProcess.id ? newProcess : p)) : [newProcess, ...prev];
    });
  };

  const handleDeleteProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddSystem = (systemName: string) => {
    setAvailableSystems((prev) => {
      if (prev.some((s) => s.name.toLowerCase() === systemName.toLowerCase())) return prev;
      return [...prev, { id: uid('sys'), name: systemName, category: 'Unclassified ERP App', processCount: 1 }];
    });
  };

  // ---------- Notification actions ----------
  const handleMarkRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, status: 'Read' } : n)));
  };

  const handleActionNotification = (notifId: string, responseText: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, status: 'Actioned', responseText } : n)));
  };

  const handleTriggerReminder = (_targetEmail: string, subject: string, msg: string) => {
    setNotifications((prev) => [
      {
        id: uid('notif'),
        senderName: profile?.name ? `${profile.name} (Manager)` : 'Unit Manager',
        subject,
        message: msg,
        timestamp: new Date().toISOString(),
        status: 'Unread',
        actionRequired: true,
      },
      ...prev,
    ]);
  };

  const handleTriggerAdminNotification = (
    subject: string,
    msg: string,
    type: 'individual' | 'level' | 'subfunction' | 'all',
    val: string,
  ) => {
    const senderName = profile?.name ? `${profile.name} (Admin)` : 'Programme Admin';
    setAdminBroadcastLogs((prev) => [
      {
        id: uid('log'),
        senderName,
        subject,
        message: msg,
        targetType: type,
        targetValue: val,
        timestamp: new Date().toISOString(),
        status: 'Sent',
        responsesCount: 0,
      },
      ...prev,
    ]);
    setNotifications((prev) => [
      {
        id: uid('notif'),
        senderName,
        subject,
        message: msg,
        timestamp: new Date().toISOString(),
        status: 'Unread',
        actionRequired: true,
      },
      ...prev,
    ]);
  };

  const handleAddImprovementItem = (item: ImprovementItem) => {
    setImprovementItems((prev) => [item, ...prev]);
  };

  const handleUpdateImprovementItem = (updated: ImprovementItem) => {
    setImprovementItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // ---------- Render current phase ----------
  if (phase === 'landing') {
    return (
      <LandingPage
        onStart={() => setPhase('onboarding')}
        registeredProfiles={registeredProfiles}
        onLogin={handleExistingLogin}
        onUpdateProfile={handleUpdateRegisteredProfile}
      />
    );
  }

  if (phase === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} onBack={() => setPhase('landing')} registeredProfiles={registeredProfiles} />;
  }

  if (phase === 'locked' && profile) {
    return <LockScreen profile={profile} onUnlock={handleUnlock} onStartOver={handleStartOver} />;
  }

  if (phase === 'journey' && profile) {
    return (
      <CaptureJourney
        profile={profile}
        allProcesses={processes}
        availableSystems={availableSystems}
        onAddSystem={handleAddSystem}
        onSaveProcess={handleSaveProcess}
        onFinish={(destinationTab, processId) => {
          setWorkspaceTab(destinationTab);
          setFocusProcessId(processId ?? null);
          setPhase('workspace');
        }}
        onSkipToWorkspace={() => {
          setWorkspaceTab(currentPersona === 'Admin' ? 'admin' : 'dashboard');
          setPhase('workspace');
        }}
      />
    );
  }

  if (phase === 'workspace' && profile) {
    return (
      <Workspace
        profile={profile}
        currentPersona={currentPersona}
        setCurrentPersona={setCurrentPersona}
        initialTab={workspaceTab}
        focusProcessId={focusProcessId}
        clearFocusProcess={() => setFocusProcessId(null)}
        processes={processes}
        availableSystems={availableSystems}
        registeredProfiles={registeredProfiles}
        notifications={notifications}
        adminBroadcastLogs={adminBroadcastLogs}
        improvementItems={improvementItems}
        onSaveProcess={handleSaveProcess}
        onDeleteProcess={handleDeleteProcess}
        onAddSystem={handleAddSystem}
        onMarkRead={handleMarkRead}
        onActionNotification={handleActionNotification}
        onTriggerReminder={handleTriggerReminder}
        onTriggerAdminNotification={handleTriggerAdminNotification}
        onAddImprovementItem={handleAddImprovementItem}
        onUpdateImprovementItem={handleUpdateImprovementItem}
        onCaptureNew={() => setPhase('journey')}
        onLock={handleStartOver}
      />
    );
  }

  // Fallback — inconsistent persisted state, restart cleanly.
  return (
    <LandingPage
      onStart={() => setPhase('onboarding')}
      registeredProfiles={registeredProfiles}
      onLogin={handleExistingLogin}
      onUpdateProfile={handleUpdateRegisteredProfile}
    />
  );
}
