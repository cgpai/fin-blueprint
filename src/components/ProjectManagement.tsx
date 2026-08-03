import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Users,
  FileText,
  Sparkles,
  Calendar,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Upload,
  Link as LinkIcon,
  Bell,
  Clock,
  ArrowRight,
  Info,
  Check,
  ChevronRight,
  Edit2,
  X,
  Mic,
  MicOff,
  Copy,
  ExternalLink,
  Sliders,
  Filter,
  FolderKanban,
} from 'lucide-react';
import {
  ManagedProject,
  TeamMember,
  MeetingTranscript,
  MeetingNote,
  GanttTask,
  ProjectOKR,
  Persona,
  UserNotification,
  ProjectStage,
  Process,
} from '../types';
import { Avatar } from './ui';
import { uid, timeAgo } from '../lib/utils';
import { useT } from '../lib/i18n';

export default function ProjectManagement({
  projects,
  catalogueProcesses = [],
  teamMembers,
  transcripts,
  meetingNotes,
  ganttTasks,
  projectOkrs,
  notifications,
  currentPersona,
  profileName,
  profileEmail,
  onUpdateProject,
  onAddProject,
  onDeleteProject,
  onAddTeamMember,
  onRemoveTeamMember,
  onAddTranscript,
  onAddMeetingNote,
  onUpdateMeetingNote,
  onUpdateActionItemStatus,
  onAddGanttTask,
  onUpdateGanttTask,
  onUpdateOkrKeyResult,
  onMarkNotificationRead,
  onActionNotification,
  onNavigateToCatalogue,
}: {
  projects: ManagedProject[];
  catalogueProcesses?: Process[];
  teamMembers: TeamMember[];
  transcripts: MeetingTranscript[];
  meetingNotes: MeetingNote[];
  ganttTasks: GanttTask[];
  projectOkrs: ProjectOKR[];
  notifications: UserNotification[];
  currentPersona: Persona;
  profileName: string;
  profileEmail: string;
  onUpdateProject: (proj: ManagedProject) => void;
  onAddProject: (proj: ManagedProject) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTeamMember: (member: TeamMember) => void;
  onRemoveTeamMember: (memberId: string) => void;
  onAddTranscript: (transcript: MeetingTranscript) => void;
  onAddMeetingNote: (note: MeetingNote) => void;
  onUpdateMeetingNote: (note: MeetingNote) => void;
  onUpdateActionItemStatus: (noteId: string, itemId: string, status: 'pending' | 'sent' | 'acknowledged') => void;
  onAddGanttTask: (task: GanttTask) => void;
  onUpdateGanttTask: (task: GanttTask) => void;
  onUpdateOkrKeyResult: (okrId: string, krId: string, currentVal: number) => void;
  onMarkNotificationRead: (id: string) => void;
  onActionNotification: (id: string, response: string) => void;
  onNavigateToCatalogue?: (processId?: string) => void;
}) {
  const t = useT();

  const getStageBadgeLabel = (stage: ProjectStage) => {
    switch (stage) {
      case '4: Locked Project': return t('pm.stage4Badge');
      case '5: Tracked Execution': return t('pm.stage5Badge');
      case '6: Realised Benefit': return t('pm.stage6Badge');
      default: return stage;
    }
  };

  const getRoleLabel = (role: 'Lead' | 'Contributor' | 'Stakeholder') => {
    switch (role) {
      case 'Lead': return t('pm.role.lead');
      case 'Contributor': return t('pm.role.contributor');
      case 'Stakeholder': return t('pm.role.stakeholder');
    }
  };

  const getActionStatusLabel = (status: 'pending' | 'sent' | 'acknowledged') => t(`pm.actionStatus.${status}`);

  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');
  
  // Modals & form state
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [newPersonRole, setNewPersonRole] = useState<'Lead' | 'Contributor' | 'Stakeholder'>('Contributor');

  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestMode, setIngestMode] = useState<'upload' | 'paste' | 'mic'>('paste');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingParticipantsText, setMeetingParticipantsText] = useState(profileName);
  const [meetingRawText, setMeetingRawText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [micSeconds, setMicSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // AI Meeting Assistant processing state
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [reviewNote, setReviewNote] = useState<MeetingNote | null>(null);

  // Gantt task modal (Add & Edit)
  const [showAddGanttModal, setShowAddGanttModal] = useState(false);
  const [newGanttLabel, setNewGanttLabel] = useState('');
  const [newGanttStart, setNewGanttStart] = useState(new Date().toISOString().split('T')[0]);
  const [newGanttEnd, setNewGanttEnd] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [newGanttOwner, setNewGanttOwner] = useState(profileName);

  const [showEditGanttModal, setShowEditGanttModal] = useState(false);
  const [editingGanttTask, setEditingGanttTask] = useState<GanttTask | null>(null);

  // Deliverable Details & Links Modal
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedGanttTaskForDeliverables, setSelectedGanttTaskForDeliverables] = useState<GanttTask | null>(null);
  const [deliverableUrlInput, setDeliverableUrlInput] = useState('');
  const [deliverableNotesInput, setDeliverableNotesInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Notifications modal for L2 and L3
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const isL2orL3 = currentPersona === 'L2' || currentPersona === 'L3';
  const unreadAlerts = notifications.filter((n) => n.status === 'Unread');

  // Lock New Project modal (Catalogue Import workflow)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTarget, setNewProjTarget] = useState('');
  const [newProjTargetDate, setNewProjTargetDate] = useState('2026-12-31');
  const [selectedCatalogueProcessId, setSelectedCatalogueProcessId] = useState<string>('none');
  const [catalogueFilter, setCatalogueFilter] = useState<'automation_ai' | 'all'>('automation_ai');

  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);
  const [editingOwnerName, setEditingOwnerName] = useState('');
  const [editingOwnerEmail, setEditingOwnerEmail] = useState('');

  const [deletingProject, setDeletingProject] = useState<ManagedProject | null>(null);

  // Cleanup mic timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleMicrophone = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentSpeech = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentSpeech += event.results[i][0].transcript;
          }
          if (currentSpeech) {
            setMeetingRawText((prev) => (prev ? prev + ' ' + currentSpeech : currentSpeech));
          }
        };

        recognition.onerror = () => {
          // Fallback simulation if mic throws error inside sandboxed iframe
          fallbackSimulatedSpeech();
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
        setMicSeconds(0);
        timerRef.current = setInterval(() => setMicSeconds((s) => s + 1), 1000);
      } catch (e) {
        fallbackSimulatedSpeech();
      }
    } else {
      fallbackSimulatedSpeech();
    }
  };

  const fallbackSimulatedSpeech = () => {
    setIsListening(true);
    setMicSeconds(0);
    timerRef.current = setInterval(() => setMicSeconds((s) => s + 1), 1000);
    const speechText = "Live capture from microphone: Reviewed CIMB host-to-host feed variances. Agreed to set fuzzy matching threshold to 0.85 and route unmapped unit codes directly to L3 unit manager.";
    setMeetingRawText((prev) => (prev ? prev + "\n\n" + speechText : speechText));
  };

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  if (!currentProject) {
    return (
      <div className="card p-8 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-mute mx-auto" />
        <h3 className="font-display font-semibold text-lg">{t('pm.emptyTitle')}</h3>
        <p className="text-sm text-mute max-w-md mx-auto">
          {t('pm.emptyBody')}
        </p>
        <button
          onClick={() => {
            const newProj: ManagedProject = {
              id: uid('proj'),
              title: t('pm.defaultProjectTitle'),
              targetStatement: t('pm.defaultTargetStatement'),
              ownerName: profileName,
              ownerEmail: profileEmail,
              stage: '4: Locked Project',
              progressPercent: 10,
              targetDate: '2026-12-31',
            };
            onAddProject(newProj);
            setActiveProjectId(newProj.id);
          }}
          className="btn-dark"
        >
          <Plus size={16} /> {t('pm.createLockedProject')}
        </button>
      </div>
    );
  }

  // Filter project-specific data
  const currentTeam = teamMembers.filter((m) => m.projectId === currentProject.id);
  const currentTranscripts = transcripts.filter((t) => t.projectId === currentProject.id);
  const currentNotes = meetingNotes.filter((n) => n.projectId === currentProject.id);
  const currentGantt = ganttTasks.filter((g) => g.projectId === currentProject.id);
  const currentOkr = projectOkrs.find((o) => o.projectId === currentProject.id);

  // Submit new team member
  const handleAddPersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newPersonEmail.trim()) return;

    const newMember: TeamMember = {
      id: uid('tm'),
      projectId: currentProject.id,
      name: newPersonName.trim(),
      email: newPersonEmail.trim(),
      role: newPersonRole,
      addedBy: profileName,
    };
    onAddTeamMember(newMember);
    setNewPersonName('');
    setNewPersonEmail('');
    setShowAddPersonModal(false);
  };

  // Submit transcript ingestion & run AI Meeting Assistant
  const handleIngestTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingRawText.trim()) return;

    const participants = meetingParticipantsText
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    const newTranscript: MeetingTranscript = {
      id: uid('tr'),
      projectId: currentProject.id,
      date: meetingDate,
      title: meetingTitle.trim() || t('pm.defaultMeetingTitle'),
      participants: participants.length > 0 ? participants : [profileName],
      source: ingestMode,
      rawText: meetingRawText,
      fileName: uploadedFileName || undefined,
    };

    onAddTranscript(newTranscript);

    // Now invoke AI Assistant
    setIsProcessingAi(true);
    setShowIngestModal(false);

    try {
      const resp = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTranscript.title,
          date: newTranscript.date,
          participants: newTranscript.participants,
          rawText: newTranscript.rawText,
          teamMembers: currentTeam.map((m) => ({ name: m.name, email: m.email })),
        }),
      });

      if (!resp.ok) throw new Error(t('pm.error.meetingSummary'));
      const data = await resp.json();

      const draftNote: MeetingNote = {
        id: uid('mn'),
        projectId: currentProject.id,
        transcriptId: newTranscript.id,
        summary: data.summary || 'Summary generated.',
        decisions: data.decisions || [],
        openQuestions: data.openQuestions || [],
        actionItems: (data.actionItems || []).map((item: any) => ({
          id: uid('ai'),
          description: item.description,
          assigneeName: item.assigneeName || profileName,
          assigneeEmail: item.assigneeEmail || profileEmail,
          dueDate: item.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'pending',
        })),
        isFinalized: false,
        createdAt: new Date().toISOString(),
      };

      setReviewNote(draftNote);
    } catch (err) {
      console.error('Error invoking AI meeting assistant:', err);
      // Fallback draft note
      const fallbackNote: MeetingNote = {
        id: uid('mn'),
        projectId: currentProject.id,
        transcriptId: newTranscript.id,
        summary: t('pm.fallback.summary'),
        decisions: [t('pm.fallback.decision')],
        openQuestions: [t('pm.fallback.question')],
        actionItems: [
          {
            id: uid('ai'),
            description: t('pm.fallback.action'),
            assigneeName: profileName,
            assigneeEmail: profileEmail,
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            status: 'pending',
          },
        ],
        isFinalized: false,
        createdAt: new Date().toISOString(),
      };
      setReviewNote(fallbackNote);
    } finally {
      setIsProcessingAi(false);
      // Reset form
      setMeetingTitle('');
      setMeetingRawText('');
      setUploadedFileName('');
    }
  };

  // Confirm and finalize meeting note
  const handleConfirmAndSendNote = () => {
    if (!reviewNote) return;

    const finalizedNote: MeetingNote = {
      ...reviewNote,
      isFinalized: true,
      actionItems: reviewNote.actionItems.map((item) => ({
        ...item,
        status: 'sent', // Simulate auto-sending email to assignee
      })),
    };

    onAddMeetingNote(finalizedNote);
    setReviewNote(null);
  };

  // Add new Gantt task
  const handleAddGanttSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGanttLabel.trim()) return;

    const newTask: GanttTask = {
      id: uid('gt'),
      projectId: currentProject.id,
      label: newGanttLabel.trim(),
      startDate: newGanttStart,
      endDate: newGanttEnd,
      progress: 0,
      owner: newGanttOwner,
    };

    onAddGanttTask(newTask);
    setNewGanttLabel('');
    setShowAddGanttModal(false);
  };

  // Stage styles
  const getStageBadge = (stage: ProjectStage) => {
    switch (stage) {
      case '4: Locked Project':
        return <span className="chip bg-veil border-line text-ink font-semibold">{t('pm.stage4Badge')}</span>;
      case '5: Tracked Execution':
        return <span className="chip bg-citron-soft border-citron/50 text-citron-deep font-semibold">{t('pm.stage5Badge')}</span>;
      case '6: Realised Benefit':
        return <span className="chip bg-emerald-100 text-emerald-800 font-semibold border-emerald-200">{t('pm.stage6Badge')}</span>;
      default:
        return <span className="chip">{stage}</span>;
    }
  };

  return (
    <div className="animate-fade-up space-y-6">
      {/* Top Header & L2/L3 In-App Alerts Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t('pm.title')}</h2>
            <span className="chip bg-ink text-citron font-medium text-xs">{t('pm.stagesBadge')}</span>
          </div>
          <p className="text-sm text-mute mt-0.5">
            {t('pm.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* L2 & L3 In-App Alerts Toggle Button */}
          {isL2orL3 && (
            <button
              onClick={() => setShowAlertsModal(true)}
              className="btn-ghost relative flex items-center gap-2 !py-2 !px-3"
              title={t('pm.inAppAlertsTitle')}
            >
              <Bell size={16} className="text-ink" />
              <span className="text-xs font-medium">{t('pm.inAppAlerts')}</span>
              {unreadAlerts.length > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-citron text-ink text-[10px] font-bold grid place-items-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="btn-dark !py-2 !px-3.5 text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> {t('pm.lockNewProject')}
          </button>
        </div>
      </div>

      {/* Horizontal Tab Strip Across Top (One tab per locked project) */}
      <div className="card p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {projects.map((proj) => {
          const isActive = proj.id === currentProject.id;
          return (
            <div key={proj.id} className="relative group shrink-0">
              <button
                onClick={() => setActiveProjectId(proj.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-ink text-white shadow-lift'
                    : 'bg-white hover:bg-veil/60 text-ink border border-line'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold max-w-[200px] truncate">{proj.title}</span>
                  <span className={`text-[10px] ${isActive ? 'text-citron font-medium' : 'text-mute'}`}>
                    {getStageBadgeLabel(proj.stage)} · {proj.progressPercent}%
                  </span>
                </div>
                <ChevronRight size={14} className={isActive ? 'text-citron' : 'text-mute'} />
              </button>

              {(isL2orL3 || currentPersona === 'Admin') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProject(proj);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-line text-rose-500 items-center justify-center hidden group-hover:flex hover:bg-rose-50 transition-all cursor-pointer shadow-sm z-10"
                  title={t('pm.eraseProjectTitle')}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Project Content Grid */}
      <div className="space-y-6">
        {/* Section 1: Overview Header */}
        <div className="card p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-display text-2xl font-semibold tracking-tight">{currentProject.title}</h3>
                {getStageBadge(currentProject.stage)}
              </div>

              <p className="text-sm text-inksoft leading-relaxed max-w-3xl">{currentProject.targetStatement}</p>

              {currentProject.linkedEngineTitle && (
                <div className="flex items-center gap-2 text-xs text-mute pt-1">
                  <LinkIcon size={13} className="text-veil-deep" />
                  <span>{t('pm.linkedEngine')}</span>
                  <button
                    onClick={() => onNavigateToCatalogue?.(currentProject.linkedProcessId)}
                    className="font-medium text-ink hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {currentProject.linkedEngineTitle} <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Stage Selector & Owner Details */}
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0 bg-canvas p-4 rounded-2xl border border-line relative group">
              {(isL2orL3 || currentPersona === 'Admin') && (
                <button
                  onClick={() => {
                    setEditingOwnerName(currentProject.ownerName);
                    setEditingOwnerEmail(currentProject.ownerEmail);
                    setShowEditOwnerModal(true);
                  }}
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white border border-line text-mute flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-ink hover:border-ink transition-all cursor-pointer shadow-sm"
                  title={t('pm.assignOwnerTitle')}
                >
                  <Edit2 size={12} />
                </button>
              )}
              <div className="text-right">
                <span className="text-[11px] font-semibold text-mute block">{t('pm.projectOwner')}</span>
                <span className="text-xs font-bold text-ink">{currentProject.ownerName}</span>
                <span className="text-[10px] text-faint block">{currentProject.ownerEmail}</span>
              </div>

              <div className="w-full text-right">
                <label className="text-[10px] font-semibold text-mute block mb-1">{t('pm.changeStage')}</label>
                <select
                  value={currentProject.stage}
                  onChange={(e) =>
                    onUpdateProject({
                      ...currentProject,
                      stage: e.target.value as ProjectStage,
                    })
                  }
                  className="field !py-1 !px-2 text-xs font-medium cursor-pointer"
                >
                  <option value="4: Locked Project">{t('pm.stage4')}</option>
                  <option value="5: Tracked Execution">{t('pm.stage5')}</option>
                  <option value="6: Realised Benefit">{t('pm.stage6')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-ink">{t('pm.overallProgress')}</span>
              <span className="font-bold text-ink">{t('pm.percentComplete', { percent: currentProject.progressPercent })}</span>
            </div>
            <div className="w-full bg-veil h-3 rounded-full overflow-hidden p-0.5 border border-line">
              <div
                className="bg-citron-deep h-full rounded-full transition-all duration-500"
                style={{ width: `${currentProject.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-faint">
              <span>{t('pm.targetLaunch', { date: currentProject.targetDate })}</span>
              <span>{t('pm.stageProgressHint')}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Team */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-ink" />
              <h3 className="font-display font-semibold text-base">{t('pm.projectTeam')}</h3>
              <span className="text-xs text-mute font-medium">{t('pm.membersCount', { count: currentTeam.length })}</span>
            </div>

            <button
              onClick={() => setShowAddPersonModal(true)}
              className="btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> {t('pm.addPerson')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-canvas border border-line hover:border-veil-deep/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.name} size={36} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink truncate">{member.name}</div>
                    <div className="text-[10px] text-faint truncate">{member.email}</div>
                    <span className="chip bg-veil/80 border-transparent text-[9px] mt-1">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>

                {member.role !== 'Lead' && (
                  <button
                    onClick={() => onRemoveTeamMember(member.id)}
                    className="text-faint hover:text-warn p-1 cursor-pointer transition-colors"
                    title={t('pm.removeMemberTitle')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Meeting Transcripts & Ingestion */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-ink" />
                <h3 className="font-display font-semibold text-base">{t('pm.transcriptsTitle')}</h3>
              </div>
              <p className="text-xs text-mute mt-0.5">{t('pm.transcriptsSubtitle')}</p>
            </div>

            <button
              onClick={() => setShowIngestModal(true)}
              className="btn-dark !py-1.5 !px-3.5 text-xs flex items-center gap-1.5"
            >
              <Upload size={14} /> {t('pm.ingestTranscript')}
            </button>
          </div>

          {/* Callout Banner for Engineering Team (Live Capture Note) */}
          <div className="p-4 rounded-2xl bg-citron-soft/50 border border-citron/40 text-xs text-inksoft flex items-start gap-3">
            <Info size={16} className="text-citron-deep shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-ink block">{t('pm.engineeringNoteTitle')}</span>
              <p className="leading-relaxed text-[11px]">
                {t('pm.engineeringNoteBody')}
              </p>
            </div>
          </div>

          {/* List of ingested transcripts */}
          {currentTranscripts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-line rounded-2xl text-xs text-mute">
              {t('pm.noTranscripts')}
            </div>
          ) : (
            <div className="space-y-3">
              {currentTranscripts.map((tr) => (
                <div key={tr.id} className="p-4 rounded-2xl bg-canvas border border-line space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-veil-deep" />
                      <span className="text-xs font-bold text-ink">{tr.title}</span>
                      <span className="chip bg-veil text-[10px]">{tr.date}</span>
                      {tr.fileName && <span className="chip bg-blush text-[10px]">{tr.fileName}</span>}
                    </div>
                    <span className="text-[10px] text-faint">
                      {t('pm.participants', { names: tr.participants.join(', ') })}
                    </span>
                  </div>
                  <p className="text-xs text-mute line-clamp-2 italic bg-white p-2.5 rounded-xl border border-line/60">
                    &quot;{tr.rawText.slice(0, 180)}...&quot;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: AI Meeting Assistant */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-citron-deep" />
              <h3 className="font-display font-semibold text-base">{t('pm.aiAssistantTitle')}</h3>
            </div>
            {isProcessingAi && (
              <span className="text-xs font-semibold text-citron-deep flex items-center gap-1.5 animate-pulse">
                <Sparkles size={14} className="animate-spin" /> {t('pm.processingTranscript')}
              </span>
            )}
          </div>

          {/* Editable Review Card (Shown after running AI Assistant) */}
          {reviewNote && (
            <div className="p-5 rounded-2xl bg-citron-soft/30 border-2 border-citron-deep/30 space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <span className="chip bg-citron text-ink font-bold text-xs">{t('pm.reviewDraftBadge')}</span>
                <span className="text-xs text-mute">{t('pm.reviewBeforeConfirm')}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-ink block mb-1">{t('pm.executiveSummary')}</label>
                  <textarea
                    className="field text-xs min-h-16"
                    value={reviewNote.summary}
                    onChange={(e) => setReviewNote({ ...reviewNote, summary: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">{t('pm.decisionsMade')}</label>
                    <textarea
                      className="field text-xs min-h-20"
                      value={reviewNote.decisions.join('\n')}
                      onChange={(e) => setReviewNote({ ...reviewNote, decisions: e.target.value.split('\n').filter(Boolean) })}
                      placeholder={t('pm.onePerLine')}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink block mb-1">{t('pm.openQuestions')}</label>
                    <textarea
                      className="field text-xs min-h-20"
                      value={reviewNote.openQuestions.join('\n')}
                      onChange={(e) => setReviewNote({ ...reviewNote, openQuestions: e.target.value.split('\n').filter(Boolean) })}
                      placeholder={t('pm.oneQuestionPerLine')}
                    />
                  </div>
                </div>

                {/* Extracted Action Items */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink block">{t('pm.extractedActions')}</label>
                  {reviewNote.actionItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-white rounded-xl border border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          className="field !py-1 text-xs font-medium w-full"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...reviewNote.actionItems];
                            updated[idx].description = e.target.value;
                            setReviewNote({ ...reviewNote, actionItems: updated });
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="field !py-1 text-xs"
                          value={item.assigneeName}
                          onChange={(e) => {
                            const found = currentTeam.find((m) => m.name === e.target.value);
                            const updated = [...reviewNote.actionItems];
                            updated[idx].assigneeName = e.target.value;
                            if (found) updated[idx].assigneeEmail = found.email;
                            setReviewNote({ ...reviewNote, actionItems: updated });
                          }}
                        >
                          {currentTeam.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="date"
                          className="field !py-1 text-xs"
                          value={item.dueDate}
                          onChange={(e) => {
                            const updated = [...reviewNote.actionItems];
                            updated[idx].dueDate = e.target.value;
                            setReviewNote({ ...reviewNote, actionItems: updated });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button onClick={() => setReviewNote(null)} className="btn-ghost text-xs !py-1.5">
                  {t('pm.discard')}
                </button>
                <button onClick={handleConfirmAndSendNote} className="btn-dark text-xs !py-1.5 flex items-center gap-1.5">
                  <Send size={13} /> {t('pm.confirmDispatch')}
                </button>
              </div>
            </div>
          )}

          {/* Finalized Notes & Action Items Display */}
          {currentNotes.length === 0 && !reviewNote ? (
            <div className="text-center py-6 text-xs text-mute border border-line rounded-2xl">
              {t('pm.noMeetingNotes')}
            </div>
          ) : (
            <div className="space-y-4">
              {currentNotes.map((note) => (
                <div key={note.id} className="p-5 rounded-2xl bg-canvas border border-line space-y-4">
                  <div>
                    <div className="text-xs font-bold text-ink">{t('pm.meetingSummary')}</div>
                    <p className="text-xs text-inksoft mt-1 leading-relaxed">{note.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {note.decisions.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-line space-y-1">
                        <span className="font-bold text-ink flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600" /> {t('pm.decisions')}
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-mute space-y-1">
                          {note.decisions.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {note.openQuestions.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-line space-y-1">
                        <span className="font-bold text-ink flex items-center gap-1">
                          <Clock size={13} className="text-amber-600" /> {t('pm.openQuestionsLabel')}
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-mute space-y-1">
                          {note.openQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action items list */}
                  <div className="space-y-2 pt-2 border-t border-line">
                    <span className="text-xs font-bold text-ink block">{t('pm.actionItemsRouting')}</span>
                    <div className="space-y-2">
                      {note.actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white border border-line text-xs gap-3 flex-wrap"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Avatar name={item.assigneeName} size={28} />
                            <div className="min-w-0">
                              <div className="font-semibold text-ink truncate">{item.description}</div>
                              <div className="text-[10px] text-faint">
                                {item.assigneeName} ({item.assigneeEmail}) · {t('pm.dueDate', { date: item.dueDate })}
                              </div>
                            </div>
                          </div>

                          {/* Status pill selector */}
                          <div className="flex items-center gap-1 shrink-0">
                            {(['pending', 'sent', 'acknowledged'] as const).map((st) => (
                              <button
                                key={getActionStatusLabel(st)}
                                onClick={() => onUpdateActionItemStatus(note.id, item.id, st)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize transition-all cursor-pointer ${
                                  item.status === st
                                    ? st === 'acknowledged'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : st === 'sent'
                                      ? 'bg-citron-soft text-citron-deep border border-citron'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'text-faint hover:text-ink'
                                }`}
                              >
                                {getActionStatusLabel(st)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Project Timeline (Gantt Chart) */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-ink" />
                <h3 className="font-display font-semibold text-base">{t('pm.ganttTitle')}</h3>
              </div>
              <p className="text-xs text-mute mt-0.5">{t('pm.ganttSubtitle', { date: currentProject.targetDate })}</p>
            </div>

            <button
              onClick={() => setShowAddGanttModal(true)}
              className="btn-dark !py-1.5 !px-3 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> {t('pm.addPhaseTask')}
            </button>
          </div>

          {/* Interactive Gantt Chart Display */}
          <div className="space-y-4 bg-canvas p-5 rounded-2xl border border-line">
            {/* Timeline Header Date Axis */}
            <div className="flex justify-between items-center text-[10px] font-bold text-faint border-b border-line pb-2">
              <span>JUN 2026</span>
              <span>JUL 2026</span>
              <span>AUG 2026</span>
              <span>SEP 2026</span>
              <span>OCT 2026</span>
              <span>NOV 2026</span>
            </div>

            <div className="space-y-3 relative">
              {/* Target Date Vertical Line Marker */}
              <div
                className="absolute top-0 bottom-0 border-r-2 border-dashed border-warn/70 z-10 flex flex-col justify-start"
                style={{ left: '72%' }}
                title={t('pm.targetDateTitle', { date: currentProject.targetDate })}
              >
                <span className="text-[9px] font-bold bg-blush text-warn px-1 rounded -translate-x-1/2">
                  {t('pm.targetLabel', { date: currentProject.targetDate })}
                </span>
              </div>

              {currentGantt.map((task) => (
                <div key={task.id} className="p-3 bg-white rounded-2xl border border-line space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{task.label}</span>
                      {task.owner && (
                        <span className="chip bg-veil text-[10px] text-inksoft font-medium">
                          {t('pm.leadOwner', { name: task.owner })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-faint">
                        {t('pm.dateRange', { start: task.startDate, end: task.endDate, progress: task.progress })}
                      </span>

                      {/* Details & Output Links Button */}
                      <button
                        onClick={() => {
                          setSelectedGanttTaskForDeliverables(task);
                          setDeliverableUrlInput(task.deliverableUrl || '');
                          setDeliverableNotesInput(task.notes || '');
                          setShowDeliverableModal(true);
                        }}
                        className="btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1 cursor-pointer hover:bg-citron-soft hover:text-ink transition-colors"
                        title={t('pm.outputLinkTitle')}
                      >
                        <FolderKanban size={13} className={task.deliverableUrl ? 'text-citron-deep' : 'text-faint'} />
                        <span>{task.deliverableUrl ? t('pm.outputLinked') : t('pm.detailsLink')}</span>
                      </button>

                      {/* Edit Phase Menu Button */}
                      <button
                        onClick={() => {
                          setEditingGanttTask(task);
                          setShowEditGanttModal(true);
                        }}
                        className="btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1 cursor-pointer hover:bg-veil transition-colors"
                        title={t('pm.editPhaseTitle')}
                      >
                        <Edit2 size={13} className="text-ink" />
                        <span>{t('pm.editPhase')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Gantt Bar Container */}
                  <div className="w-full bg-canvas h-7 rounded-xl border border-line relative overflow-hidden flex items-center px-3">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-citron-soft/80 border-r-2 border-citron-deep rounded-l-xl transition-all duration-300"
                      style={{ width: `${Math.max(8, task.progress)}%` }}
                    />
                    <div className="relative z-10 w-full flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-ink truncate">
                        {task.notes ? task.notes : t('pm.phaseProgress', { progress: task.progress })}
                      </span>
                      {task.deliverableUrl && (
                        <span className="font-bold text-citron-deep flex items-center gap-1">
                          <ExternalLink size={10} /> {task.deliverableUrl.replace(/https?:\/\//, '').slice(0, 28)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Project OKR */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-citron-deep" />
              <h3 className="font-display font-semibold text-base">{t('pm.okrTitle')}</h3>
            </div>
            {currentOkr && (
              <span className="chip bg-veil border-line text-xs font-semibold">
                {currentOkr.parentOkrLabel}
              </span>
            )}
          </div>

          {currentOkr ? (
            <div className="p-5 rounded-2xl bg-canvas border border-line space-y-4">
              <div>
                <span className="text-[10px] font-bold text-faint uppercase block">{t('pm.objective')}</span>
                <p className="text-sm font-bold text-ink mt-0.5">{currentOkr.objective}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentOkr.keyResults.map((kr) => {
                  const pct = Math.min(100, Math.round((kr.current / kr.target) * 100));
                  return (
                    <div key={kr.id} className="p-4 bg-white rounded-2xl border border-line space-y-3">
                      <div>
                        <span className="text-xs font-bold text-ink block">{kr.label}</span>
                        <span className="text-xs text-mute">
                          {t('pm.currentTarget', { current: kr.current, target: kr.target, unit: kr.unit })}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-veil h-2 rounded-full overflow-hidden">
                          <div className="bg-citron-deep h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-faint">
                          <span>{t('pm.progress')}</span>
                          <span className="font-bold text-ink">{pct}%</span>
                        </div>
                      </div>

                      {/* Interactive adjustment slider */}
                      <input
                        type="range"
                        min="0"
                        max={kr.target * 1.2 || 100}
                        value={kr.current}
                        onChange={(e) => onUpdateOkrKeyResult(currentOkr.id, kr.id, parseFloat(e.target.value))}
                        className="w-full accent-ink h-1 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-mute border border-line rounded-2xl">
              {t('pm.noOkrs')}
            </div>
          )}
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.addPersonTitle')}</h3>
              <button onClick={() => setShowAddPersonModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPersonSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">{t('pm.modal.fullName')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('pm.modal.fullNamePlaceholder')}
                  className="field text-xs"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">{t('pm.modal.email')}</label>
                <input
                  type="email"
                  required
                  placeholder={t('pm.modal.emailPlaceholder')}
                  className="field text-xs"
                  value={newPersonEmail}
                  onChange={(e) => setNewPersonEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">{t('pm.modal.role')}</label>
                <select
                  className="field text-xs"
                  value={newPersonRole}
                  onChange={(e) => setNewPersonRole(e.target.value as any)}
                >
                  <option value="Contributor">{t('pm.role.contributor')}</option>
                  <option value="Lead">{t('pm.role.lead')}</option>
                  <option value="Stakeholder">{t('pm.role.stakeholder')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setShowAddPersonModal(false)} className="btn-ghost text-xs">{t('pm.modal.cancel')}</button>
                <button type="submit" className="btn-dark text-xs">
                  {t('pm.modal.addMember')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ingest Transcript / Call Notes Modal (with Speech-to-Text Microphone) */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.ingestTitle')}</h3>
                <p className="text-xs text-mute">{t('pm.modal.ingestSubtitle')}</p>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-1.5 p-1 bg-veil rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setIngestMode('paste')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  ingestMode === 'paste' ? 'bg-white shadow-lift text-ink' : 'text-mute'
                }`}
              >
                {t('pm.modal.directPaste')}
              </button>
              <button
                type="button"
                onClick={() => setIngestMode('mic')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  ingestMode === 'mic' ? 'bg-white shadow-lift text-ink' : 'text-mute'
                }`}
              >
                <Mic size={13} className={isListening ? 'text-warn animate-pulse' : ''} />
                {t('pm.modal.liveMic')}
              </button>
              <button
                type="button"
                onClick={() => setIngestMode('upload')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  ingestMode === 'upload' ? 'bg-white shadow-lift text-ink' : 'text-mute'
                }`}
              >
                {t('pm.modal.uploadFile')}
              </button>
            </div>

            <form onSubmit={handleIngestTranscript} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.meetingTitle')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('pm.modal.meetingTitlePlaceholder')}
                  className="field"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.date')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.participants')}</label>
                  <input
                    type="text"
                    placeholder={t('pm.modal.participantsPlaceholder')}
                    className="field"
                    value={meetingParticipantsText}
                    onChange={(e) => setMeetingParticipantsText(e.target.value)}
                  />
                </div>
              </div>

              {ingestMode === 'mic' ? (
                <div className="p-4 rounded-2xl bg-canvas border border-line space-y-3 text-center">
                  <div className="flex items-center justify-between text-xs text-inksoft">
                    <span className="font-bold">{t('pm.modal.micLabel')}</span>
                    {isListening && (
                      <span className="chip bg-blush text-warn font-bold text-[10px] animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-warn animate-ping" />
                        {t('pm.modal.recording', { time: `${Math.floor(micSeconds / 60)}:${(micSeconds % 60).toString().padStart(2, '0')}` })}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={toggleMicrophone}
                    className={`mx-auto p-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lift ${
                      isListening ? 'bg-warn text-white animate-pulse' : 'bg-ink text-citron hover:bg-inksoft'
                    }`}
                  >
                    {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                    <span className="font-bold text-xs">
                      {isListening ? t('pm.modal.stopRecording') : t('pm.modal.startMic')}
                    </span>
                  </button>

                  <p className="text-[11px] text-faint">
                    {isListening
                      ? t('pm.modal.micActiveHint')
                      : t('pm.modal.micIdleHint')}
                  </p>

                  <textarea
                    rows={5}
                    placeholder={t('pm.modal.transcriptPlaceholder')}
                    className="field text-xs bg-white"
                    value={meetingRawText}
                    onChange={(e) => setMeetingRawText(e.target.value)}
                  />
                </div>
              ) : ingestMode === 'upload' ? (
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.uploadLabel')}</label>
                  <div className="border-2 border-dashed border-line rounded-xl p-6 text-center space-y-2">
                    <Upload className="mx-auto text-mute" size={24} />
                    <p className="text-xs text-mute">{t('pm.modal.uploadHint')}</p>
                    {uploadedFileName && (
                      <span className="chip bg-citron-soft text-citron-deep font-bold text-xs block mx-auto max-w-xs truncate">
                        {uploadedFileName}
                      </span>
                    )}
                    <input
                      type="file"
                      accept=".txt,.docx,.pdf,.mp3"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setMeetingRawText((ev.target?.result as string) || file.name);
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="text-xs cursor-pointer block mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.rawNotes')}</label>
                  <textarea
                    required
                    rows={6}
                    placeholder={t('pm.modal.rawNotesPlaceholder')}
                    className="field"
                    value={meetingRawText}
                    onChange={(e) => setMeetingRawText(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setShowIngestModal(false)} className="btn-ghost">{t('pm.modal.cancel')}</button>
                <button type="submit" className="btn-dark flex items-center gap-1.5">
                  <Sparkles size={14} /> {t('pm.modal.processWithAi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Gantt Task Modal */}
      {showAddGanttModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.addGanttTitle')}</h3>
              <button onClick={() => setShowAddGanttModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddGanttSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.phaseLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('pm.modal.phaseLabelPlaceholder')}
                  className="field"
                  value={newGanttLabel}
                  onChange={(e) => setNewGanttLabel(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.startDate')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={newGanttStart}
                    onChange={(e) => setNewGanttStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.endDate')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={newGanttEnd}
                    onChange={(e) => setNewGanttEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.phaseLead')}</label>
                <input
                  type="text"
                  className="field"
                  value={newGanttOwner}
                  onChange={(e) => setNewGanttOwner(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setShowAddGanttModal(false)} className="btn-ghost">{t('pm.modal.cancel')}</button>
                <button type="submit" className="btn-dark">
                  {t('pm.modal.addPhase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Gantt Task Modal */}
      {showEditGanttModal && editingGanttTask && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.editGanttTitle')}</h3>
              <button onClick={() => setShowEditGanttModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateGanttTask(editingGanttTask);
                setShowEditGanttModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.phaseTitle')}</label>
                <input
                  type="text"
                  required
                  className="field"
                  value={editingGanttTask.label}
                  onChange={(e) => setEditingGanttTask({ ...editingGanttTask, label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.startDate')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={editingGanttTask.startDate}
                    onChange={(e) => setEditingGanttTask({ ...editingGanttTask, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.endDate')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={editingGanttTask.endDate}
                    onChange={(e) => setEditingGanttTask({ ...editingGanttTask, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-ink block">{t('pm.modal.progressPercentage')}</label>
                  <span className="font-bold text-citron-deep">{editingGanttTask.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingGanttTask.progress}
                  onChange={(e) =>
                    setEditingGanttTask({ ...editingGanttTask, progress: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-ink h-2 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.phaseOwner')}</label>
                <input
                  type="text"
                  className="field"
                  value={editingGanttTask.owner || ''}
                  onChange={(e) => setEditingGanttTask({ ...editingGanttTask, owner: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.deliverableUrl')}</label>
                <input
                  type="url"
                  placeholder={t('pm.modal.deliverableUrlPlaceholder')}
                  className="field"
                  value={editingGanttTask.deliverableUrl || ''}
                  onChange={(e) => setEditingGanttTask({ ...editingGanttTask, deliverableUrl: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setShowEditGanttModal(false)} className="btn-ghost">{t('pm.modal.cancel')}</button>
                <button type="submit" className="btn-dark">
                  {t('pm.modal.savePhase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliverable Details & Output Links Modal */}
      {showDeliverableModal && selectedGanttTaskForDeliverables && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <FolderKanban size={18} className="text-citron-deep" />
                <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.deliverablesTitle')}</h3>
              </div>
              <button onClick={() => setShowDeliverableModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-canvas rounded-2xl border border-line space-y-1">
              <span className="text-[10px] font-bold text-faint uppercase block">{t('pm.modal.phaseName')}</span>
              <div className="text-xs font-bold text-ink">{selectedGanttTaskForDeliverables.label}</div>
              <div className="text-[10px] text-mute">
                {t('pm.modal.leadProgress', { owner: selectedGanttTaskForDeliverables.owner || t('pm.modal.unassigned'), progress: selectedGanttTaskForDeliverables.progress })}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.folderUrl')}</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder={t('pm.modal.folderUrlPlaceholder')}
                    className="field flex-1"
                    value={deliverableUrlInput}
                    onChange={(e) => setDeliverableUrlInput(e.target.value)}
                  />
                  {deliverableUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deliverableUrlInput);
                        setCopiedToast(true);
                        setTimeout(() => setCopiedToast(false), 2000);
                      }}
                      className="btn-ghost !py-1.5 !px-3 flex items-center gap-1 shrink-0 cursor-pointer"
                      title={t('pm.modal.copyLinkTitle')}
                    >
                      <Copy size={13} />
                      <span>{copiedToast ? t('pm.modal.copied') : t('pm.modal.copy')}</span>
                    </button>
                  )}
                </div>
              </div>

              {deliverableUrlInput && (
                <div className="pt-1">
                  <a
                    href={deliverableUrlInput}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !py-1.5 text-xs flex items-center justify-center gap-1.5 w-full text-citron-deep border-citron/40 bg-citron-soft/30 hover:bg-citron-soft"
                  >
                    <ExternalLink size={14} /> {t('pm.modal.openLink')}
                  </a>
                </div>
              )}

              <div>
                <label className="font-bold text-ink block mb-1">{t('pm.modal.deliverableNotes')}</label>
                <textarea
                  rows={3}
                  placeholder={t('pm.modal.deliverableNotesPlaceholder')}
                  className="field"
                  value={deliverableNotesInput}
                  onChange={(e) => setDeliverableNotesInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button type="button" onClick={() => setShowDeliverableModal(false)} className="btn-ghost">
                  {t('pm.modal.close')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...selectedGanttTaskForDeliverables,
                      deliverableUrl: deliverableUrlInput,
                      notes: deliverableNotesInput,
                    };
                    onUpdateGanttTask(updated);
                    setShowDeliverableModal(false);
                  }}
                  className="btn-dark"
                >
                  {t('pm.modal.saveDeliverable')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock New Project Modal (Catalogue Selection Workflow) */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.lockProjectTitle')}</h3>
                <p className="text-xs text-mute">{t('pm.modal.lockProjectSubtitle')}</p>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Filter toggle for catalogue */}
              <div className="flex items-center justify-between gap-2 p-2 bg-canvas rounded-2xl border border-line">
                <span className="font-bold text-ink flex items-center gap-1.5">
                  <Filter size={13} className="text-citron-deep" /> {t('pm.modal.catalogueSelection')}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCatalogueFilter('automation_ai')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                      catalogueFilter === 'automation_ai' ? 'bg-ink text-citron shadow-lift' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {t('pm.modal.filterAutomationAi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogueFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                      catalogueFilter === 'all' ? 'bg-ink text-citron shadow-lift' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {t('pm.modal.filterAllProcesses')}
                  </button>
                </div>
              </div>

              {/* Catalogue Process Radio Options */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <label
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedCatalogueProcessId === 'none'
                      ? 'border-ink bg-citron-soft/30 shadow-lift'
                      : 'border-line hover:border-veil-deep/40 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="catalogueSelect"
                    checked={selectedCatalogueProcessId === 'none'}
                    onChange={() => setSelectedCatalogueProcessId('none')}
                    className="mt-0.5 accent-ink cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-ink block">{t('pm.modal.customInitiative')}</span>
                    <span className="text-[11px] text-mute">{t('pm.modal.customInitiativeDesc')}</span>
                  </div>
                </label>

                {catalogueProcesses
                  .filter((proc) => {
                    if (catalogueFilter === 'all') return true;
                    return (
                      proc.category === 'Automation & AI' ||
                      proc.isCandidateForAI ||
                      proc.title.toLowerCase().includes('automation') ||
                      proc.title.toLowerCase().includes('ai') ||
                      proc.title.toLowerCase().includes('bot') ||
                      proc.title.toLowerCase().includes('recon')
                    );
                  })
                  .map((proc) => (
                    <label
                      key={proc.id}
                      className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        selectedCatalogueProcessId === proc.id
                          ? 'border-ink bg-citron-soft/40 shadow-lift'
                          : 'border-line hover:border-veil-deep/40 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="catalogueSelect"
                        checked={selectedCatalogueProcessId === proc.id}
                        onChange={() => {
                          setSelectedCatalogueProcessId(proc.id);
                          setNewProjTitle(proc.title);
                          setNewProjTarget(proc.problemStatement || proc.aiOpportunity || `Automate ${proc.title} workflow.`);
                        }}
                        className="mt-0.5 accent-ink cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-ink truncate">{proc.title}</span>
                          <span className="chip bg-citron text-ink text-[9px] font-bold">
                            {proc.subFunction}
                          </span>
                        </div>
                        <p className="text-[11px] text-mute line-clamp-1 mt-0.5">
                          {proc.problemStatement || proc.aiOpportunity || t('pm.modal.automationCandidate')}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newProjTitle.trim()) return;

                  const selectedProc = catalogueProcesses?.find((p) => p.id === selectedCatalogueProcessId);

                  const newProj: ManagedProject = {
                    id: uid('proj'),
                    title: newProjTitle.trim(),
                    targetStatement: newProjTarget.trim() || t('pm.defaultAutomateWorkflow'),
                    ownerName: profileName,
                    ownerEmail: profileEmail,
                    stage: '4: Locked Project',
                    progressPercent: 10,
                    targetDate: newProjTargetDate,
                    linkedProcessId: selectedProc?.id,
                    linkedEngineTitle: selectedProc?.title,
                  };

                  onAddProject(newProj);
                  
                  if (selectedProc?.savedDeploymentPlan) {
                    const plan = selectedProc.savedDeploymentPlan;
                    
                    let prevTaskId: string | null = null;
                    const startDateObj = new Date();
                    
                    plan.deploymentSteps.forEach((step, idx) => {
                      const stepStart = new Date(startDateObj);
                      stepStart.setDate(stepStart.getDate() + (idx * 14));
                      
                      const stepEnd = new Date(stepStart);
                      stepEnd.setDate(stepEnd.getDate() + 14);
                      
                      const tId = uid('gt');
                      const newTask: GanttTask = {
                        id: tId,
                        projectId: newProj.id,
                        label: `${step.phase}: ${step.title}`,
                        startDate: stepStart.toISOString().split('T')[0],
                        endDate: stepEnd.toISOString().split('T')[0],
                        dependsOnId: prevTaskId,
                        progress: 0,
                        owner: profileName,
                        notes: step.description
                      };
                      onAddGanttTask(newTask);
                      prevTaskId = tId;
                    });
                  }

                  setActiveProjectId(newProj.id);
                  setShowNewProjectModal(false);
                  setNewProjTitle('');
                  setNewProjTarget('');
                  setSelectedCatalogueProcessId('none');
                }}
                className="space-y-3 pt-2 border-t border-line"
              >
                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.projectTitle')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('pm.modal.projectTitlePlaceholder')}
                    className="field"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.targetOutcome')}</label>
                  <textarea
                    rows={2}
                    placeholder={t('pm.modal.targetOutcomePlaceholder')}
                    className="field"
                    value={newProjTarget}
                    onChange={(e) => setNewProjTarget(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">{t('pm.modal.targetRealisationDate')}</label>
                  <input
                    type="date"
                    required
                    className="field"
                    value={newProjTargetDate}
                    onChange={(e) => setNewProjTargetDate(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <button type="button" onClick={() => setShowNewProjectModal(false)} className="btn-ghost">{t('pm.modal.cancel')}</button>
                  <button type="submit" className="btn-dark">
                    {t('pm.modal.importAndLock')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* In-App Alerts Modal for L2 & L3 Users */}
      {showAlertsModal && isL2orL3 && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-ink" />
                <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.alertsTitle')}</h3>
                <span className="chip bg-citron-soft text-citron-deep font-bold text-[10px]">
                  {t('pm.modal.viewBadge', { persona: currentPersona })}
                </span>
              </div>
              <button onClick={() => setShowAlertsModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-mute">{t('pm.modal.noAlerts')}</div>
            ) : (
              <div className="space-y-3 divide-y divide-line">
                {notifications.map((notif) => (
                  <div key={notif.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-xs ${notif.status === 'Unread' ? 'font-bold text-ink' : 'font-medium text-inksoft'}`}>
                          {notif.subject}
                        </div>
                        <div className="text-[10px] text-faint">
                          {t('pm.modal.fromSender', { name: notif.senderName, timeAgo: timeAgo(notif.timestamp) })}
                        </div>
                      </div>

                      {notif.status === 'Unread' && (
                        <button
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className="chip bg-citron text-ink text-[10px] font-bold cursor-pointer"
                        >
                          {t('pm.modal.markRead')}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-mute leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Owner Modal */}
      {showEditOwnerModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-fade-up space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line">
              <h3 className="font-display font-semibold text-base text-ink">{t('pm.modal.editOwnerTitle')}</h3>
              <button onClick={() => setShowEditOwnerModal(false)} className="text-mute hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-mute block mb-1">{t('pm.modal.ownerName')}</label>
                <input
                  type="text"
                  value={editingOwnerName}
                  onChange={(e) => setEditingOwnerName(e.target.value)}
                  className="field w-full text-xs"
                  placeholder={t('pm.modal.ownerNamePlaceholder')}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-mute block mb-1">{t('pm.modal.ownerEmail')}</label>
                <input
                  type="email"
                  value={editingOwnerEmail}
                  onChange={(e) => setEditingOwnerEmail(e.target.value)}
                  className="field w-full text-xs"
                  placeholder={t('pm.modal.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditOwnerModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:bg-canvas transition-colors cursor-pointer">{t('pm.modal.cancel')}</button>
              <button
                onClick={() => {
                  if (editingOwnerName && editingOwnerEmail) {
                    onUpdateProject({
                      ...currentProject,
                      ownerName: editingOwnerName,
                      ownerEmail: editingOwnerEmail,
                    });
                    setShowEditOwnerModal(false);
                  }
                }}
                className="btn-dark"
                disabled={!editingOwnerName || !editingOwnerEmail}
              >
                {t('pm.modal.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirm Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-fade-up space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 grid place-items-center mx-auto mb-2">
              <X size={24} />
            </div>
            <h3 className="font-display font-semibold text-lg text-ink">{t('pm.delete.title')}</h3>
            <p className="text-sm text-mute">
              {t('pm.delete.body', { title: deletingProject.title })}
            </p>

            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setDeletingProject(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-mute hover:bg-canvas transition-colors cursor-pointer w-full">{t('pm.delete.cancel')}</button>
              <button
                onClick={() => {
                  const isActive = deletingProject.id === currentProject.id;
                  onDeleteProject(deletingProject.id);
                  if (isActive && projects.length > 1) {
                    const otherProj = projects.find((p) => p.id !== deletingProject.id);
                    if (otherProj) setActiveProjectId(otherProj.id);
                  }
                  setDeletingProject(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer w-full"
              >
                {t('pm.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
