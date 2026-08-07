import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import LockScreen from './components/LockScreen';
import RemoteLogin from './components/RemoteLogin';
import CaptureJourney from './components/journey/CaptureJourney';
import Workspace from './components/Workspace';
import { isRemoteEnabled, mapProcessToRemoteInput, submitRemoteProcess, RemoteUser } from './lib/blueprintApi';
import { AppSnapshot, loadSnapshot, saveSnapshot, spreadsheetEnabled } from './lib/spreadsheetDb';

import {
  AppPhase,
  GanttTask,
  ImprovementItem,
  ManagedProject,
  MeetingNote,
  MeetingTranscript,
  NotificationLog,
  Persona,
  Process,
  ProjectOKR,
  SystemItem,
  TeamMember,
  UserNotification,
  UserProfile,
} from './types';
import { MOCK_SYSTEMS } from './data/mockData';
import { uid } from './lib/utils';

const STORAGE = {
  profile: 'bp_profile',
  phase: 'bp_phase',
  processes: 'bp_processes',
  systems: 'bp_systems',
  unlocked: 'bp_unlocked', // sessionStorage — cleared when the browser tab closes
  remoteToken: 'bp_remote_token', // sessionStorage — Postgres API session when VITE_ENABLE_REMOTE_AUTH=true
  projects: 'bp_projects',
  teamMembers: 'bp_team_members',
  transcripts: 'bp_transcripts',
  meetingNotes: 'bp_meeting_notes',
  ganttTasks: 'bp_gantt_tasks',
  projectOkrs: 'bp_project_okrs',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function isNicoleUser(p: Pick<UserProfile, 'name' | 'email'>): boolean {
  const n = p.name.toLowerCase();
  const e = (p.email || '').toLowerCase();
  return n.includes('nicole') || e.includes('nicole');
}

/** Nicole is always Admin — matches onboarding auto-promotion. */
function withNicoleAdmin(p: UserProfile): UserProfile {
  if (isNicoleUser(p) && p.role !== 'Admin') {
    const updated = { ...p, role: 'Admin' as Persona };
    localStorage.setItem(STORAGE.profile, JSON.stringify(updated));
    return updated;
  }
  return p;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const loaded = loadJSON<UserProfile | null>(STORAGE.profile, null);
    return loaded ? withNicoleAdmin(loaded) : null;
  });

  const [phase, setPhase] = useState<AppPhase>(() => {
    if (isRemoteEnabled()) {
      if (!sessionStorage.getItem(STORAGE.remoteToken)) return 'remoteLogin';
      const saved = loadJSON<UserProfile | null>(STORAGE.profile, null);
      if (saved?.role === 'Admin') return 'workspace';
      const savedPhase = localStorage.getItem(STORAGE.phase);
      return savedPhase === 'journey' || savedPhase === 'workspace' ? savedPhase : 'journey';
    }
    const saved = loadJSON<UserProfile | null>(STORAGE.profile, null);
    if (!saved) return 'landing';
    if (sessionStorage.getItem(STORAGE.unlocked) !== 'true') return 'locked';
    if (saved.role === 'Admin') return 'workspace';
    const savedPhase = localStorage.getItem(STORAGE.phase);
    return savedPhase === 'journey' || savedPhase === 'workspace' ? savedPhase : 'journey';
  });

  // Which workspace tab to open when entering the workspace (recap choices route here)
  const [workspaceTab, setWorkspaceTab] = useState<string>(() => {
    const saved = loadJSON<UserProfile | null>(STORAGE.profile, null);
    return saved?.role === 'Admin' ? 'admin' : 'dashboard';
  });
  const [focusProcessId, setFocusProcessId] = useState<string | null>(null);

  const [currentPersona, setCurrentPersona] = useState<Persona>(() => {
    const loaded = loadJSON<UserProfile | null>(STORAGE.profile, null);
    if (loaded && isNicoleUser(loaded)) return 'Admin';
    return loaded?.role ?? 'L4';
  });

  // ---------- Data layer (local-first; empty seeds — no hardcoded people) ----------
  const [processes, setProcesses] = useState<Process[]>(() => loadJSON(STORAGE.processes, [] as Process[]));
  const [availableSystems, setAvailableSystems] = useState<SystemItem[]>(() => loadJSON(STORAGE.systems, MOCK_SYSTEMS));
  const [notifications, setNotifications] = useState<UserNotification[]>(() => loadJSON('bp_notifications_v1', [] as UserNotification[]));
  const [adminBroadcastLogs, setAdminBroadcastLogs] = useState<NotificationLog[]>(() => loadJSON('bp_broadcasts_v1', [] as NotificationLog[]));
  const [improvementItems, setImprovementItems] = useState<ImprovementItem[]>(() => loadJSON('bp_improvements_v1', [] as ImprovementItem[]));
  const [registeredProfiles, setRegisteredProfiles] = useState<UserProfile[]>([]);
  const [remoteReady, setRemoteReady] = useState(!spreadsheetEnabled);
  /** `loading` while first Sheets fetch runs; `error` if it fails; `ok` once profiles are trusted. */
  const [sheetsSync, setSheetsSync] = useState<'off' | 'loading' | 'ok' | 'error'>(
    spreadsheetEnabled ? 'loading' : 'off',
  );

  // ---------- Project Management state ----------
  const [managedProjects, setManagedProjects] = useState<ManagedProject[]>(() => loadJSON(STORAGE.projects, [] as ManagedProject[]));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadJSON(STORAGE.teamMembers, [] as TeamMember[]));
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>(() => loadJSON(STORAGE.transcripts, [] as MeetingTranscript[]));
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(() => loadJSON(STORAGE.meetingNotes, [] as MeetingNote[]));
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>(() => loadJSON(STORAGE.ganttTasks, [] as GanttTask[]));
  const [projectOkrs, setProjectOkrs] = useState<ProjectOKR[]>(() => loadJSON(STORAGE.projectOkrs, [] as ProjectOKR[]));

  useEffect(() => {
    if (!spreadsheetEnabled) return;
    setSheetsSync('loading');
    loadSnapshot()
      .then((remote) => {
        if (!remote) {
          setSheetsSync('error');
          return;
        }
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
        setSheetsSync('ok');
      })
      .catch((err) => {
        console.error('Spreadsheet sync load failed:', err);
        setSheetsSync('error');
      })
      .finally(() => setRemoteReady(true));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE.processes, JSON.stringify(processes));
  }, [processes]);

  useEffect(() => {
    localStorage.setItem(STORAGE.systems, JSON.stringify(availableSystems));
  }, [availableSystems]);

  useEffect(() => {
    localStorage.setItem(STORAGE.projects, JSON.stringify(managedProjects));
  }, [managedProjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE.teamMembers, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE.transcripts, JSON.stringify(transcripts));
  }, [transcripts]);

  useEffect(() => {
    localStorage.setItem(STORAGE.meetingNotes, JSON.stringify(meetingNotes));
  }, [meetingNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE.ganttTasks, JSON.stringify(ganttTasks));
  }, [ganttTasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE.projectOkrs, JSON.stringify(projectOkrs));
  }, [projectOkrs]);

  useEffect(() => {
    if (phase === 'journey' || phase === 'workspace') {
      localStorage.setItem(STORAGE.phase, phase);
    }
  }, [phase]);

  useEffect(() => {
    // Never save until Sheets load succeeded — avoids racing an empty local profile map over a failed sync.
    if (!spreadsheetEnabled || !remoteReady || sheetsSync !== 'ok') return;
    const persistedPhase = phase === 'journey' || phase === 'workspace' ? phase : localStorage.getItem(STORAGE.phase);
    const snapshot: AppSnapshot = {
      profile,
      profiles: Object.fromEntries(
        [...registeredProfiles, ...(profile ? [profile] : [])].map((p) => [(p.email || p.name).trim().toLowerCase(), p]),
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
  }, [profile, phase, processes, availableSystems, notifications, adminBroadcastLogs, improvementItems, registeredProfiles, remoteReady, sheetsSync]);

  // Super-admin runs the programme — never the staff capture journey.
  useEffect(() => {
    if (profile?.role === 'Admin' && phase === 'journey') {
      setWorkspaceTab('admin');
      setPhase('workspace');
    }
  }, [profile, phase]);

  // ---------- Phase transitions ----------
  const handleRemoteSignedIn = (token: string, user: RemoteUser) => {
    sessionStorage.setItem(STORAGE.remoteToken, token);
    const newProfile: UserProfile = {
      name: user.name,
      role: user.level,
      passwordHash: '',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE.profile, JSON.stringify(newProfile));
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    setProfile(newProfile);
    setCurrentPersona(newProfile.role);
    if (newProfile.role === 'Admin') {
      setWorkspaceTab('admin');
      setPhase('workspace');
    } else {
      setPhase('journey');
    }
  };

  const handleLandingLogin = (loggedIn: UserProfile) => {
    const promoted = withNicoleAdmin(loggedIn);
    localStorage.setItem(STORAGE.profile, JSON.stringify(promoted));
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    setProfile(promoted);
    setCurrentPersona(promoted.role);
    if (promoted.role === 'Admin') {
      setWorkspaceTab('admin');
      setPhase('workspace');
    } else {
      const savedPhase = localStorage.getItem(STORAGE.phase);
      setPhase(savedPhase === 'workspace' ? 'workspace' : 'journey');
    }
  };

  const handleUnlock = (updatedProfile?: UserProfile) => {
    const next = updatedProfile || profile;
    if (updatedProfile) {
      localStorage.setItem(STORAGE.profile, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
    }
    sessionStorage.setItem(STORAGE.unlocked, 'true');
    if (next?.role === 'Admin') {
      setWorkspaceTab('admin');
      setPhase('workspace');
      return;
    }
    const savedPhase = localStorage.getItem(STORAGE.phase);
    setPhase(savedPhase === 'workspace' ? 'workspace' : 'journey');
  };

  const handleStartOver = () => {
    localStorage.removeItem(STORAGE.profile);
    localStorage.removeItem(STORAGE.phase);
    sessionStorage.removeItem(STORAGE.unlocked);
    sessionStorage.removeItem(STORAGE.remoteToken);
    setProfile(null);
    setPhase(isRemoteEnabled() ? 'remoteLogin' : 'landing');
  };

  const handleLock = () => {
    sessionStorage.removeItem(STORAGE.unlocked);
    if (isRemoteEnabled()) {
      sessionStorage.removeItem(STORAGE.remoteToken);
      setPhase('remoteLogin');
    } else {
      setPhase('locked');
    }
  };

  // ---------- Process actions ----------
  const handleSaveProcess = (newProcess: Process) => {
    setProcesses((prev) => {
      const exists = prev.some((p) => p.id === newProcess.id);
      if (!exists && isRemoteEnabled()) {
        const token = sessionStorage.getItem(STORAGE.remoteToken);
        if (token) {
          submitRemoteProcess(token, mapProcessToRemoteInput(newProcess)).catch((err) => {
            console.warn('Blueprint: failed to sync process to Postgres', err);
          });
        }
      }
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

  // ---------- Project Management actions ----------
  const handleUpdateProject = (updated: ManagedProject) => {
    setManagedProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddProject = (newProj: ManagedProject) => {
    setManagedProjects((prev) => [newProj, ...prev]);
  };

  const handleDeleteProject = (projectId: string) => {
    setManagedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleAddTeamMember = (member: TeamMember) => {
    setTeamMembers((prev) => [...prev, member]);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleAddTranscript = (tr: MeetingTranscript) => {
    setTranscripts((prev) => [tr, ...prev]);
  };

  const handleAddMeetingNote = (note: MeetingNote) => {
    setMeetingNotes((prev) => [note, ...prev]);
  };

  const handleUpdateMeetingNote = (note: MeetingNote) => {
    setMeetingNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
  };

  const handleUpdateActionItemStatus = (noteId: string, itemId: string, status: 'pending' | 'sent' | 'acknowledged') => {
    setMeetingNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        return {
          ...note,
          actionItems: note.actionItems.map((item) => (item.id === itemId ? { ...item, status } : item)),
        };
      })
    );
  };

  const handleAddGanttTask = (task: GanttTask) => {
    setGanttTasks((prev) => [...prev, task]);
  };

  const handleUpdateGanttTask = (task: GanttTask) => {
    setGanttTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  };

  const handleUpdateOkrKeyResult = (okrId: string, krId: string, currentVal: number) => {
    setProjectOkrs((prev) =>
      prev.map((okr) => {
        if (okr.id !== okrId) return okr;
        return {
          ...okr,
          keyResults: okr.keyResults.map((kr) => (kr.id === krId ? { ...kr, current: currentVal } : kr)),
        };
      })
    );
  };

  const handleImportData = (
    data: {
      processes?: Process[];
      systems?: SystemItem[];
      profile?: UserProfile;
      improvementItems?: ImprovementItem[];
      notifications?: UserNotification[];
      adminBroadcastLogs?: NotificationLog[];
    },
    mode: 'merge' | 'overwrite'
  ) => {
    if (mode === 'overwrite') {
      if (data.profile) {
        localStorage.setItem(STORAGE.profile, JSON.stringify(data.profile));
        setProfile(data.profile);
        setCurrentPersona(data.profile.role);
      }
      if (data.processes) {
        setProcesses(data.processes);
      }
      if (data.systems) {
        setAvailableSystems(data.systems);
      }
      if (data.improvementItems) {
        setImprovementItems(data.improvementItems);
      }
      if (data.notifications) {
        setNotifications(data.notifications);
      }
      if (data.adminBroadcastLogs) {
        setAdminBroadcastLogs(data.adminBroadcastLogs);
      }
    } else {
      if (data.profile && !profile) {
        localStorage.setItem(STORAGE.profile, JSON.stringify(data.profile));
        setProfile(data.profile);
        setCurrentPersona(data.profile.role);
      }
      
      if (data.processes) {
        setProcesses((prev) => {
          const merged = [...prev];
          data.processes!.forEach((importedProc) => {
            const index = merged.findIndex((p) => p.id === importedProc.id);
            if (index > -1) {
              merged[index] = importedProc;
            } else {
              merged.push(importedProc);
            }
          });
          return merged;
        });
      }

      if (data.systems) {
        setAvailableSystems((prev) => {
          const merged = [...prev];
          data.systems!.forEach((importedSys) => {
            const index = merged.findIndex((s) => s.id === importedSys.id || s.name.toLowerCase() === importedSys.name.toLowerCase());
            if (index > -1) {
              merged[index] = {
                ...merged[index],
                ...importedSys,
                processCount: Math.max(merged[index].processCount, importedSys.processCount),
              };
            } else {
              merged.push(importedSys);
            }
          });
          return merged;
        });
      }

      if (data.improvementItems) {
        setImprovementItems((prev) => {
          const merged = [...prev];
          data.improvementItems!.forEach((importedImp) => {
            if (!merged.some((item) => item.id === importedImp.id)) {
              merged.push(importedImp);
            }
          });
          return merged;
        });
      }

      if (data.notifications) {
        setNotifications((prev) => {
          const merged = [...prev];
          data.notifications!.forEach((importedNotif) => {
            if (!merged.some((item) => item.id === importedNotif.id)) {
              merged.push(importedNotif);
            }
          });
          return merged;
        });
      }

      if (data.adminBroadcastLogs) {
        setAdminBroadcastLogs((prev) => {
          const merged = [...prev];
          data.adminBroadcastLogs!.forEach((importedLog) => {
            if (!merged.some((item) => item.id === importedLog.id)) {
              merged.push(importedLog);
            }
          });
          return merged;
        });
      }
    }
  };

  // ---------- Render current phase ----------
  if (phase === 'remoteLogin') {
    return <RemoteLogin onSignedIn={handleRemoteSignedIn} />;
  }

  if (phase === 'landing' || phase === 'onboarding') {
    return (
      <LandingPage
        registeredProfiles={registeredProfiles}
        onLogin={handleLandingLogin}
        sheetsSync={sheetsSync}
      />
    );
  }

  if (phase === 'locked' && profile) {
    return <LockScreen profile={profile} onUnlock={handleUnlock} onStartOver={handleStartOver} />;
  }

  if (phase === 'journey' && profile && profile.role !== 'Admin') {
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
          setWorkspaceTab('dashboard');
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
        onUpdateSystems={setAvailableSystems}
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
        projectsManaged={managedProjects}
        teamMembers={teamMembers}
        transcripts={transcripts}
        meetingNotes={meetingNotes}
        ganttTasks={ganttTasks}
        projectOkrs={projectOkrs}
        onUpdateProject={handleUpdateProject}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onAddTeamMember={handleAddTeamMember}
        onRemoveTeamMember={handleRemoveTeamMember}
        onAddTranscript={handleAddTranscript}
        onAddMeetingNote={handleAddMeetingNote}
        onUpdateMeetingNote={handleUpdateMeetingNote}
        onUpdateActionItemStatus={handleUpdateActionItemStatus}
        onAddGanttTask={handleAddGanttTask}
        onUpdateGanttTask={handleUpdateGanttTask}
        onUpdateOkrKeyResult={handleUpdateOkrKeyResult}
        onCaptureNew={() => setPhase('journey')}
        onLock={handleLock}
        onImportData={handleImportData}
      />
    );
  }

  // Fallback — inconsistent persisted state, restart cleanly.
  return isRemoteEnabled()
    ? <RemoteLogin onSignedIn={handleRemoteSignedIn} />
    : (
      <LandingPage
        registeredProfiles={registeredProfiles}
        onLogin={handleLandingLogin}
        sheetsSync={sheetsSync}
      />
    );
}
