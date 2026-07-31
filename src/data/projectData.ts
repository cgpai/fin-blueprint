import {
  ManagedProject,
  TeamMember,
  MeetingTranscript,
  MeetingNote,
  GanttTask,
  ProjectOKR,
} from '../types';

// Empty defaults — projects/teams are created in-app or imported via LocalDataHub.
export const INITIAL_MANAGED_PROJECTS: ManagedProject[] = [];
export const INITIAL_TEAM_MEMBERS: TeamMember[] = [];
export const INITIAL_TRANSCRIPTS: MeetingTranscript[] = [];
export const INITIAL_MEETING_NOTES: MeetingNote[] = [];
export const INITIAL_GANTT_TASKS: GanttTask[] = [];
export const INITIAL_PROJECT_OKRS: ProjectOKR[] = [];
