import { useMemo, useState, Fragment } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Database, Download, Megaphone, Rocket, Send, Trophy, Plus, Edit2, Trash2, Settings2, Search, X, Check, HelpCircle } from 'lucide-react';
import { ImprovementItem, Process, SubFunction, SystemItem } from '../types';
import { SUBFUNCTIONS_LIST } from '../data/mockData';
import { isRemoteEnabled } from '../lib/blueprintApi';
import { CHART_COLORS, classificationCounts } from '../lib/utils';
import { useT } from '../lib/i18n';
import { Meter, Stat, AutoTextarea } from './ui';
import RemoteUserAdmin from './RemoteUserAdmin';

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: '1px solid var(--color-line)',
  background: '#fff',
  boxShadow: 'var(--shadow-lift)',
  fontSize: 12,
  padding: '8px 12px',
};

const READINESS_THRESHOLD = 85;

const SYSTEM_CATEGORIES = [
  { value: 'Enterprise Resource Planning (Financial Core)', labelKey: 'admin.category.erp' },
  { value: 'Procurement E-System', labelKey: 'admin.category.procurement' },
  { value: 'Tax Compliance Portal', labelKey: 'admin.category.tax' },
  { value: 'Clinical Data Layer', labelKey: 'admin.category.clinical' },
  { value: 'Insurance / Reinsurance Portal', labelKey: 'admin.category.insurance' },
  { value: 'Corporate Banking Platform', labelKey: 'admin.category.banking' },
  { value: 'Analytics & Presentation Layer', labelKey: 'admin.category.analytics' },
  { value: 'Custom System / Legacy App', labelKey: 'admin.category.legacy' },
  { value: 'Other Productivity Tool', labelKey: 'admin.category.other' },
] as const;

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const name = payload.value || '';
  
  const cleanName = name.replace(/\u00A0/g, ' ');
  
  const words = cleanName.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach((word: string) => {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + word.length + 1 <= 16) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  
  const lineHeight = 12;
  const totalHeight = lines.length * lineHeight;
  const startDy = -(totalHeight / 2) + lineHeight / 2 + 3;

  return (
    <g transform={`translate(${x - 6}, ${y})`}>
      <text
        textAnchor="end"
        fill="var(--color-mute)"
        fontSize="10.5"
        className="font-sans"
      >
        {lines.map((line, idx) => (
          <tspan
            key={idx}
            x={0}
            dy={idx === 0 ? startDy : lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

function categoryLabel(t: ReturnType<typeof useT>, value: string) {
  const found = SYSTEM_CATEGORIES.find((c) => c.value === value);
  return found ? t(found.labelKey) : value;
}

/** Programme admin (US-21/22/23) — hackathon dataset, data quality, next-stage readiness, broadcasts. */
export default function AdminPanel({
  processes,
  availableSystems,
  onUpdateSystems,
  improvementItems,
  onTriggerAdminNotification,
}: {
  processes: Process[];
  availableSystems: SystemItem[];
  onUpdateSystems: (systems: SystemItem[]) => void;
  improvementItems: ImprovementItem[];
  onTriggerAdminNotification: (subject: string, msg: string, type: 'individual' | 'level' | 'subfunction' | 'all', val: string) => void;
}) {
  const t = useT();
  const [targetType, setTargetType] = useState<'individual' | 'level' | 'subfunction' | 'all'>('level');
  const [targetValue, setTargetValue] = useState('L4');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sentFlash, setSentFlash] = useState(false);

  const [systemSearchQuery, setSystemSearchQuery] = useState('');
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [systemNameInput, setSystemNameInput] = useState('');
  const [systemCategoryInput, setSystemCategoryInput] = useState('Enterprise Resource Planning (Financial Core)');
  const [systemDescriptionInput, setSystemDescriptionInput] = useState('');
  const [systemToDelete, setSystemToDelete] = useState<{ id: string; name: string } | null>(null);

  const getProcessCountForSystem = (systemName: string) => {
    return processes.filter(p => 
      p.steps.some(s => s.systems.some(sys => sys.toLowerCase() === systemName.toLowerCase() || sys.toLowerCase().startsWith(systemName.toLowerCase())))
    ).length;
  };

  const handleStartAddSystem = () => {
    setEditingSystemId('new');
    setSystemNameInput('');
    setSystemCategoryInput('Enterprise Resource Planning (Financial Core)');
    setSystemDescriptionInput('');
    setSystemToDelete(null);
  };

  const handleStartEditSystem = (sys: SystemItem) => {
    setEditingSystemId(sys.id);
    setSystemNameInput(sys.name);
    setSystemCategoryInput(sys.category);
    setSystemDescriptionInput(sys.description || '');
    setSystemToDelete(null);
  };

  const handleCancelSystemEdit = () => {
    setEditingSystemId(null);
    setSystemNameInput('');
    setSystemDescriptionInput('');
  };

  const handleSaveSystem = () => {
    if (!systemNameInput.trim()) return;

    if (editingSystemId === 'new') {
      const newSys: SystemItem = {
        id: `sys-${Date.now()}`,
        name: systemNameInput.trim(),
        category: systemCategoryInput,
        processCount: 0,
        description: systemDescriptionInput.trim()
      };
      onUpdateSystems([...availableSystems, newSys]);
    } else {
      const updated = availableSystems.map(s => {
        if (s.id === editingSystemId) {
          return {
            ...s,
            name: systemNameInput.trim(),
            category: systemCategoryInput,
            description: systemDescriptionInput.trim()
          };
        }
        return s;
      });
      onUpdateSystems(updated);
    }

    setEditingSystemId(null);
    setSystemNameInput('');
    setSystemDescriptionInput('');
  };

  const handleDeleteSystem = (id: string, name: string) => {
    setSystemToDelete({ id, name });
  };

  const confirmDeleteSystem = () => {
    if (!systemToDelete) return;
    const filtered = availableSystems.filter(s => s.id !== systemToDelete.id);
    onUpdateSystems(filtered);
    setSystemToDelete(null);
  };

  const filteredSystems = useMemo(() => {
    const q = systemSearchQuery.toLowerCase().trim();
    if (!q) return availableSystems;
    return availableSystems.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q))
    );
  }, [availableSystems, systemSearchQuery]);

  const avgCompleteness = processes.length
    ? Math.round(processes.reduce((s, p) => s + p.completenessScore, 0) / processes.length)
    : 0;
  const ready = processes.filter((p) => p.completenessScore >= READINESS_THRESHOLD);
  const counts = classificationCounts(processes);
  const classifiedSteps = counts.automation + counts['agentic-ai'] + counts['human-in-the-loop'];

  const systemsData = useMemo(() => {
    const bySystem = new Map<string, number>();
    for (const p of processes) {
      const touched = new Set(p.steps.flatMap((s) => s.systems));
      for (const sys of touched) bySystem.set(sys, (bySystem.get(sys) ?? 0) + 1);
    }
    return Array.from(bySystem.entries())
      .map(([name, count]) => ({ name: name.replace(/\s*\(.*?\)/, ''), full: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [processes]);

  const hackathonList = [...processes]
    .filter((p) => p.automationSuitability != null)
    .sort((a, b) => (b.automationSuitability ?? 0) - (a.automationSuitability ?? 0))
    .slice(0, 6);

  const lowCompleteness = processes.filter((p) => p.completenessScore < READINESS_THRESHOLD);

  const exportDataset = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), processes, systems: availableSystems, improvementItems }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blueprint-process-dataset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const chase = (proc: Process) => {
    setTargetType('individual');
    setTargetValue(proc.ownerEmail);
    setSubject(t('admin.chase.subject', { title: proc.title, percent: proc.completenessScore }));
    const gaps = proc.gaps.length
      ? t('admin.chase.gapsPrefix', { gaps: proc.gaps.slice(0, 3).join(' ') })
      : '';
    setMessage(
      t('admin.chase.message', {
        firstName: proc.ownerName.split(' ')[0]!,
        title: proc.title,
        percent: proc.completenessScore,
        gaps,
      }),
    );
    document.getElementById('admin-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const send = () => {
    if (!subject.trim() || !message.trim()) return;
    if (targetType !== 'all' && !targetValue.trim()) return;
    onTriggerAdminNotification(subject.trim(), message.trim(), targetType, targetType === 'all' ? 'all' : targetValue.trim());
    setSubject('');
    setMessage('');
    setSentFlash(true);
    setTimeout(() => setSentFlash(false), 2500);
  };

  const readinessPct = Math.round((avgCompleteness / READINESS_THRESHOLD) * 100);

  const categorySelect = (id: string) => (
    <select
      id={id}
      className="field cursor-pointer text-xs mt-1"
      value={systemCategoryInput}
      onChange={(e) => setSystemCategoryInput(e.target.value)}
    >
      {SYSTEM_CATEGORIES.map((cat) => (
        <option key={cat.value} value={cat.value}>
          {t(cat.labelKey)}
        </option>
      ))}
    </select>
  );

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{t('admin.title')}</h2>
          <p className="text-sm text-mute mt-0.5">{t('admin.subtitle')}</p>
        </div>
        <button className="btn-ghost" onClick={exportDataset}>
          <Download size={15} /> {t('admin.exportDataset')}
        </button>
      </div>

      {isRemoteEnabled() && <RemoteUserAdmin />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={t('admin.stat.processesCaptured')} value={processes.length} hint={t('admin.stat.classifiedSteps', { count: classifiedSteps })} accent="citron" />
        <Stat label={t('admin.stat.datasetCompleteness')} value={`${avgCompleteness}%`} hint={t('admin.stat.thresholdHint', { threshold: READINESS_THRESHOLD })} />
        <Stat label={t('admin.stat.readyNextStage')} value={ready.length} hint={t('admin.stat.processesAtThreshold')} accent="veil" />
        <Stat label={t('admin.stat.systemsMapped')} value={availableSystems.length} hint={t('admin.stat.masterCatalogue')} />
      </div>

      <div className="card bg-ink border-transparent text-white p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Rocket size={15} className="text-citron" /> {t('admin.readinessTitle')}
          </h3>
          <span className="text-xs text-white/60">{t('admin.readinessPct', { percent: Math.min(100, readinessPct) })}</span>
        </div>
        <div className="mt-4"><Meter value={Math.min(100, readinessPct)} /></div>
        <p className="text-xs text-white/60 mt-3 leading-relaxed max-w-2xl">
          {avgCompleteness >= READINESS_THRESHOLD
            ? t('admin.readinessMet')
            : t('admin.readinessBelow', { percent: avgCompleteness, threshold: READINESS_THRESHOLD })}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm">{t('admin.processesPerSystem')}</h3>
          <p className="text-xs text-mute mt-0.5 mb-4">{t('admin.processesPerSystemSub')}</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={systemsData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10.5, fill: 'var(--color-mute)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={135} tick={<CustomYAxisTick />} axisLine={{ stroke: 'var(--color-line)' }} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(23,23,28,0.04)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) => [
                  t(Number(value) === 1 ? 'admin.chart.process' : 'admin.chart.processes', { count: value }),
                  t('admin.chart.touches'),
                ]}
                labelFormatter={(_, payload) => (payload?.[0]?.payload as any)?.full ?? ''}
              />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Trophy size={15} className="text-citron-deep" /> {t('admin.hackathonTitle')}
          </h3>
          <p className="text-xs text-mute mt-0.5">{t('admin.hackathonSub')}</p>
          <ol className="mt-4 space-y-2.5">
            {hackathonList.length === 0 && (
              <li className="text-sm text-faint py-6 text-center">{t('admin.hackathonEmpty')}</li>
            )}
            {hackathonList.map((proc, i) => (
              <li key={proc.id} className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
                <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-citron text-ink' : 'bg-canvas text-mute'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{proc.title}</div>
                  <div className="text-[11px] text-faint truncate">{proc.subFunction}</div>
                </div>
                <span className="chip bg-veil-soft border-transparent text-veil-deep shrink-0">{proc.automationSuitability}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Settings2 size={15} className="text-veil-deep" /> {t('admin.systemsRegistryTitle')}
            </h3>
            <p className="text-xs text-mute mt-0.5">{t('admin.systemsRegistrySub')}</p>
          </div>
          <button
            onClick={handleStartAddSystem}
            className="btn-dark flex items-center gap-1.5 !py-1.5 !px-3.5 text-xs"
          >
            <Plus size={13} /> {t('admin.addNewSystem')}
          </button>
        </div>

        {editingSystemId === 'new' && (
          <div className="bg-canvas border border-line rounded-2xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <h4 className="font-semibold text-xs text-ink uppercase tracking-wider">
                {t('admin.addSystemHeading')}
              </h4>
              <button
                onClick={handleCancelSystemEdit}
                className="text-mute hover:text-ink cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-xs font-semibold" htmlFor="sys-name">{t('admin.systemNameLabel')}</label>
                <input
                  id="sys-name"
                  type="text"
                  className="field text-xs mt-1"
                  placeholder={t('admin.systemNamePlaceholder')}
                  value={systemNameInput}
                  onChange={(e) => setSystemNameInput(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs font-semibold" htmlFor="sys-cat">{t('admin.categoryLabel')}</label>
                {categorySelect('sys-cat')}
              </div>
            </div>

            <div>
              <label className="label text-xs font-semibold" htmlFor="sys-desc">{t('admin.aiContextLabel')}</label>
              <AutoTextarea
                id="sys-desc"
                className="field min-h-20 text-xs mt-1"
                placeholder={t('admin.aiContextPlaceholder')}
                value={systemDescriptionInput}
                onChange={(e) => setSystemDescriptionInput(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" onClick={handleCancelSystemEdit} className="btn-ghost !py-2 !px-4 text-xs">
                {t('admin.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveSystem}
                className="btn-dark !py-2 !px-4 text-xs flex items-center gap-1.5"
                disabled={!systemNameInput.trim()}
              >
                <Check size={14} /> {t('admin.saveSystem')}
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            className="field !pl-9 text-xs"
            placeholder={t('admin.searchSystemsPlaceholder')}
            value={systemSearchQuery}
            onChange={(e) => setSystemSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-mute font-medium">
                <th className="py-2.5 px-3">{t('admin.table.systemName')}</th>
                <th className="py-2.5 px-3">{t('admin.table.category')}</th>
                <th className="py-2.5 px-3">{t('admin.table.aiContext')}</th>
                <th className="py-2.5 px-3 text-center">{t('admin.table.touchCount')}</th>
                <th className="py-2.5 px-3 text-right">{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSystems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-faint">
                    {t('admin.noSystemsMatch')}
                  </td>
                </tr>
              ) : (
                filteredSystems.map((sys) => {
                  const touches = getProcessCountForSystem(sys.name);
                  const isBeingEdited = editingSystemId === sys.id;
                  const isBeingDeleted = systemToDelete?.id === sys.id;
                  return (
                    <Fragment key={sys.id}>
                      <tr className={`border-b border-line/60 hover:bg-canvas-soft/30 transition-colors ${(isBeingEdited || isBeingDeleted) ? 'bg-veil-soft/10' : ''}`}>
                        <td className="py-3 px-3 font-medium text-ink">{sys.name}</td>
                        <td className="py-3 px-3">
                          <span className="chip bg-veil-soft border-transparent text-veil-deep whitespace-nowrap text-[10px]">
                            {categoryLabel(t, sys.category)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-mute max-w-xs truncate" title={sys.description || t('admin.noAiContextTitle')}>
                          {sys.description || (
                            <span className="text-faint italic font-normal">
                              {t('admin.noAiContextBody')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center min-w-5 h-5 rounded-full px-1.5 text-[10px] font-bold ${touches > 0 ? 'bg-citron text-ink font-semibold' : 'bg-canvas text-faint border border-line'}`}>
                            {touches}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEditSystem(sys)}
                              className={`w-7 h-7 rounded-full hover:bg-veil flex items-center justify-center transition-colors cursor-pointer ${isBeingEdited ? 'bg-citron text-ink font-semibold' : 'text-mute hover:text-ink'}`}
                              title={t('admin.editSystemTitle')}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteSystem(sys.id, sys.name)}
                              className={`w-7 h-7 rounded-full hover:bg-bad/10 flex items-center justify-center transition-colors cursor-pointer ${isBeingDeleted ? 'bg-bad text-white' : 'text-mute hover:text-bad'}`}
                              title={t('admin.deleteSystemTitle')}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isBeingEdited && (
                        <tr className="bg-canvas/50 border-b border-line/60 animate-fade-in">
                          <td colSpan={5} className="py-4 px-4 bg-veil-soft/5">
                            <div className="bg-canvas border border-line rounded-2xl p-4 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between pb-2 border-b border-line/60">
                                <h4 className="font-semibold text-xs text-ink uppercase tracking-wider">
                                  {t('admin.editRegistryHeading', { name: sys.name })}
                                </h4>
                                <button onClick={handleCancelSystemEdit} className="text-mute hover:text-ink cursor-pointer">
                                  <X size={14} />
                                </button>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="label text-xs font-semibold" htmlFor={`sys-name-${sys.id}`}>{t('admin.systemNameLabel')}</label>
                                  <input
                                    id={`sys-name-${sys.id}`}
                                    type="text"
                                    className="field text-xs mt-1"
                                    placeholder={t('admin.systemNamePlaceholder')}
                                    value={systemNameInput}
                                    onChange={(e) => setSystemNameInput(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="label text-xs font-semibold" htmlFor={`sys-cat-${sys.id}`}>{t('admin.categoryLabel')}</label>
                                  {categorySelect(`sys-cat-${sys.id}`)}
                                </div>
                              </div>

                              <div>
                                <label className="label text-xs font-semibold" htmlFor={`sys-desc-${sys.id}`}>{t('admin.aiContextLabel')}</label>
                                <AutoTextarea
                                  id={`sys-desc-${sys.id}`}
                                  className="field min-h-20 text-xs mt-1"
                                  placeholder={t('admin.aiContextPlaceholder')}
                                  value={systemDescriptionInput}
                                  onChange={(e) => setSystemDescriptionInput(e.target.value)}
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button type="button" onClick={handleCancelSystemEdit} className="btn-ghost !py-2 !px-4 text-xs">
                                  {t('admin.cancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveSystem}
                                  className="btn-dark !py-2 !px-4 text-xs flex items-center gap-1.5"
                                  disabled={!systemNameInput.trim()}
                                >
                                  <Check size={14} /> {t('admin.saveSystem')}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isBeingDeleted && (
                        <tr className="bg-bad/5 border-b border-line/40 animate-fade-in">
                          <td colSpan={5} className="py-4 px-4 bg-bad/5">
                            <div className="bg-canvas border border-bad/30 rounded-2xl p-4 space-y-3 shadow-sm">
                              <div className="flex items-start gap-2.5">
                                <HelpCircle size={16} className="text-bad mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-xs text-ink">{t('admin.deleteSystemHeading', { name: systemToDelete.name })}</h4>
                                  <p className="text-[11px] text-mute mt-1">{t('admin.deleteSystemBody')}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setSystemToDelete(null)} className="btn-ghost !py-1.5 !px-3.5 !text-[11px]">
                                  {t('admin.cancel')}
                                </button>
                                <button type="button" onClick={confirmDeleteSystem} className="btn-dark !bg-bad hover:!bg-bad/90 !text-white !py-1.5 !px-3.5 !text-[11px]">
                                  {t('admin.confirmDeleteSystem')}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Database size={15} className="text-veil-deep" /> {t('admin.dataQualityTitle')}
        </h3>
        {lowCompleteness.length === 0 ? (
          <p className="text-sm text-faint mt-3">{t('admin.allAtThreshold', { threshold: READINESS_THRESHOLD })}</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {lowCompleteness.map((proc) => (
              <li key={proc.id} className="flex items-center gap-4 rounded-2xl border border-line px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-40">
                  <div className="text-sm font-medium truncate">{proc.title}</div>
                  <div className="text-[11px] text-faint">
                    {proc.ownerName} · {t(proc.gaps.length === 1 ? 'admin.openGaps' : 'admin.openGapsPlural', { count: proc.gaps.length })}
                  </div>
                </div>
                <div className="w-36 flex items-center gap-2">
                  <div className="flex-1"><Meter value={proc.completenessScore} /></div>
                  <span className="text-xs font-bold">{proc.completenessScore}%</span>
                </div>
                <button className="btn-ghost !py-1.5 !px-3.5 !text-[11px]" onClick={() => chase(proc)}>
                  <Megaphone size={11} /> {t('admin.chaseOwner')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="admin-composer" className="card p-6">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Send size={15} className="text-veil-deep" /> {t('admin.notifyTitle')}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label" htmlFor="adm-type">{t('admin.audience')}</label>
            <select
              id="adm-type"
              className="field cursor-pointer"
              value={targetType}
              onChange={(e) => {
                const next = e.target.value as typeof targetType;
                setTargetType(next);
                setTargetValue(next === 'level' ? 'L4' : next === 'subfunction' ? SUBFUNCTIONS_LIST[0]! : '');
              }}
            >
              <option value="individual">{t('admin.audience.individual')}</option>
              <option value="level">{t('admin.audience.level')}</option>
              <option value="subfunction">{t('admin.audience.subfunction')}</option>
              <option value="all">{t('admin.audience.all')}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="adm-target">{t('admin.target')}</label>
            {targetType === 'level' ? (
              <select id="adm-target" className="field cursor-pointer" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}>
                {['L1', 'L2', 'L3', 'L4'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : targetType === 'subfunction' ? (
              <select id="adm-target" className="field cursor-pointer" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}>
                {SUBFUNCTIONS_LIST.map((sf: SubFunction) => <option key={sf} value={sf}>{sf}</option>)}
              </select>
            ) : targetType === 'individual' ? (
              <>
                <input id="adm-target" className="field" list="adm-emails" placeholder={t('admin.emailPlaceholder')} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
                <datalist id="adm-emails">
                  {[...new Set(processes.map((p) => p.ownerEmail).filter(Boolean))].map((email) => (
                    <option key={email} value={email} />
                  ))}
                </datalist>
              </>
            ) : (
              <input className="field" value={t('admin.allRegisteredUsers')} disabled />
            )}
          </div>
        </div>
        <div className="mt-3.5">
          <label className="label" htmlFor="adm-subject">{t('admin.subject')}</label>
          <input id="adm-subject" className="field" placeholder={t('admin.subjectPlaceholder')} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="mt-3.5">
          <label className="label" htmlFor="adm-msg">{t('admin.message')}</label>
          <AutoTextarea id="adm-msg" className="field min-h-24" placeholder={t('admin.messagePlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {sentFlash && <span className="text-xs font-semibold text-ok animate-fade-up">{t('admin.sentFlash')}</span>}
          <button
            className="btn-dark"
            onClick={send}
            disabled={!subject.trim() || !message.trim() || (targetType !== 'all' && !targetValue.trim())}
          >
            <Send size={14} /> {t('admin.sendNotification')}
          </button>
        </div>
      </div>
    </div>
  );
}
