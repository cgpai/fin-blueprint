import { Process, User, SubFunction, ImprovementItem, SystemItem, UserNotification, NotificationLog } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-cfo',
    name: 'Roy Widya, MBA',
    email: 'roy.widya@siloam.com',
    level: 'L1',
    subFunction: 'All',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Roy'
  },
  {
    id: 'user-cfo-1-fp',
    name: 'Aris Wijaya',
    email: 'aris.wijaya@siloam.com',
    level: 'L2',
    subFunction: 'Financial Planning and Corporate Analysis',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aris'
  },
  {
    id: 'user-cfo-1-acc',
    name: 'Lisa Natalia',
    email: 'lisa.natalia@siloam.com',
    level: 'L2',
    subFunction: 'Transactional Accounting',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lisa'
  },
  {
    id: 'user-cfo-2-tax',
    name: 'Dewi Kartika',
    email: 'dewi.kartika@siloam.com',
    level: 'L3',
    subFunction: 'Tax Management',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DewiK'
  },
  {
    id: 'user-cfo-2-bill',
    name: 'Agus Salim',
    email: 'agus.salim@siloam.com',
    level: 'L3',
    subFunction: 'Account Receivable',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Agus'
  },
  {
    id: 'user-cfo-3-ar',
    name: 'Budi Santoso',
    email: 'budi.santoso@siloam.com',
    level: 'L4',
    subFunction: 'Account Receivable',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Budi'
  },
  {
    id: 'user-cfo-3-ap',
    name: 'Siti Rahma',
    email: 'siti.rahma@siloam.com',
    level: 'L4',
    subFunction: 'Procurement',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Siti'
  },
  {
    id: 'user-cfo-3-tax',
    name: 'Dewi Pratama',
    email: 'dewi.pratama@siloam.com',
    level: 'L4',
    subFunction: 'Tax Management',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DewiP'
  },
  {
    id: 'user-cfo-3-fpa',
    name: 'Anwar Hakim',
    email: 'anwar.hakim@siloam.com',
    level: 'L4',
    subFunction: 'Financial Planning and Corporate Analysis',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anwar'
  },
  {
    id: 'user-admin',
    name: 'Jessica Tan',
    email: 'jessica.tan@siloam.com',
    level: 'Admin',
    subFunction: 'All',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jessica'
  }
];

// Canonical System Used Map — keep in sync with SYSTEM_MAP in src/lib/browserAi.ts.
export const MOCK_SYSTEMS: SystemItem[] = [
  { id: 'sys-kairos', name: 'KAIROS (Hospital Information System)', category: 'Clinical Data Layer', processCount: 4 },
  { id: 'sys-emr', name: 'EMR (Electronic Medical Record)', category: 'Clinical Data Layer', processCount: 2 },
  { id: 'sys-d365', name: 'Microsoft Dynamics 365 (ERP)', category: 'Enterprise Resource Planning (Financial Core)', processCount: 6 },
  { id: 'sys-pr', name: 'Purchase Request (PR) & Vendor Portal', category: 'Procurement E-System', processCount: 2 },
  { id: 'sys-djp', name: 'DJP Online e-Faktur', category: 'Tax Compliance Portal', processCount: 3 },
  { id: 'sys-bpjs', name: 'BPJS e-Claim Portal', category: 'Insurance / Reinsurance Portal', processCount: 2 },
  { id: 'sys-cimb', name: 'CIMB Niaga Cash Management', category: 'Corporate Banking Platform', processCount: 3 },
  { id: 'sys-powerbi', name: 'Microsoft Power BI', category: 'Analytics & Presentation Layer', processCount: 5 },
  { id: 'sys-excel', name: 'Microsoft Excel', category: 'Analytics & Presentation Layer', processCount: 8 },
  { id: 'sys-ppt', name: 'Microsoft PowerPoint', category: 'Analytics & Presentation Layer', processCount: 3 },
];

export const MOCK_PROCESSES: Process[] = [
  {
    id: 'proc-1',
    title: 'BPJS Claims Submission & Reconciliation',
    description: 'Manual retrieval, audit, and submission of BPJS Kesehatan hospital insurance claims, followed by bank ledger reconciliation against the ERP billing system to settle receivables across Siloam Hospital branches.',
    subFunction: 'Account Receivable',
    ownerName: 'Budi Santoso',
    ownerEmail: 'budi.santoso@siloam.com',
    ownerLevel: 'L4',
    status: 'Refined',
    lastUpdated: '2026-07-08T15:30:00Z',
    completenessScore: 100,
    gaps: [],
    isShared: true,
    taggedUsers: ['agus.salim@siloam.com', 'lisa.natalia@siloam.com'],
    effortRating: 5,
    repetitivenessRating: 5,
    volumeRating: 5,
    errorSensitivityRating: 4,
    automationSuitability: 92,
    steps: [
      {
        id: 'proc-1-step-1',
        order: 1,
        name: 'Retrieve patient billing records',
        description: 'Download daily discharged patient billings and insurance records from KAIROS Hospital Information System (HIS). Ensure all medical service codes are complete.',
        inputs: ['KAIROS discharged records', 'Doctor clinical code sheet'],
        outputs: ['Unsubmitted Patient claims roster (.xlsx)'],
        decisionPoints: ['Is clinical coding verified by medical team?'],
        systems: ['KAIROS (Hospital Information System)', 'Microsoft Excel'],
        handOffs: ['If clinical coding is missing, route back to ward admin.'],
        aiClassification: 'automation',
        aiRationale: 'This involves pulling and filtering structured reports from a clinical system with clear, rule-based queries. Highly suited for standard API automation or RPA.'
      },
      {
        id: 'proc-1-step-2',
        order: 2,
        name: 'INA-CBG billing verification',
        description: 'Verify patient billing files against BPJS INA-CBG rules to calculate expected reimbursement tariffs based on diagnoses and procedure codes.',
        inputs: ['INA-CBG tariff directory', 'Patient billing sheet'],
        outputs: ['Verified claims file'],
        decisionPoints: ['Does tariff match INA-CBG grouping?'],
        systems: ['KAIROS (Hospital Information System)', 'BPJS e-Claim Portal'],
        handOffs: ['Confirm tariff deviations with Finance Controller.'],
        aiClassification: 'agentic-ai',
        aiRationale: 'Matching medical narratives to tariff groupings requires reasoning over clinical documents, identifying inconsistencies, and handling exceptions. Gemini AI can interpret clinical summaries to validate code compliance.'
      },
      {
        id: 'proc-1-step-3',
        order: 3,
        name: 'Submit to BPJS e-Claim',
        description: 'Log in to the government BPJS e-Claim web portal, manually upload the verified clinical dossiers, and execute claim submissions.',
        inputs: ['Verified claim dossier', 'User portal credentials'],
        outputs: ['BPJS Receipt reference number', 'Online submission report'],
        decisionPoints: ['Did portal throw upload error?'],
        systems: ['BPJS e-Claim Portal'],
        handOffs: ['Forward submission log to Billing Supervisor.'],
        aiClassification: 'automation',
        aiRationale: 'Standard file upload and form entry into a government portal based on structured data. Easily handled by an automated bot.'
      },
      {
        id: 'proc-1-step-4',
        order: 4,
        name: 'Payment reconciliation and settlement',
        description: 'Retrieve BPJS settlement bank transfer reports from CIMB Niaga, and reconcile outstanding Billing AR entries in D365 ERP Finance ledger.',
        inputs: ['Bank credit advice', 'AR open item ledger'],
        outputs: ['Cleared accounts report', 'VAT reconciliation log'],
        decisionPoints: ['Does transfer amount match claims exactly?', 'How to handle short-payments?'],
        systems: ['CIMB Niaga Cash Management', 'Microsoft Dynamics 365 (ERP)', 'Microsoft Excel'],
        handOffs: ['Escalate claims shortfalls exceeding 5% to Billing Manager.'],
        aiClassification: 'agentic-ai',
        aiRationale: 'Reconciling unmatched bank postings to medical accounts requires matching names, clinical references, and identifying reasons for under-payments. Needs fuzzy matching and reasoning.'
      }
    ]
  },
  {
    id: 'proc-2',
    title: 'Vendor Invoice 3-Way Match & AP Voucher Generation',
    description: 'Process raw vendor invoices for pharmaceutical and clinical supply procurements. Conduct a three-way verification between purchase orders, physical goods receipts, and invoices in D365 ERP to generate AP vouchers.',
    subFunction: 'Procurement',
    ownerName: 'Siti Rahma',
    ownerEmail: 'siti.rahma@siloam.com',
    ownerLevel: 'L4',
    status: 'Refined',
    lastUpdated: '2026-07-07T09:15:00Z',
    completenessScore: 100,
    gaps: [],
    isShared: false,
    taggedUsers: [],
    effortRating: 4,
    repetitivenessRating: 5,
    volumeRating: 5,
    errorSensitivityRating: 5,
    automationSuitability: 85,
    steps: [
      {
        id: 'proc-2-step-1',
        order: 1,
        name: 'Receive and extract vendor invoice details',
        description: 'Ingest raw PDF invoices arriving in the finance shared inbox from pharma suppliers (e.g. Kalbe, Kimia Farma). Extract invoice number, tax identifiers, dates, and line-item details.',
        inputs: ['Supplier PDF invoice email attachment'],
        outputs: ['Structured JSON/Excel invoice data metadata'],
        decisionPoints: ['Is invoice tax-compliant (Faktur Pajak included)?'],
        systems: ['Microsoft Excel', 'Microsoft PowerPoint'],
        handOffs: ['Reject invoices lacking Indonesian tax invoices (Faktur Pajak) immediately.'],
        aiClassification: 'agentic-ai',
        aiRationale: 'Document layout variation across hundreds of suppliers requires intelligent OCR capabilities to extract headers, table items, and line matching. Excellent fit for generative AI vision and structured parsing.'
      },
      {
        id: 'proc-2-step-2',
        order: 2,
        name: 'D365 3-Way Match execution',
        description: 'Retrieve original Purchase Order (PO) and Goods Receipt (GR) notes in D365 ERP. Validate that the invoice price and quantities match the warehouse delivery logs.',
        inputs: ['D365 PO registry', 'D365 GR logs', 'Extracted invoice metadata'],
        outputs: ['D365 Match verification report'],
        decisionPoints: ['Is price variance within allowed 1% margin?', 'Is quantity exactly matched?'],
        systems: ['Microsoft Dynamics 365 (ERP)'],
        handOffs: ['If variance exceeds 1%, suspend voucher and alert Procurement Lead.'],
        aiClassification: 'automation',
        aiRationale: 'Purely deterministic matching logic comparing structured data records in a database. Simple rule-based automation task.'
      },
      {
        id: 'proc-2-step-3',
        order: 3,
        name: 'AP payment voucher booking',
        description: 'Upon confirmation of match, create the accounts payable payment journal entry (AP Voucher) in D365, routing to the corporate ledger for disbursement scheduling.',
        inputs: ['Approved 3-way match dossier'],
        outputs: ['D365 GL Journal Entry ID'],
        decisionPoints: ['Is correct corporate cost center assigned?'],
        systems: ['Microsoft Dynamics 365 (ERP)'],
        handOffs: ['Email voucher posting reference to Treasury for planning.'],
        aiClassification: 'automation',
        aiRationale: 'A system transaction entry with predetermined inputs. Standard automation capability.'
      }
    ]
  },
  {
    id: 'proc-3',
    title: 'Monthly VAT & PPN Taxation Filing',
    description: 'Collation of purchase tax invoices (Faktur Pajak Masukan) and sales tax invoices (Faktur Pajak Keluaran). Cross-check records against the general ledger in D365, compile reporting schemas, and submit filing forms through DJP Online.',
    subFunction: 'Tax Management',
    ownerName: 'Dewi Pratama',
    ownerEmail: 'dewi.pratama@siloam.com',
    ownerLevel: 'L4',
    status: 'Refined',
    lastUpdated: '2026-07-06T11:00:00Z',
    completenessScore: 90,
    gaps: ['Need clarification on withholding tax certificates for individual specialist doctors'],
    isShared: true,
    taggedUsers: ['dewi.kartika@siloam.com'],
    effortRating: 4,
    repetitivenessRating: 4,
    volumeRating: 3,
    errorSensitivityRating: 5,
    automationSuitability: 68,
    steps: [
      {
        id: 'proc-3-step-1',
        order: 1,
        name: 'Extract monthly tax transaction ledger',
        description: 'Generate report from D365 of all monthly sales transactions (generating PPN Keluaran) and expense transactions (generating PPN Masukan) across all Siloam corporate accounts.',
        inputs: ['D365 Sales GL report', 'D365 Expense ledgers'],
        outputs: ['Raw Tax Ledgers (.csv)'],
        decisionPoints: [],
        systems: ['Microsoft Dynamics 365 (ERP)', 'Microsoft Excel'],
        handOffs: ['Share ledger with Senior Tax Manager for initial review.'],
        aiClassification: 'automation',
        aiRationale: 'Standard database export and report aggregation.'
      },
      {
        id: 'proc-3-step-2',
        order: 2,
        name: 'Reconcile ledger against e-Faktur web portal',
        description: 'Cross-reference D365 transactional records against tax invoices registered on the Director General of Taxes (DJP) e-Faktur database to identify unrecorded or missing tax credits.',
        inputs: ['D365 Transaction records', 'DJP e-Faktur portal records'],
        outputs: ['VAT reconciliation checklist', 'Outstanding VAT credit file'],
        decisionPoints: ['Are there any unregistered Masukan receipts?', 'Do NPWP numbers match?'],
        systems: ['DJP Online e-Faktur', 'Microsoft Excel'],
        handOffs: ['Instruct vendors to upload missing tax invoices immediately.'],
        aiClassification: 'agentic-ai',
        aiRationale: 'Reconciling mismatched legal and tax entities, figuring out spelling differences or corporate group structures, and identifying the root cause of discrepancies requires reasoning capabilities.'
      },
      {
        id: 'proc-3-step-3',
        order: 3,
        name: 'SPT Tax Return submission',
        description: 'Compile the finalized consolidated e-Faktur file, generate tax payment slip (Billing Code), post payment in CIMB Niaga, and submit tax return SPT PPN through DJP Online website.',
        inputs: ['Consolidated VAT file', 'Tax payment voucher', 'CIMB Niaga bank receipt'],
        outputs: ['DJP Online Filing Receipt (BPE)'],
        decisionPoints: ['Is e-filing signature certificate active?'],
        systems: ['DJP Online e-Faktur', 'CIMB Niaga Cash Management'],
        handOffs: ['File copy of BPE into Tax Archive. Send notification to CFO-1.'],
        aiClassification: 'human-in-the-loop',
        aiRationale: 'Tax filing submission requires official digital cryptographic signatures, direct compliance verification, and carries significant legal accountability. Needs official officer sign-off and action.'
      }
    ]
  },
  {
    id: 'proc-4',
    title: 'CAPEX Budget Variance Analysis',
    description: 'Monthly capital expenditure tracking across 41 hospital units. Compare active medical equipment acquisition requests and facilities upgrades budgets against physical payments, flagging deviations.',
    subFunction: 'Financial Planning and Corporate Analysis',
    ownerName: 'Anwar Hakim',
    ownerEmail: 'anwar.hakim@siloam.com',
    ownerLevel: 'L4',
    status: 'Draft',
    lastUpdated: '2026-07-09T01:20:00Z',
    completenessScore: 75,
    gaps: ['Requires integration of medical equipment supplier delivery lead-time variance'],
    isShared: false,
    taggedUsers: [],
    effortRating: 3,
    repetitivenessRating: 3,
    volumeRating: 2,
    errorSensitivityRating: 4,
    automationSuitability: 55,
    steps: [
      {
        id: 'proc-4-step-1',
        order: 1,
        name: 'Extract CAPEX requests and actual expenditures',
        description: 'Consolidate the approved CAPEX budget registries against actual invoices booked in D365 ERP by individual hospital branch controllers.',
        inputs: ['Corporate CAPEX Planning Sheets', 'D365 CAPEX expenditures ledger'],
        outputs: ['Variance workbook (.xlsx)'],
        decisionPoints: [],
        systems: ['Microsoft Dynamics 365 (ERP)', 'Microsoft Excel'],
        handOffs: []
      },
      {
        id: 'proc-4-step-2',
        order: 2,
        name: 'Identify high-variance medical departments',
        description: 'Analyze budget deviations exceeding 10% or Rp 500 million in medical machinery (like MRIs, CT scans) or clinical room facilities.',
        inputs: ['Variance workbook (.xlsx)'],
        outputs: ['Variance flags list', 'Departmental inquiry letters'],
        decisionPoints: ['Is the variance due to shipping delays or actual pricing surges?'],
        systems: ['Microsoft Excel', 'Microsoft PowerPoint'],
        handOffs: ['Send inquiry emails to specific Hospital Executive Directors asking for clarification.']
      }
    ]
  },
  {
    id: 'proc-5',
    title: 'Cash Forecasting & Bank Liquidity Allocation',
    description: 'Daily cash balance calculation across 41 hospital operational bank accounts. Project imminent treasury cash-out requirements (salaries, doctor fees, clinical consumables) and recommend allocations from central funds.',
    subFunction: 'Corporate Finance',
    ownerName: 'Eko Wahyudi',
    ownerEmail: 'eko.wahyudi@siloam.com',
    ownerLevel: 'L4',
    status: 'Submitted',
    lastUpdated: '2026-07-08T17:40:00Z',
    completenessScore: 85,
    gaps: [],
    isShared: true,
    taggedUsers: ['aris.wijaya@siloam.com'],
    effortRating: 4,
    repetitivenessRating: 5,
    volumeRating: 4,
    errorSensitivityRating: 5,
    automationSuitability: 78,
    steps: [
      {
        id: 'proc-5-step-1',
        order: 1,
        name: 'Collect bank statement balances',
        description: 'Retrieve balances from all current accounts in BNI, Mandiri, BCA and CIMB Niaga via corporate bank portals.',
        inputs: ['Bank token credentials', 'Bank portal query interface'],
        outputs: ['Consolidated Treasury cash sheet'],
        decisionPoints: [],
        systems: ['CIMB Niaga Cash Management', 'Microsoft Excel'],
        handOffs: ['Forward consolidated ledger to Treasury Manager.']
      },
      {
        id: 'proc-5-step-2',
        order: 2,
        name: 'Verify cash-out commitments',
        description: 'Consolidate accounts payable invoice payments scheduled for the day, clinical payroll distributions, and lease dues.',
        inputs: ['AP aging ledger', 'Payroll schedules'],
        outputs: ['Required cash disbursements report'],
        decisionPoints: ['Should we prioritize vendor payment or salary disbursement in cash tight entities?'],
        systems: ['Microsoft Dynamics 365 (ERP)', 'Microsoft Excel'],
        handOffs: []
      }
    ]
  },
  {
    id: 'proc-6',
    title: 'Physician Fee (Honorarium) Verification & Reconciliation',
    description: 'Verify complex doctor fees, outpatient consultations, and surgical honorariums across clinical subspecialties. Cross-reference doctor billing schedules against patient records in HIS before payroll booking.',
    subFunction: 'Transactional Accounting',
    ownerName: 'Ferry Irawan',
    ownerEmail: 'ferry.irawan@siloam.com',
    ownerLevel: 'L4',
    status: 'Draft',
    lastUpdated: '2026-07-09T02:00:00Z',
    completenessScore: 60,
    gaps: ['Unclear guidelines for medical insurance co-pays splitting formulas with visiting professors'],
    isShared: false,
    taggedUsers: [],
    effortRating: 5,
    repetitivenessRating: 4,
    volumeRating: 4,
    errorSensitivityRating: 5,
    automationSuitability: 60,
    steps: [
      {
        id: 'proc-6-step-1',
        order: 1,
        name: 'Fetch doctor activity and surgical consultations roster',
        description: 'Acquire surgical, clinical inpatient and outpatient consultant logs from KAIROS Hospital Information System.',
        inputs: ['KAIROS surgical registry', 'Inpatient discharge logs'],
        outputs: ['Doctor consultation volumes roster'],
        decisionPoints: [],
        systems: ['KAIROS (Hospital Information System)'],
        handOffs: []
      }
    ]
  }
];

export const MOCK_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif-1',
    senderName: 'Jessica Tan (Admin)',
    subject: 'Complete Missing Process Details',
    message: 'Your process "Monthly VAT & PPN Taxation Filing" is missing withholding tax certificates templates for specialist doctors. Please add this step to reach 100% completeness.',
    timestamp: '2026-07-09T01:00:00Z',
    status: 'Unread',
    actionRequired: true,
    actionType: 'complete_process',
    targetProcessId: 'proc-3'
  },
  {
    id: 'notif-2',
    senderName: 'Lisa Natalia (GM L2)',
    subject: 'Action Required: Review High-Effort Billing Workflows',
    message: 'I have flagged the "BPJS Claims Submission & Reconciliation" as high-effort with 92% automation potential. Please review the recommended Agentic AI solution and approve implementation.',
    timestamp: '2026-07-08T18:00:00Z',
    status: 'Read',
    actionRequired: true,
    actionType: 'review_process',
    targetProcessId: 'proc-1'
  },
  {
    id: 'notif-3',
    senderName: 'Roy Widya (CFO L1)',
    subject: 'Vanguard Transformation Phase Kickoff',
    message: 'Excellent work documenting initial processes. We have catalogued 6 primary workflows. Our next step is to refine these into Hackathon topics and deploy our first RPA and AI-agents by Q3.',
    timestamp: '2026-07-07T12:00:00Z',
    status: 'Read'
  }
];

export const MOCK_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: 'log-1',
    senderName: 'Jessica Tan',
    targetType: 'level',
    targetValue: 'L4',
    subject: 'Reminder: Process Catalogue Capture Deadline',
    message: 'To all L4 Finance team members, please ensure your core workflows are documented by Friday. Ensure inputs/outputs and systems are completely tagged.',
    timestamp: '2026-07-08T09:00:00Z',
    status: 'Sent',
    responsesCount: 4
  },
  {
    id: 'log-2',
    senderName: 'Jessica Tan',
    targetType: 'subfunction',
    targetValue: 'Tax Management',
    subject: 'Incomplete Tax Process Gaps Chase',
    message: 'Tax team, please specify the DJP online credentials handling and digital signature hand-off per step inside tax workflows.',
    timestamp: '2026-07-07T14:30:00Z',
    status: 'Sent',
    responsesCount: 1
  }
];

export const MOCK_IMPROVEMENT_ITEMS: ImprovementItem[] = [
  {
    id: 'imp-1',
    processId: 'proc-1',
    processTitle: 'BPJS Claims Submission & Reconciliation',
    subFunction: 'Account Receivable',
    recommendedSolution: 'Agentic AI',
    status: 'In Progress',
    ownerName: 'Budi Santoso',
    expectedImpact: 'Reduce reconciliation time from 5 days to 2 hours, eliminating clinical coding human disputes.',
    realizedSavings: 'Pending Deployment'
  },
  {
    id: 'imp-2',
    processId: 'proc-2',
    processTitle: 'Vendor Invoice 3-Way Match & AP Voucher Generation',
    subFunction: 'Procurement',
    recommendedSolution: 'Automation',
    status: 'Identified',
    ownerName: 'Siti Rahma',
    expectedImpact: 'Implement OCR visual invoice reader and matching bot to auto-create D365 payment vouchers.',
    realizedSavings: 'Estimated: 60 hrs/month'
  },
  {
    id: 'imp-3',
    processId: 'proc-3',
    processTitle: 'Monthly VAT & PPN Taxation Filing',
    subFunction: 'Tax Management',
    recommendedSolution: 'Simplification',
    status: 'Resolved',
    ownerName: 'Dewi Pratama',
    expectedImpact: 'Re-align e-Faktur ledger retrieval sequence. Standardized Excel macro to pre-validate NPWP records.',
    realizedSavings: 'Saved 12 hrs/month'
  }
];

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
