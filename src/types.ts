export type Persona = 'L1' | 'L2' | 'L3' | 'L4' | 'Admin';

/**
 * Lines of work — the fixed finance taxonomy. The AI must map every process to
 * exactly one of these; they are never mixed or combined.
 */
export type SubFunction =
  | 'Procurement'
  | 'Financial Planning and Corporate Analysis'
  | 'System Accountant'
  | 'Power BI Data Control'
  | 'Financial Controller'
  | 'Tax Management'
  | 'Transactional Accounting'
  | 'Management Reporting'
  | 'Financial Analysis'
  | 'Management Report'
  | 'Account Receivable'
  | 'Corporate Finance'
  | 'Internal Audit'
  | 'Investment'
  | 'Revenue Assurance'
  | 'OPEX Optimisation'
  | 'CAPEX Control and Capital Investment'
  | 'Profitablity and Productivity';

export interface ProcessStep {
  id: string;
  order: number;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  decisionPoints: string[];
  systems: string[];
  handOffs: string[];
  aiClassification?: 'agentic-ai' | 'automation' | 'human-in-the-loop';
  aiRationale?: string;
}

export interface Process {
  id: string;
  title: string;
  description: string;
  subFunction: SubFunction;
  ownerName: string;
  ownerEmail: string;
  ownerLevel: 'L2' | 'L3' | 'L4';
  status: 'Draft' | 'Submitted' | 'Refined' | 'Approved';
  steps: ProcessStep[];
  lastUpdated: string;
  completenessScore: number; // 0-100
  gaps: string[];
  isShared: boolean;
  taggedUsers: string[];
  effortRating?: number; // 1-5 (Volume, repetitive, rules, sensitivity)
  repetitivenessRating?: number; // 1-5
  volumeRating?: number; // 1-5
  errorSensitivityRating?: number; // 1-5
  automationSuitability?: number; // 0-100 score
  userOverrides?: Record<string, 'agentic-ai' | 'automation' | 'human-in-the-loop'>; // stepId -> classification
}

export interface User {
  id: string;
  name: string;
  email: string;
  level: Persona;
  subFunction: SubFunction | 'All';
  avatar: string;
}

export interface NotificationLog {
  id: string;
  senderName: string;
  targetType: 'individual' | 'level' | 'subfunction' | 'all';
  targetValue: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Sent' | 'Actioned';
  responsesCount?: number;
}

export interface UserNotification {
  id: string;
  senderName: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Unread' | 'Read' | 'Actioned';
  actionRequired?: boolean;
  actionType?: 'complete_process' | 'review_process' | 'general';
  targetProcessId?: string;
  responseText?: string;
}

export interface ImprovementItem {
  id: string;
  processId: string;
  processTitle: string;
  subFunction: SubFunction;
  recommendedSolution: 'Automation' | 'Agentic AI' | 'Simplification';
  status: 'Identified' | 'In Progress' | 'Resolved';
  ownerName: string;
  expectedImpact: string;
  realizedSavings?: string; // e.g. "40 hrs/month"
}

export interface SystemItem {
  id: string;
  name: string;
  category: string;
  processCount: number;
}

/* ---------- Onboarding / journey (new UX flow) ---------- */

export interface UserProfile {
  name: string;
  email?: string;
  role: Persona;
  passwordHash: string; // SHA-256 hex, local-only "re-access" gate
  createdAt: string;
}

export type AppPhase = 'landing' | 'onboarding' | 'locked' | 'journey' | 'workspace';

/**
 * A process being reviewed/edited inside the capture journey. One AI mining run
 * can produce several of these from a single narrative dump.
 */
export interface DraftProcess {
  id: string;
  title: string;
  subFunction: SubFunction | '';
  summary?: string;
  steps: ProcessStep[];
  isShared: boolean;
  taggedUsers: string[];
}

/** A working-output document the user uploads/pastes before AI mining. */
export interface WorkingOutput {
  id: string;
  name: string;
  kind: 'file' | 'pasted';
  text: string;
}

/** A single mined step within a mined process. */
export interface MinedStep {
  order: number;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  decisionPoints: string[];
  systems: string[];
  handOffs: string[];
  aiClassification: 'agentic-ai' | 'automation' | 'human-in-the-loop';
  aiRationale: string;
}

/** One distinct process the miner segmented out of the narrative. */
export interface MinedProcess {
  title: string;
  subFunction?: string;
  summary?: string;
  steps: MinedStep[];
}

/**
 * Browser mining result — one free-text dump segmented into N distinct
 * processes, each with its own structured steps.
 */
export interface MiningResult {
  processCount: number;
  overallSummary: string;
  processes: MinedProcess[];
}

/** Browser analysis result — refinement + classification + suitability. */
export interface AnalysisResult {
  refinedSteps: Array<{
    order: number;
    name: string;
    refinedDescription: string;
    suggestedInputs?: string[];
    suggestedOutputs?: string[];
    aiClassification: 'agentic-ai' | 'automation' | 'human-in-the-loop';
    aiRationale: string;
  }>;
  gaps: string[];
  automationSuitability: number;
  drivers: {
    volume: number;
    repetitiveness: number;
    ruleClarity: number;
    errorSensitivity: number;
    summary: string;
  };
  recommendedAction: string;
}
