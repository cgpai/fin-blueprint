import { AnalysisResult, MiningResult, SubFunction } from '../types';
import { SUBFUNCTIONS_LIST } from '../data/mockData';

type Classification = 'agentic-ai' | 'automation' | 'human-in-the-loop';

const SHEETS_ENDPOINT = (import.meta.env.VITE_SHEETS_ENDPOINT as string | undefined)?.trim();
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
/** Prod path = Sheets Apps Script proxy. Browser key is local/dev only. */
const USE_SERVER_AI = Boolean(SHEETS_ENDPOINT);

/**
 * Free-tier text models (generateContent), ordered cheapest/fastest → heavier.
 * From ListModels on this project; skip Pro / image / TTS / robotics.
 * Each model has its own RPM/RPD — walking the chain helps on 429.
 */
const FREE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
] as const;

const GEMINI_MODELS = Array.from(
  new Set([GEMINI_MODEL, ...FREE_GEMINI_MODELS].filter(Boolean) as string[]),
);

const SYSTEM_MAP: Array<{ pattern: RegExp; system: string }> = [
  { pattern: /kairos|\bhis\b|hospital information|\bhope\b|registration|\bpas\b|\bpay\b|cashier|point.?of.?sale|\bopd\b|\bipd\b|\bmcu\b/i, system: 'KAIROS (Hospital Information System)' },
  { pattern: /\bemr\b|e-?medical record|electronic medical record|doctor consult|pharmacy script|radiology order|lab order|revenue leakage/i, system: 'EMR (Electronic Medical Record)' },
  { pattern: /d365|dynamics ?365|axapta|\berp\b|general ledger|\bgl\b|accounts payable|\bap\b|accounts receivable|\bar\b|fixed asset|month.?end close/i, system: 'Microsoft Dynamics 365 (ERP)' },
  { pattern: /vendor portal|purchase request|\bpr portal\b|purchase order|\bpo\b|goods received|\bgrn\b|procurement|three.?way match|3-?way match/i, system: 'Purchase Request (PR) & Vendor Portal' },
  { pattern: /djp|e-?faktur|tax portal|faktur pajak|\bppn\b|\bvat\b|tax invoice/i, system: 'DJP Online e-Faktur' },
  { pattern: /bpjs|e-?clai?m|e-?klaim|ina-?cbg|insurance claim|claim rejection|ar aging/i, system: 'BPJS e-Claim Portal' },
  { pattern: /cimb|niaga|cash management|host.?to.?host|bank clearance|disbursement|treasury|payroll|cash reconciliation/i, system: 'CIMB Niaga Cash Management' },
  { pattern: /power ?bi|\bdax\b|dashboard|heatmap/i, system: 'Microsoft Power BI' },
  { pattern: /excel|spreadsheet|workbook|xlsx|pivot/i, system: 'Microsoft Excel' },
  { pattern: /powerpoint|\bppt\b|slide|deck|presentation/i, system: 'Microsoft PowerPoint' },
];

function classifyText(text: string): { aiClassification: Classification; aiRationale: string } {
  const t = text.toLowerCase();
  if (/reconcile|match|verify|evaluate|analy[sz]e|extract|interpret|investigate|review email|cross-?reference/.test(t)) {
    return {
      aiClassification: 'agentic-ai',
      aiRationale: 'Needs reasoning over exceptions, unstructured inputs, or cross-checks.',
    };
  }
  if (/approve|sign|authori[sz]e|escalate|submit to (management|director)|audit sign|legal|physical/.test(t)) {
    return {
      aiClassification: 'human-in-the-loop',
      aiRationale: 'Needs accountable approval, compliance judgement, or physical action.',
    };
  }
  return {
    aiClassification: 'automation',
    aiRationale: 'Structured, repetitive work with clear rules.',
  };
}

function guessLineOfWork(text: string): SubFunction {
  const t = text.toLowerCase();
  if (/tax|faktur|djp|vat|ppn|pph/.test(t)) return 'Tax Management';
  if (/procure|vendor|purchase|\bpo\b|payable|\bap\b/.test(t)) return 'Procurement';
  if (/claim|billing|bpjs|receivable|\bar\b|collection|dunning/.test(t)) return 'Account Receivable';
  if (/revenue assurance|leakage|revenue integrity/.test(t)) return 'Revenue Assurance';
  if (/audit|risk|assurance|compliance check|internal control/.test(t)) return 'Internal Audit';
  if (/capex|capital expenditure|capital investment/.test(t)) return 'CAPEX Control and Capital Investment';
  if (/opex|operating expense|cost saving|efficiency drive/.test(t)) return 'OPEX Optimisation';
  if (/investment|portfolio|fund placement|deposito|treasury placement/.test(t)) return 'Investment';
  if (/power ?bi|dashboard|data model|\bdax\b/.test(t)) return 'Power BI Data Control';
  if (/budget|forecast|variance|fp&a|corporate analysis|planning/.test(t)) return 'Financial Planning and Corporate Analysis';
  if (/management report|board report|monthly report|reporting pack/.test(t)) return 'Management Reporting';
  if (/profitab|productivity|margin analysis/.test(t)) return 'Profitablity and Productivity';
  if (/controller|month.?end close|general ledger|\bgl\b|journal|reconcil/.test(t)) return 'Financial Controller';
  if (/treasury|cash flow|liquidity|bank|financing|corporate finance/.test(t)) return 'Corporate Finance';
  if (/master data|chart of account|erp config|system setup/.test(t)) return 'System Accountant';
  if (/analysis|analyt/.test(t)) return 'Financial Analysis';
  return 'Transactional Accounting';
}

function detectSystems(text: string): string[] {
  return SYSTEM_MAP.filter((h) => h.pattern.test(text)).map((h) => h.system);
}

function splitSteps(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/\r?\n+|(?<=[.!?])\s+(?=[A-Z0-9])|(?:^|\s)(?:then|after that|next,|afterwards|finally|lastly)[,\s]+/gi)
    .map((f) => (f || '').replace(/^\s*(?:\d+[.)]\s*|[-*]\s*|step \d+[:.]?\s*)/i, '').trim())
    .filter((f) => f.length > 12)
    .filter((f) => {
      const key = f.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

async function generateViaServer<T>(prompt: string): Promise<T> {
  const res = await fetch(SHEETS_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'geminiJSON', prompt }),
  });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: string; model?: string };
  if (!res.ok || !json.ok || json.data == null) {
    throw new Error(json.error || `Server AI failed (${res.status})`);
  }
  console.info('Gemini model used (server):', json.model || 'unknown');
  return json.data;
}

async function generateViaBrowserKey<T>(prompt: string): Promise<T> {
  if (!GEMINI_API_KEY) throw new Error('No Gemini key configured');
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        lastError = `${model}: ${json?.error?.status || res.status}`;
        console.warn('Gemini model failed, trying fallback:', lastError);
        continue;
      }
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('empty response');
      console.info('Gemini model used (browser):', model);
      return parseJSON<T>(text);
    } catch (err: any) {
      lastError = `${model}: ${err.message || err}`;
      console.warn('Gemini model failed, trying fallback:', lastError);
    }
  }
  throw new Error(`Gemini failed on all configured models. ${lastError}`);
}

async function generateGeminiJSON<T>(prompt: string): Promise<T> {
  if (USE_SERVER_AI) {
    try {
      return await generateViaServer<T>(prompt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Cutover: old Apps Script deploy / missing Script Property — keep browser key working.
      if (GEMINI_API_KEY && /Unknown action|GEMINI_API_KEY not set/i.test(msg)) {
        console.warn('Server AI not ready, using browser key:', msg);
        return generateViaBrowserKey<T>(prompt);
      }
      throw err;
    }
  }
  return generateViaBrowserKey<T>(prompt);
}

function parseJSON<T>(text: string): T {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(clean) as T;
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1)) as T;
    throw new Error('Gemini returned invalid JSON');
  }
}

function localMineProcesses(input: { title?: string; description?: string; sourceTexts?: string[] }): MiningResult {
  const narrative = [input.description || '', ...(input.sourceTexts || [])].filter(Boolean).join('\n\n').trim();
  if (!narrative) throw new Error('Provide a process description or uploaded working outputs to mine.');

  const blocks = narrative
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 20);
  const sourceBlocks = blocks.length > 1 ? blocks : [narrative];

  const processes = sourceBlocks.map((block) => {
    const fragments = splitSteps(block);
    const steps = fragments.map((fragment, idx) => {
      const systems = detectSystems(fragment);
      const { aiClassification, aiRationale } = classifyText(fragment);
      const sentence = fragment.replace(/\s+/g, ' ');
      const name = sentence.length > 64 ? `${sentence.slice(0, 61).replace(/\s+\S*$/, '')}...` : sentence;
      return {
        order: idx + 1,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        description: `Trigger: previous step completed. Action: ${sentence.charAt(0).toLowerCase() + sentence.slice(1)} Expected result: step output verified and logged.`,
        inputs: idx === 0 ? ['Source documents / prior period data'] : [`Output of step ${idx}`],
        outputs: ['Completed step record'],
        decisionPoints: /if |whether |depending/i.test(fragment) ? ['Confirm the branch rule described in the narrative.'] : [],
        systems: systems.length ? systems : ['Microsoft Excel [Inferred Ecosystem]'],
        handOffs: /send|forward|escalate|share|notify|email/i.test(fragment) ? ['Confirm who receives this hand-off.'] : [],
        aiClassification,
        aiRationale,
      };
    });
    const firstLine = block.split(/\r?\n/).find((line) => line.trim())?.trim() || '';
    const subFunction = guessLineOfWork(block);
    return {
      title: input.title && sourceBlocks.length === 1 ? input.title : firstLine.slice(0, 60).replace(/[.:]$/, '') || 'Working process',
      subFunction: (SUBFUNCTIONS_LIST.includes(subFunction) ? subFunction : 'Transactional Accounting') as string,
      summary: `${steps.length} step${steps.length === 1 ? '' : 's'} captured from this block.`,
      steps,
    };
  });

  return {
    processCount: processes.length,
    overallSummary: `I found ${processes.length} distinct process${processes.length === 1 ? '' : 'es'} in your input.`,
    processes,
  };
}

function localAnalyzeProcess(input: { title: string; description?: string; steps: Array<{ order: number; name: string; description?: string; inputs?: string[]; outputs?: string[] }> }): AnalysisResult {
  const refinedSteps = input.steps.map((step) => {
    const { aiClassification, aiRationale } = classifyText(`${step.name} ${step.description || ''}`);
    return {
      order: step.order,
      name: step.name,
      refinedDescription: `${step.description || 'Step execution.'} Trigger: input verified. Expected result: output logged and ready for the next step.`,
      suggestedInputs: step.inputs?.length ? step.inputs : ['Standard operating document', 'ERP data fields'],
      suggestedOutputs: step.outputs?.length ? step.outputs : ['Completed step record', 'Status update'],
      aiClassification,
      aiRationale,
    };
  });

  const lowerTitle = input.title.toLowerCase();
  const volume = lowerTitle.includes('bpjs') || lowerTitle.includes('invoice') ? 5 : 4;
  const repetitiveness = lowerTitle.includes('reconciliation') || lowerTitle.includes('match') ? 5 : 3;
  const ruleClarity = lowerTitle.includes('tax') ? 5 : 4;
  const errorSensitivity = 5;

  return {
    refinedSteps,
    gaps: [
      `Confirm system ownership and exception route for "${input.title}".`,
      'Confirm approval checkpoints and audit evidence for this process.',
    ],
    automationSuitability: Math.round(((volume + repetitiveness + ruleClarity + (6 - errorSensitivity)) / 20) * 100),
    drivers: {
      volume,
      repetitiveness,
      ruleClarity,
      errorSensitivity,
      summary: 'Local browser analysis uses simple heuristics. Treat the score as a triage signal.',
    },
    recommendedAction: 'Validate the steps with the process owner, then shortlist repetitive structured steps for automation.',
  };
}

export async function mineProcesses(input: { title?: string; description?: string; sourceTexts?: string[] }): Promise<MiningResult> {
  const narrative = [input.description || '', ...(input.sourceTexts || [])].filter(Boolean).join('\n\n').trim();
  if (!narrative) throw new Error('Provide a process description or uploaded working outputs to mine.');

  try {
    const result = await generateGeminiJSON<MiningResult>(`
You are a finance process mining engine. Segment the raw input into distinct finance work processes, then structure each process.

Return strict JSON:
{
  "processCount": number,
  "overallSummary": string,
  "processes": [{
    "title": string,
    "subFunction": one of ${JSON.stringify(SUBFUNCTIONS_LIST)},
    "summary": string,
    "steps": [{
      "order": number,
      "name": string,
      "description": string in "Trigger -> Action -> Expected result" form,
      "inputs": string[],
      "outputs": string[],
      "decisionPoints": string[],
      "systems": string[],
      "handOffs": string[],
      "aiClassification": "agentic-ai" | "automation" | "human-in-the-loop",
      "aiRationale": string
    }]
  }]
}

Title hint: ${input.title || '(none)'}
Raw input:
${narrative}
`);
    if (result?.processes?.length) {
      result.processes.forEach((p) => {
        if (!p.subFunction || !SUBFUNCTIONS_LIST.includes(p.subFunction as SubFunction)) {
          p.subFunction = guessLineOfWork(`${p.title || ''} ${p.summary || ''}`);
        }
      });
      result.processCount = result.processes.length;
      return result;
    }
    throw new Error('Gemini returned no processes');
  } catch (err) {
    // Prod (Sheets proxy): fail loud — no silent heuristic that looks like "AI worked".
    if (USE_SERVER_AI) throw err;
    console.error('Gemini mining failed, using local fallback:', err);
  }

  return localMineProcesses(input);
}

export async function analyzeProcess(input: { title: string; description?: string; steps: Array<{ order: number; name: string; description?: string; inputs?: string[]; outputs?: string[] }> }): Promise<AnalysisResult> {
  try {
    const result = await generateGeminiJSON<AnalysisResult>(`
You are a finance process automation consultant. Refine and score this process for AI/automation transformation.

Return strict JSON:
{
  "refinedSteps": [{
    "order": number,
    "name": string,
    "refinedDescription": string,
    "suggestedInputs": string[],
    "suggestedOutputs": string[],
    "aiClassification": "agentic-ai" | "automation" | "human-in-the-loop",
    "aiRationale": string
  }],
  "gaps": string[],
  "automationSuitability": number,
  "drivers": {
    "volume": number,
    "repetitiveness": number,
    "ruleClarity": number,
    "errorSensitivity": number,
    "summary": string
  },
  "recommendedAction": string
}

Process:
${JSON.stringify(input, null, 2)}
`);
    if (result?.refinedSteps?.length) return result;
    throw new Error('Gemini returned no refined steps');
  } catch (err) {
    if (USE_SERVER_AI) throw err;
    console.error('Gemini analysis failed, using local fallback:', err);
  }

  return localAnalyzeProcess(input);
}
