import { Process, User, SubFunction, ImprovementItem, SystemItem, UserNotification, NotificationLog } from '../types';

/** No seeded people — suggestions/rosters come from live process owners or remote users. */
export const MOCK_USERS: User[] = [];

// Canonical System Used Map — keep in sync with SYSTEM_MAP in server.ts.
export const MOCK_SYSTEMS: SystemItem[] = [
  {
    id: 'sys-kairos',
    name: 'KAIROS (Hospital Information System)',
    category: 'Clinical Data Layer',
    processCount: 4,
    description: 'Main hospital database containing patient registration, billing transactions, medical procedures, and electronic health records. Has a legacy SOAP API but mostly accessed via web UI.',
  },
  {
    id: 'sys-emr',
    name: 'EMR (Electronic Medical Record)',
    category: 'Clinical Data Layer',
    processCount: 2,
    description: 'Stores digital charts, doctor prescription notes, lab test orders, and diagnostic results. Primarily secure clinical read-only database with HL7 FHIR integrations.',
  },
  {
    id: 'sys-d365',
    name: 'Microsoft Dynamics 365 (ERP)',
    category: 'Enterprise Resource Planning (Financial Core)',
    processCount: 6,
    description: 'Core ERP financial ledger, general ledger accounting, accounts payable/receivable, inventory management. Supports standard REST APIs, Power Automate flows, and Webhooks.',
  },
  {
    id: 'sys-pr',
    name: 'Purchase Request (PR) & Vendor Portal',
    category: 'Procurement E-System',
    processCount: 2,
    description: 'Custom web tool used for raising purchasing requests, routing multi-stage manager approvals, and managing external vendor bids and purchase orders.',
  },
  {
    id: 'sys-djp',
    name: 'DJP Online e-Faktur',
    category: 'Tax Compliance Portal',
    processCount: 3,
    description: 'Government tax compliance portal for uploading tax invoices, downloading monthly withholding tax statements, and filing VAT returns. Extremely rules-bound XML formats.',
  },
  {
    id: 'sys-bpjs',
    name: 'BPJS e-Claim Portal',
    category: 'Insurance / Reinsurance Portal',
    processCount: 2,
    description: 'National insurance claim submission portal. Highly repetitive multi-step PDF uploads and manual eligibility checks. Requires manual CAPTCHA and has no official API.',
  },
  {
    id: 'sys-cimb',
    name: 'CIMB Niaga Cash Management',
    category: 'Corporate Banking Platform',
    processCount: 3,
    description: 'Corporate banking system for executing bulk vendor wire transfers, checking current cash balances, and pulling daily bank statement files (MT940/CSV). Supports host-to-host SFTP.',
  },
  {
    id: 'sys-powerbi',
    name: 'Microsoft Power BI',
    category: 'Analytics & Presentation Layer',
    processCount: 5,
    description: 'Business intelligence dashboards for financial analysis, operational KPI reporting, and departmental spend breakdowns. Connects directly to ERP database views.',
  },
  {
    id: 'sys-excel',
    name: 'Microsoft Excel',
    category: 'Analytics & Presentation Layer',
    processCount: 8,
    description: 'Local spreadsheet manipulation used for data formatting, ad-hoc pivot tables, journal entry preparations, and manual reconciliation of discordant source exports.',
  },
  {
    id: 'sys-ppt',
    name: 'Microsoft PowerPoint',
    category: 'Analytics & Presentation Layer',
    processCount: 3,
    description: 'Presentation deck builder for monthly business reviews, board meetings, and executive summaries. High manual compilation effort.',
  },
];

export const MOCK_PROCESSES: Process[] = [];

export const MOCK_NOTIFICATIONS: UserNotification[] = [];

export const MOCK_NOTIFICATION_LOGS: NotificationLog[] = [];

export const MOCK_IMPROVEMENT_ITEMS: ImprovementItem[] = [];

export const SUBFUNCTIONS_LIST: SubFunction[] = [
  'Procurement',
  'Financial Planning and Corporate Analysis',
  'System Accountant',
  'Power BI Data Control',
  'Financial Controller',
  'Tax Management',
  'Transactional Accounting',
  'Management Reporting',
  'Financial Analysis',
  'Management Report',
  'Account Receivable',
  'Corporate Finance',
  'Internal Audit',
  'Investment',
  'Revenue Assurance',
  'OPEX Optimisation',
  'CAPEX Control and Capital Investment',
  'Profitablity and Productivity',
];
