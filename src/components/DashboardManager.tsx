import { useState } from 'react';
import { BellRing, CircleCheck, Flame, Lightbulb, Plus } from 'lucide-react';
import { ImprovementItem, Process } from '../types';
import { CLASSIFICATION_META, uid } from '../lib/utils';
import { useT } from '../lib/i18n';
import { Avatar, Meter, Stat } from './ui';

const STATUS_FLOW: ImprovementItem['status'][] = ['Identified', 'In Progress', 'Resolved'];

/** Manager space (L3) — completion tracking, high-effort flags, improvement guidance (US-17/19/20). */
export default function DashboardManager({
  processes,
  improvementItems,
  onAddImprovementItem,
  onUpdateImprovementItem,
  onTriggerReminder,
}: {
  processes: Process[];
  improvementItems: ImprovementItem[];
  onAddImprovementItem: (item: ImprovementItem) => void;
  onUpdateImprovementItem: (item: ImprovementItem) => void;
  onTriggerReminder: (email: string, subject: string, msg: string) => void;
}) {
  const t = useT();
  const [remindedEmails, setRemindedEmails] = useState<string[]>([]);

  const statusLabel = (status: 'Complete' | 'In progress' | 'Not started') => {
    if (status === 'Complete') return t('dash.mgr.complete');
    if (status === 'In progress') return t('dash.mgr.inProgress');
    return t('dash.mgr.notStarted');
  };

  const processCountLabel = (n: number) =>
    t(n === 1 ? 'dash.mgr.processCount.one' : 'dash.mgr.processCount.other', { n });

  const solutionLabel = (solution: ImprovementItem['recommendedSolution']) => {
    if (solution === 'Automation') return t('dash.mgr.solutionAutomation');
    if (solution === 'Agentic AI') return t('dash.mgr.solutionAgentic');
    return t('dash.mgr.solutionSimplification');
  };

  const improvementStatusLabel = (status: ImprovementItem['status']) => {
    if (status === 'Identified') return t('dash.mgr.statusIdentified');
    if (status === 'In Progress') return t('dash.mgr.statusInProgress');
    return t('dash.mgr.statusResolved');
  };

  const recommendSolution = (proc: Process): ImprovementItem['recommendedSolution'] =>
    (proc.automationSuitability ?? 0) >= 80 ? 'Automation' : (proc.effortRating ?? 0) >= 4 ? 'Agentic AI' : 'Simplification';

  // Roster from real process owners — no hardcoded user list.
  const rosterMap = new Map<string, { name: string; email: string; owned: Process[] }>();
  for (const p of processes) {
    const key = (p.ownerEmail || p.ownerName || '').toLowerCase();
    if (!key) continue;
    const row = rosterMap.get(key) || { name: p.ownerName, email: p.ownerEmail || '', owned: [] };
    row.owned.push(p);
    rosterMap.set(key, row);
  }
  const roster = [...rosterMap.values()].map((user) => {
    const status: 'Complete' | 'In progress' | 'Not started' =
      user.owned.length === 0 ? 'Not started' : user.owned.every((p) => p.completenessScore >= 85) ? 'Complete' : 'In progress';
    return { user, owned: user.owned, status };
  });

  const completionPct = roster.length
    ? Math.round((roster.filter((r) => r.status === 'Complete').length / roster.length) * 100)
    : 0;

  const highEffort = processes
    .filter((p) => (p.effortRating ?? 0) >= 4 || (p.automationSuitability ?? 0) >= 70)
    .sort((a, b) => (b.automationSuitability ?? 0) - (a.automationSuitability ?? 0))
    .slice(0, 4);

  const tracked = new Set(improvementItems.map((i) => i.processId));

  const acceptRecommendation = (proc: Process) => {
    const solution = recommendSolution(proc);
    onAddImprovementItem({
      id: uid('imp'),
      processId: proc.id,
      processTitle: proc.title,
      subFunction: proc.subFunction,
      recommendedSolution: solution,
      status: 'Identified',
      ownerName: proc.ownerName,
      expectedImpact: t('dash.mgr.impactTemplate', {
        title: proc.title,
        solution: solutionLabel(solution).toLowerCase(),
        volume: proc.volumeRating ?? '?',
        repetitiveness: proc.repetitivenessRating ?? '?',
      }),
    });
  };

  return (
    <div className="animate-fade-up space-y-5">
      <h2 className="font-display text-xl font-semibold tracking-tight">{t('dash.mgr.title')}</h2>

      <div className="grid sm:grid-cols-3 gap-4 print:break-inside-avoid">
        <Stat label={t('dash.mgr.completion')} value={`${completionPct}%`} hint={t('dash.mgr.completionHint')} accent="citron" />
        <Stat label={t('dash.mgr.highEffort')} value={highEffort.length} hint={t('dash.mgr.highEffortHint')} accent="veil" />
        <Stat label={t('dash.mgr.guidance')} value={improvementItems.filter((i) => i.status !== 'Resolved').length} hint={t('dash.mgr.guidanceHint')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Personnel completion tracker */}
        <div className="card p-6 print:break-inside-avoid">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <CircleCheck size={15} className="text-citron-deep" /> {t('dash.mgr.tracker')}
          </h3>
          <ul className="mt-4 space-y-3.5">
            {roster.length === 0 && (
              <li className="text-xs text-mute">{t('dash.mgr.emptyRoster')}</li>
            )}
            {roster.map(({ user, owned, status }) => (
              <li key={user.email || user.name} className="flex items-center gap-3">
                <Avatar name={user.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-[11px] text-faint truncate">{user.email || t('dash.mgr.noEmail')} · {processCountLabel(owned.length)}</div>
                </div>
                <span
                  className={`chip border-transparent ${
                    status === 'Complete' ? 'bg-citron-soft text-citron-deep' : status === 'In progress' ? 'bg-veil-soft text-veil-deep' : 'bg-blush/60 text-warn'
                  }`}
                >
                  {statusLabel(status)}
                </span>
                {status !== 'Complete' && user.email && (
                  <button
                    className="btn-ghost !p-2 shrink-0 disabled:opacity-40 print:hidden"
                    title={remindedEmails.includes(user.email) ? t('dash.mgr.reminded') : t('dash.mgr.remind')}
                    aria-label={`${t('dash.mgr.remind')} ${user.name}`}
                    disabled={remindedEmails.includes(user.email)}
                    onClick={() => {
                      onTriggerReminder(
                        user.email,
                        t('dash.mgr.remindSubject'),
                        status === 'Not started'
                          ? t('dash.mgr.remindBodyNotStarted', { name: user.name.split(' ')[0]! })
                          : t('dash.mgr.remindBodyInProgress', { name: user.name.split(' ')[0]! }),
                      );
                      setRemindedEmails((prev) => [...prev, user.email]);
                    }}
                  >
                    <BellRing size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* High-effort flags */}
        <div className="card p-6 print:break-inside-avoid">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Flame size={15} className="text-warn" /> {t('dash.mgr.highTitle')}
          </h3>
          <p className="text-xs text-mute mt-0.5">{t('dash.mgr.highSub')}</p>
          <ul className="mt-4 space-y-3">
            {highEffort.length === 0 && (
              <li className="text-sm text-faint py-6 text-center">{t('dash.mgr.highEmpty')}</li>
            )}
            {highEffort.map((proc) => (
              <li key={proc.id} className="rounded-2xl border border-line p-4 print:break-inside-avoid">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{proc.title}</div>
                    <div className="text-[11px] text-faint mt-0.5">
                      {proc.ownerName} · {t('dash.mgr.effortRating', { n: proc.effortRating ?? '—' })}
                    </div>
                  </div>
                  {proc.automationSuitability != null && (
                    <span className="chip bg-veil-soft border-transparent text-veil-deep shrink-0">
                      {t('dash.mgr.suitability', { n: proc.automationSuitability })}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-mute">
                    {t('dash.mgr.recommended')} <strong>{solutionLabel(recommendSolution(proc))}</strong>
                  </span>
                  {tracked.has(proc.id) ? (
                    <span className="text-[11px] font-semibold text-ok">{t('dash.mgr.tracked')} ✓</span>
                  ) : (
                    <button className="btn-ghost !py-1.5 !px-3 !text-[11px] print:hidden" onClick={() => acceptRecommendation(proc)}>
                      <Plus size={11} /> {t('dash.mgr.track')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Improvement / guidance tracker */}
      <div className="card p-6 print:break-inside-avoid">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Lightbulb size={15} className="text-veil-deep" /> {t('dash.mgr.board')}
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] text-mute">
                <th className="pb-2.5 font-semibold">{t('dash.mgr.colProcess')}</th>
                <th className="pb-2.5 font-semibold">{t('dash.mgr.colSolution')}</th>
                <th className="pb-2.5 font-semibold">{t('dash.mgr.colOwner')}</th>
                <th className="pb-2.5 font-semibold w-44">{t('dash.mgr.colImpact')}</th>
                <th className="pb-2.5 font-semibold">{t('dash.mgr.colStatus')}</th>
                <th className="pb-2.5 font-semibold">{t('dash.mgr.colSavings')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {improvementItems.map((item) => {
                const solutionTone =
                  item.recommendedSolution === 'Agentic AI' ? CLASSIFICATION_META['agentic-ai'] : item.recommendedSolution === 'Automation' ? CLASSIFICATION_META.automation : null;
                return (
                  <tr key={item.id}>
                    <td className="py-3 pr-3 font-medium max-w-56"><span className="line-clamp-1">{item.processTitle}</span></td>
                    <td className="py-3 pr-3">
                      <span className={`chip border-transparent ${solutionTone ? `${solutionTone.bg} ${solutionTone.fg}` : 'bg-canvas'}`}>
                        {solutionLabel(item.recommendedSolution)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-mute whitespace-nowrap">{item.ownerName}</td>
                    <td className="py-3 pr-3 text-xs text-mute max-w-64"><span className="line-clamp-2">{item.expectedImpact}</span></td>
                    <td className="py-3 pr-3">
                      <select
                        className="field !py-1.5 !px-3 !text-xs !rounded-full !w-auto cursor-pointer"
                        value={item.status}
                        onChange={(e) => onUpdateImprovementItem({ ...item, status: e.target.value as ImprovementItem['status'] })}
                      >
                        {STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>{improvementStatusLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-xs text-mute whitespace-nowrap">{item.realizedSavings ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <Meter value={improvementItems.length ? (improvementItems.filter((i) => i.status === 'Resolved').length / improvementItems.length) * 100 : 0} />
          </div>
          <span className="text-xs text-mute font-semibold whitespace-nowrap">
            {t('dash.mgr.resolvedCount', {
              resolved: improvementItems.filter((i) => i.status === 'Resolved').length,
              total: improvementItems.length,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
