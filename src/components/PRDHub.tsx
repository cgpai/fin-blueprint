import { useState } from 'react';
import { Sparkles, FileText, Table, Users, Landmark, Layers, Download, CheckCircle, Receipt, HardDrive, RefreshCw, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Process } from '../types';
import { useT, type TFn } from '../lib/i18n';

const toIDR = (usd: number) => usd * 16000;

const formatIDR = (val: number) => {
  if (val >= 1000000000) {
    return `Rp ${(val / 1000000000).toFixed(2)} Miliar`;
  }
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1)} Juta`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

const PRICING_STANDARDS = [
  { item: 'Google Gemini 1.5 Flash (Input)', rate: 'Rp 1.200', unit: 'per 1.000.000 tokens', category: 'LLM Token', desc: 'Sangat hemat untuk ekstraksi data masal dan pencocokan teks terstruktur.' },
  { item: 'Google Gemini 1.5 Flash (Output)', rate: 'Rp 4.800', unit: 'per 1.000.000 tokens', category: 'LLM Token', desc: 'Digunakan untuk menyusun format jawaban JSON atau draf jurnal akun.' },
  { item: 'Google Gemini 1.5 Pro (Input)', rate: 'Rp 20.000', unit: 'per 1.000.000 tokens', category: 'LLM Token', desc: 'Ideal untuk analisis finansial mendalam dan penaksiran tren likuiditas.' },
  { item: 'Google Gemini 1.5 Pro (Output)', rate: 'Rp 80.000', unit: 'per 1.000.000 tokens', category: 'LLM Token', desc: 'Digunakan untuk menyusun komentar varians CAPEX dan narasi rekomendasi CFO.' },
  { item: 'Jasa SMS OTP (Gateway Indonesia)', rate: 'Rp 350', unit: 'per sukses transaksi', category: 'Keamanan / Otentikasi', desc: 'Verifikasi keamanan dua langkah (MFA) bagi supervisor sebelum persetujuan.' },
  { item: 'WhatsApp Business API Gateway', rate: 'Rp 450', unit: 'per sesi notifikasi', category: 'Keamanan / Otentikasi', desc: 'Mengirimkan alert verifikasi instan atau draf anomali ke manajer operasional.' },
  { item: 'Make.com Workflow Scheduler', rate: 'Rp 144.000', unit: 'per bulan (Standard)', category: 'Orkestrasi', desc: 'Mengatur cron-job berkala, webhook trigger, dan sinkronisasi antar-sistem.' },
  { item: 'Secure OCR Cloud (PDF.co)', rate: 'Rp 784.000', unit: 'per bulan', category: 'Ekstraksi Dokumen', desc: 'Mendigitalkan kuitansi, klaim medis, atau cetakan invoice beresolusi rendah.' },
  { item: 'RPA Unattended Runner Runtime', rate: 'Rp 1.600.000', unit: 'per bulan', category: 'Otomasi Desktop', desc: 'Melakukan klik otomatis pada portal DJP PPN atau portal e-Claim BPJS.' },
];

type EngineRecord = {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  targetAudience: string;
  masterUsers: string;
  ecosystemApps: string;
  overlappingProcesses: string[];
  capexLogic: string;
  opexLogic: string;
  metrics: {
    volume: string;
    effort: string;
    annualSavings: string;
    payback: string;
  };
  specifications: string[];
};

const ENGINE_I18N_KEYS: Record<string, { title: string; description: string }> = {
  'engine-claims': { title: 'prd.engine.claims.title', description: 'prd.engine.claims.description' },
  'engine-ap': { title: 'prd.engine.ap.title', description: 'prd.engine.ap.description' },
  'engine-treasury': { title: 'prd.engine.treasury.title', description: 'prd.engine.treasury.description' },
  'engine-tax': { title: 'prd.engine.tax.title', description: 'prd.engine.tax.description' },
};

function isDynamicEngineId(id: string) {
  return id.startsWith('engine-dynamic-');
}

function engineTitle(t: TFn, engine: EngineRecord) {
  if (isDynamicEngineId(engine.id)) return t('prd.dynamicEngine.title');
  const keys = ENGINE_I18N_KEYS[engine.id];
  return keys ? t(keys.title) : engine.title;
}

function engineDescription(t: TFn, engine: EngineRecord) {
  if (isDynamicEngineId(engine.id)) return t('prd.dynamicEngine.description');
  const keys = ENGINE_I18N_KEYS[engine.id];
  return keys ? t(keys.description) : engine.description;
}

const BASE_ENGINES: EngineRecord[] = [
  {
    id: 'engine-claims',
    title: 'AI Claims & Billing Settlement Engine',
    icon: Users,
    description: 'Unified billing audit and claim verification system bridging HIS patient records and public insurance portals.',
    targetAudience: 'Billing Analysts, Accounts Receivable (AR) Officers, Branch Finance Managers',
    masterUsers: 'AR Admin Staff, BPJS Verification Officers, Supervisor Keuangan Siloam',
    ecosystemApps: 'BPJS e-Claim Portal, KAIROS Hospital Information System (HIS), CIMB Niaga Cash Management, Microsoft Excel, Microsoft Dynamics 365 ERP',
    overlappingProcesses: ['BPJS Claims Submission & Reconciliation', 'Physician Fee (Honorarium) Verification & Reconciliation'],
    capexLogic: 'Penyusunan pipeline integrasi API KAIROS HIS ke endpoint klaim, otentikasi aman gateway BPJS, dan visual audit dashboard gate untuk Supervisor.',
    opexLogic: 'Penggunaan Gemini 1.5 Flash untuk parsing aktivitas pelayanan vs batasan tarif BPJS (berdasarkan token), OTP verifikasi transaksi, serta scheduler bulanan Make.com.',
    metrics: {
      volume: '15.000 klaim & aktivitas dokter / bulan',
      effort: 'Mengurangi beban manual dari 220 jam menjadi 25 jam sebulan',
      annualSavings: formatIDR(toIDR(45000)),
      payback: '2 Bulan',
    },
    specifications: [
      'Konektivitas otomatis ke database lokal HIS (Fetch aktivitas & diagnosa pasien).',
      'Validasi kepatuhan tarif INA-CBG menggunakan LLM berbasis prompt ruleset.',
      'Antarmuka khusus supervisor untuk menyetujui draf honorarium dokter.',
      'Postingan otomatis voucher piutang ke Microsoft Dynamics 365 ERP via REST API.'
    ]
  },
  {
    id: 'engine-ap',
    title: 'Intelligent Invoice & AP Automation Engine',
    icon: Receipt,
    description: 'Intelligent accounts payable orchestrator processing multi-vendor supply chain invoices with automatic ERP ledger entry.',
    targetAudience: 'Accounts Payable Officers, Procurement Admins, Treasury Leads',
    masterUsers: 'AP Officers, Procurement Managers, Accounting Supervisor',
    ecosystemApps: 'Microsoft Dynamics 365 ERP, Supplier Portal Siloam, Secure OCR Service, Microsoft Excel, Local Bank Transfers',
    overlappingProcesses: ['Vendor Invoice 3-Way Match & AP Voucher Generation', 'AI-as-a-Service Guide Reconciliation & Journaling'],
    capexLogic: 'Konfigurasi schema OCR dinamis untuk berbagai template supplier farmasi, mapping relational PO/GRN database, dan integration module di D365.',
    opexLogic: 'Gemini 1.5 Flash untuk ekstraksi tabel multi-halaman pada invoice fisik (token), langganan API OCR PDF.co, dan trigger otomatis via Make.com.',
    metrics: {
      volume: '8.000 invoice vendor & rekonsiliasi bank / bulan',
      effort: 'Mengurangi beban input manual dari 350 jam menjadi 30 jam sebulan',
      annualSavings: formatIDR(toIDR(62000)),
      payback: '3 Bulan',
    },
    specifications: [
      'Penerimaan berkas invoice digital (PDF) via e-mail webhook atau drop-folder.',
      'Ekstraksi tabel baris-demi-baris (line-items) menggunakan kecerdasan visual Gemini OCR.',
      'Pencocokan 3 arah (3-Way Match) antara Purchase Order, Goods Receipt Note, dan Vendor Invoice.',
      'Pembuatan voucher draf AP di D365 ERP secara real-time.'
    ]
  },
  {
    id: 'engine-treasury',
    title: 'Treasury & Cash Operations Engine',
    icon: Landmark,
    description: 'Strategic forecasting and liquidity allocation intelligence aggregating balances across 41 operational branch accounts.',
    targetAudience: 'Treasury Managers, Corporate Cash Controllers, CFO (L-1)',
    masterUsers: 'Treasury Staff, Finance GM, Chief Financial Officer',
    ecosystemApps: 'CIMB Niaga Portal, Mandiri Cash Management, Microsoft Excel, D365 General Ledger',
    overlappingProcesses: ['Cash Forecasting & Bank Liquidity Allocation', 'CAPEX Budget Variance Analysis'],
    capexLogic: 'Pembuatan algoritma forecasting model, mapping CAPEX budget ceiling per departemen, serta visual analytics dashboard untuk L-1 & CFO.',
    opexLogic: 'Penggunaan Gemini 1.5 Pro untuk melakukan penalaran tren (chain-of-thought) kas harian, menyusun laporan komentar tertulis varians budget secara otomatis, serta orkestrasi Make.com.',
    metrics: {
      volume: 'Daily forecast across 41 branches & 120 CAPEX categories',
      effort: 'Mengurangi waktu penyusunan laporan dari 4 hari menjadi 15 menit',
      annualSavings: formatIDR(toIDR(38000)),
      payback: '4 Bulan',
    },
    specifications: [
      'Koneksi harian otomatis untuk mengunduh laporan mutasi kas (MT940) via Cash Portal.',
      'Konsolidasi saldo kas cabang Siloam secara real-time.',
      'Analisis deviasi (variance) CAPEX departemen medis terhadap pagu anggaran.',
      'Rekomendasi alokasi likuiditas harian otomatis yang draf-nya dikirim via WhatsApp Secure.'
    ]
  },
  {
    id: 'engine-tax',
    title: 'Tax Compliance Automation Engine',
    icon: HardDrive,
    description: 'RPA and cognitive hybrid engine automating VAT reconciliation and direct filing to the national DJP Online tax portal.',
    targetAudience: 'Tax Accountants, Tax Managers, Compliance Directors',
    masterUsers: 'Tax Admin, Corporate Tax Supervisor, Audit Liaison',
    ecosystemApps: 'DJP e-Faktur Web Portal, Microsoft Dynamics 365 ERP, DJP Online e-SPT, Excel Reconciliation sheets',
    overlappingProcesses: ['Monthly VAT & PPN Taxation Filing'],
    capexLogic: 'Pengembangan browser automation script untuk navigasi headless portal DJP, pemetaan e-Faktur ledger fields, dan enkripsi sertifikat elektronik pajak.',
    opexLogic: 'Penggunaan RPA Unattended Bot runner license, pemecah Captcha berbasis OCR, dan Gemini 1.5 Flash untuk pemetaan klasifikasi kode pajak masukan.',
    metrics: {
      volume: '5.000 faktur pajak Masukan/Keluaran / bulan',
      effort: 'Mengurangi durasi rekonsiliasi pajak dari 10 hari kerja menjadi 4 jam',
      annualSavings: formatIDR(toIDR(28000)),
      payback: '5 Bulan',
    },
    specifications: [
      'Sinkronisasi berkala data GL pajak dari Dynamics 365 ERP.',
      'Unduh massal berkas XML Faktur Pajak Masukan dari e-Faktur web portal menggunakan robot RPA.',
      'Pencocokan silang otomatis nomor e-Faktur vs voucher ERP.',
      'Pembuatan berkas e-SPT Masa PPN siap lapor secara otomatis.'
    ]
  }
];

interface PRDHubProps {
  processes: Process[];
  isAdmin?: boolean;
}

export default function PRDHub({ processes, isAdmin }: PRDHubProps) {
  const t = useT();
  const [engines, setEngines] = useState(BASE_ENGINES);
  const [activeEngine, setActiveEngine] = useState<string>('engine-claims');
  const [activeSubTab, setActiveSubTab] = useState<'prd' | 'pricing'>('prd');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [deletingEngine, setDeletingEngine] = useState<EngineRecord | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);

    setTimeout(() => {
      const mappedProcessTitles = new Set(
        BASE_ENGINES.flatMap(e => e.overlappingProcesses)
      );
      
      const unmappedProcesses = processes.filter(p => !mappedProcessTitles.has(p.title) && p.title.trim() !== '');

      if (unmappedProcesses.length > 0) {
        const newEngine: EngineRecord = {
          id: 'engine-dynamic-' + Date.now(),
          title: 'Custom AI Orchestration Engine',
          icon: Sparkles,
          description: 'Auto-compiled orchestration engine derived from recently added organizational processes.',
          targetAudience: 'Cross-functional Operations',
          masterUsers: 'Process Owners, Analysts',
          ecosystemApps: 'Internal API Gateway, Cloud Storage, ERP modules',
          overlappingProcesses: unmappedProcesses.map(p => p.title),
          capexLogic: 'Integration hooks for new custom workflows and AI orchestration logic.',
          opexLogic: 'Token consumption for generative analysis and cloud automation execution.',
          metrics: {
            volume: 'Dynamically scaled based on process usage',
            effort: 'Est. 40% reduction in manual tracking',
            annualSavings: formatIDR(toIDR(25000)), 
            payback: '6 Bulan',
          },
          specifications: [
            'Dynamic data ingestion from user-defined inputs.',
            'LLM-based categorization and decision routing.',
            'Automated alerting and report generation.'
          ]
        };
        setEngines([...BASE_ENGINES, newEngine]);
      } else {
        setEngines(BASE_ENGINES);
      }

      setIsRefreshing(false);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    }, 1200);
  };

  const handleExportPRD = (engineId: string) => {
    const eng = engines.find(e => e.id === engineId);
    if (!eng) return;

    const prdContent = `
PRODUCT REQUIREMENT DOCUMENTATION (PRD) - CONSOLIDATED ENGINE
============================================================
Engine Name: ${engineTitle(t, eng)}
Status: Proposed / Blueprint Validated
Target Audience: ${eng.targetAudience}
Master Users & Personas: ${eng.masterUsers}

1. EXECUTIVE SUMMARY & OVERVIEW
----------------------------------
${engineDescription(t, eng)}

2. OVERLAPPING PROCESS CATALOGUE
----------------------------------
This engine consolidates and eliminates functional redundancy for:
${eng.overlappingProcesses.map(p => `- ${p}`).join('\n')}

3. EXISTING APP ECOSYSTEM & INTEGRATIONS
----------------------------------
- Mapped Integrations: ${eng.ecosystemApps}

4. CAPEX & OPEX COSTING LOGIC
----------------------------------
- CAPEX Logic: ${eng.capexLogic}
- OPEX Logic: ${eng.opexLogic}

5. UNIT PRICING STANDARD (IDR BASIS)
----------------------------------
Google Gemini 1.5 Flash Input: Rp 1.200 / million tokens
Google Gemini 1.5 Flash Output: Rp 4.800 / million tokens
Jasa SMS OTP Gateway: Rp 350 / transaction
WhatsApp Notification Session: Rp 450 / session
Make.com Scheduler: Rp 144.000 / month

6. FINANCIAL & OPERATIONAL TARGETS
----------------------------------
- Transactional Scale: ${eng.metrics.volume}
- Operational Effort Release: ${eng.metrics.effort}
- Dynamic Annual Savings Estimate: ${eng.metrics.annualSavings}
- Break-Even Payback Period: ${eng.metrics.payback}
    `;

    const blob = new Blob([prdContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PRD_Siloam_${engineTitle(t, eng).replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentEngine = engines.find(e => e.id === activeEngine) || engines[0]!;

  return (
    <div className="space-y-6 animate-fade-up" id="prd-hub-view">
      <div className="bg-white border border-line rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink text-citron grid place-items-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">{t('prd.title')}</h2>
              <p className="text-xs text-mute mt-0.5">{t('prd.subtitle')}</p>
            </div>
          </div>
          
          {refreshSuccess ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold animate-fade-in">
              <CheckCircle size={14} />
              <span>{t('prd.synced')}</span>
            </div>
          ) : (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-outline flex items-center gap-1.5 !px-3 !py-1.5 !text-xs cursor-pointer hover:bg-canvas transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? t('prd.syncing') : t('prd.syncNewProcesses')}</span>
            </button>
          )}
        </div>

        <div className="flex border-b border-line gap-4 pt-1 text-xs print:hidden">
          <button
            onClick={() => setActiveSubTab('prd')}
            className={`pb-2.5 font-semibold transition-all relative cursor-pointer ${
              activeSubTab === 'prd' ? 'text-ink' : 'text-faint hover:text-mute'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileText size={14} />
              <span>{t('prd.tab.prd')}</span>
            </div>
            {activeSubTab === 'prd' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ink" />}
          </button>
          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`pb-2.5 font-semibold transition-all relative cursor-pointer ${
              activeSubTab === 'pricing' ? 'text-ink' : 'text-faint hover:text-mute'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Table size={14} />
              <span>{t('prd.tab.pricing')}</span>
            </div>
            {activeSubTab === 'pricing' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ink" />}
          </button>
        </div>
      </div>

      {activeSubTab === 'prd' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3 print:hidden">
            <span className="text-[10px] font-bold text-mute tracking-wider uppercase px-1">{t('prd.sidebarHeading')}</span>
            <div className="space-y-2">
              {engines.map((e) => {
                const IconComp = e.icon;
                const isSelected = e.id === activeEngine;
                return (
                  <button
                    key={e.id}
                    onClick={() => setActiveEngine(e.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected
                        ? 'bg-ink border-ink text-white shadow-lift'
                        : 'bg-white border-line hover:border-ink/40 text-ink'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                      isSelected ? 'bg-citron text-ink' : 'bg-veil text-ink'
                    }`}>
                      <IconComp size={15} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-bold truncate">{engineTitle(t, e)}</h4>
                      <p className={`text-[10px] line-clamp-1 ${isSelected ? 'text-mute' : 'text-faint'}`}>{engineDescription(t, e)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4.5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase block">{t('prd.overlapSummaryTitle')}</span>
              <p className="text-[11px] text-emerald-900 leading-relaxed">{t('prd.overlapSummaryBody')}</p>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-line rounded-3xl p-6 shadow-sm space-y-6 print:col-span-12 print:border-none print:shadow-none print:p-0">
            <div className="flex justify-between items-start gap-4 flex-wrap pb-4 border-b border-line">
              <div className="space-y-1">
                <span className="chip bg-citron-soft border-transparent text-citron-deep">{t('prd.prdBadge')}</span>
                <h3 className="font-display text-xl font-bold text-ink">{engineTitle(t, currentEngine)}</h3>
                <p className="text-xs text-mute">{engineDescription(t, currentEngine)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setDeletingEngine(currentEngine)}
                    className="btn-outline flex items-center gap-1.5 !text-xs !py-2 !px-4 shrink-0 cursor-pointer print:hidden text-rose-500 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                    title={t('prd.eraseTitle')}
                  >
                    <X size={13} /> {t('prd.erase')}
                  </button>
                )}
                <button
                  onClick={() => handleExportPRD(currentEngine.id)}
                  className="btn-dark flex items-center gap-1.5 !text-xs !py-2 !px-4 shrink-0 cursor-pointer print:hidden"
                >
                  <Download size={13} /> {t('prd.exportPrd')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:break-inside-avoid">
              <div className="border border-line/60 rounded-2xl p-4 space-y-1 bg-canvas-soft">
                <span className="text-[9px] uppercase tracking-wider text-mute font-bold block">{t('prd.targetAudience')}</span>
                <p className="text-xs font-semibold text-ink leading-tight">{currentEngine.targetAudience}</p>
              </div>
              <div className="border border-line/60 rounded-2xl p-4 space-y-1 bg-canvas-soft">
                <span className="text-[9px] uppercase tracking-wider text-mute font-bold block">{t('prd.masterUsers')}</span>
                <p className="text-xs font-semibold text-ink leading-tight">{currentEngine.masterUsers}</p>
              </div>
            </div>

            <div className="space-y-2 print:break-inside-avoid">
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase">{t('prd.ecosystemTitle')}</span>
              <div className="p-4 border border-line rounded-2xl bg-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 grid place-items-center shrink-0">
                  <Landmark size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink leading-normal">{currentEngine.ecosystemApps}</p>
                  <p className="text-[10px] text-faint mt-0.5">{t('prd.ecosystemSub')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 print:break-inside-avoid">
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase">{t('prd.overlappingProcesses')}</span>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {currentEngine.overlappingProcesses.map((p) => (
                  <div key={p} className="p-3 bg-canvas-soft border border-line/55 rounded-xl flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-ink truncate">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-line/60 print:break-inside-avoid">
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase block">{t('prd.costingLogic')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-ink-soft block">{t('prd.capexLogic')}</span>
                  <p className="text-[11px] text-mute leading-relaxed">{currentEngine.capexLogic}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 block">{t('prd.opexLogic')}</span>
                  <p className="text-[11px] text-mute leading-relaxed">{currentEngine.opexLogic}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-line/60 print:break-inside-avoid">
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase block">{t('prd.functionalSpecs')}</span>
              <ul className="space-y-2 text-[11px] text-mute pl-1">
                {currentEngine.specifications.map((spec, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink font-bold shrink-0">{i + 1}.</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-line bg-canvas-soft/40 -mx-6 -mb-6 p-6 rounded-b-3xl print:break-inside-avoid print:mx-0 print:mb-0 print:border-line print:rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-mute font-bold block">{t('prd.metric.transactionalScale')}</span>
                <span className="text-xs font-bold text-ink block leading-snug">{currentEngine.metrics.volume}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-mute font-bold block">{t('prd.metric.effortReleased')}</span>
                <span className="text-xs font-bold text-ink block leading-snug">{currentEngine.metrics.effort}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-emerald-800 font-bold block">{t('prd.metric.annualSavings')}</span>
                <span className="text-xs font-bold text-emerald-700 block leading-snug">{currentEngine.metrics.annualSavings}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-mute font-bold block">{t('prd.metric.breakEven')}</span>
                <span className="text-xs font-bold text-ink block leading-snug">{currentEngine.metrics.payback}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-3xl p-6 shadow-sm space-y-5 animate-fade-up">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h3 className="font-display text-xl font-bold">{t('prd.pricingTitle')}</h3>
              <p className="text-xs text-mute mt-0.5">{t('prd.pricingSubtitle')}</p>
            </div>
          </div>

          <div className="border border-line rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-ink text-white border-b border-line">
                  <th className="p-3.5 font-semibold">{t('prd.pricing.table.item')}</th>
                  <th className="p-3.5 font-semibold">{t('prd.pricing.table.category')}</th>
                  <th className="p-3.5 font-semibold">{t('prd.pricing.table.rate')}</th>
                  <th className="p-3.5 font-semibold">{t('prd.pricing.table.unit')}</th>
                  <th className="p-3.5 font-semibold">{t('prd.pricing.table.desc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 bg-white">
                {PRICING_STANDARDS.map((p, index) => (
                  <tr key={index} className="hover:bg-canvas-soft/40 transition-colors">
                    <td className="p-3.5 font-bold text-ink leading-tight">{p.item}</td>
                    <td className="p-3.5">
                      <span className={`chip text-[10px] font-semibold ${
                        p.category.includes('LLM') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        p.category.includes('Keamanan') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-canvas text-mute border-line'
                      }`}>{p.category}</span>
                    </td>
                    <td className="p-3.5 font-mono text-ink font-semibold">{p.rate}</td>
                    <td className="p-3.5 text-mute font-semibold">{p.unit}</td>
                    <td className="p-3.5 text-mute leading-relaxed max-w-xs">{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl space-y-1 text-xs">
            <span className="font-bold text-teal-800 block">{t('prd.pricing.howItWorks')}</span>
            <p className="text-teal-900 leading-relaxed">{t('prd.pricing.howItWorksBody')}</p>
          </div>
        </div>
      )}

      {deletingEngine && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white border border-line rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-fade-up space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 grid place-items-center mx-auto mb-2">
              <X size={24} />
            </div>
            <h3 className="font-display font-semibold text-lg text-ink">{t('prd.delete.title')}</h3>
            <p className="text-sm text-mute">
              {t('prd.delete.body', { title: engineTitle(t, deletingEngine) })}
            </p>
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setDeletingEngine(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-mute hover:bg-canvas transition-colors cursor-pointer w-full"
              >
                {t('prd.delete.cancel')}
              </button>
              <button
                onClick={() => {
                  const newEngines = engines.filter((e) => e.id !== deletingEngine.id);
                  setEngines(newEngines);
                  if (newEngines.length > 0) setActiveEngine(newEngines[0]!.id);
                  setDeletingEngine(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer w-full"
              >
                {t('prd.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
