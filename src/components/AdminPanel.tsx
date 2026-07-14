import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Database, Download, Megaphone, Rocket, Send, Trophy, UsersRound } from 'lucide-react';
import { ImprovementItem, Process, SubFunction, SystemItem, UserProfile } from '../types';
import { SUBFUNCTIONS_LIST } from '../data/mockData';
import { CHART_COLORS, classificationCounts } from '../lib/utils';
import { Meter, Stat } from './ui';

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: '1px solid var(--color-line)',
  background: '#fff',
  boxShadow: 'var(--shadow-lift)',
  fontSize: 12,
  padding: '8px 12px',
};

const READINESS_THRESHOLD = 85;

/** Programme admin (US-21/22/23) — hackathon dataset, data quality, next-stage readiness, broadcasts. */
export default function AdminPanel({
  processes,
  availableSystems,
  registeredProfiles,
  improvementItems,
  onTriggerAdminNotification,
}: {
  processes: Process[];
  availableSystems: SystemItem[];
  registeredProfiles: UserProfile[];
  improvementItems: ImprovementItem[];
  onTriggerAdminNotification: (subject: string, msg: string, type: 'individual' | 'level' | 'subfunction' | 'all', val: string) => void;
}) {
  const [targetType, setTargetType] = useState<'individual' | 'level' | 'subfunction' | 'all'>('level');
  const [targetValue, setTargetValue] = useState('L4');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sentFlash, setSentFlash] = useState(false);

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
  const registeredUsers = [...registeredProfiles].sort((a, b) => a.name.localeCompare(b.name));

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
    setSubject(`Please complete "${proc.title}" (${proc.completenessScore}% complete)`);
    setMessage(
      `Hi ${proc.ownerName.split(' ')[0]}, your process "${proc.title}" is at ${proc.completenessScore}% completeness. ` +
        (proc.gaps.length ? `Open gaps: ${proc.gaps.slice(0, 3).join(' ')} ` : '') +
        'Please add the missing detail so it can move to the next transformation stage.',
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

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Programme control room</h2>
          <p className="text-sm text-mute mt-0.5">Data quality, the hackathon dataset and next-stage readiness — all in one place.</p>
        </div>
        <button className="btn-ghost" onClick={exportDataset}>
          <Download size={15} /> Export dataset
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Processes captured" value={processes.length} hint={`${classifiedSteps} classified steps`} accent="citron" />
        <Stat label="Registered users" value={registeredUsers.length} hint="from spreadsheet profiles" accent="veil" />
        <Stat label="Dataset completeness" value={`${avgCompleteness}%`} hint={`threshold ${READINESS_THRESHOLD}% for next stage`} />
        <Stat label="Ready for next stage" value={ready.length} hint="processes at threshold" accent="veil" />
        <Stat label="Systems mapped" value={availableSystems.length} hint="in the master catalogue" />
      </div>

      <div className="card p-6">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <UsersRound size={15} className="text-veil-deep" /> Registered users
        </h3>
        {registeredUsers.length === 0 ? (
          <p className="text-sm text-faint mt-3">No registered users synced yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="text-left text-[11px] uppercase text-faint">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 text-right">Processes</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.map((user) => {
                  const email = user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@local`;
                  const owned = processes.filter((p) => p.ownerEmail === email || p.ownerName === user.name).length;
                  return (
                    <tr key={email} className="border-t border-line">
                      <td className="py-2 pr-4 font-medium">{user.name}</td>
                      <td className="py-2 pr-4 text-mute">{email}</td>
                      <td className="py-2 pr-4">{user.role}</td>
                      <td className="py-2 pr-4 text-mute">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="py-2 text-right font-semibold">{owned}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transformation readiness */}
      <div className="card bg-ink border-transparent text-white p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Rocket size={15} className="text-citron" /> Next-stage readiness · data clean-up &amp; agentic deployment
          </h3>
          <span className="text-xs text-white/60">{Math.min(100, readinessPct)}% of the way there</span>
        </div>
        <div className="mt-4"><Meter value={Math.min(100, readinessPct)} /></div>
        <p className="text-xs text-white/60 mt-3 leading-relaxed max-w-2xl">
          {avgCompleteness >= READINESS_THRESHOLD
            ? 'Threshold met — export the dataset and kick off the data clean-up stage with the ranked candidates below.'
            : `Dataset completeness is ${avgCompleteness}%. Chase the low-completeness processes below to unlock the next stage at ${READINESS_THRESHOLD}%.`}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Systems analytics */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm">Processes per system</h3>
          <p className="text-xs text-mute mt-0.5 mb-4">Where the work actually happens</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={systemsData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10.5, fill: 'var(--color-mute)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 10.5, fill: 'var(--color-mute)' }} axisLine={{ stroke: 'var(--color-line)' }} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(23,23,28,0.04)' }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) => [`${value} process${value === 1 ? '' : 'es'}`, 'Touches']}
                labelFormatter={(_, payload) => (payload?.[0]?.payload as any)?.full ?? ''}
              />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hackathon list */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Trophy size={15} className="text-citron-deep" /> Hackathon challenge list
          </h3>
          <p className="text-xs text-mute mt-0.5">Ranked by automation suitability — the most impactful AI interventions first.</p>
          <ol className="mt-4 space-y-2.5">
            {hackathonList.length === 0 && (
              <li className="text-sm text-faint py-6 text-center">Run AI refinement on captured processes to build the list.</li>
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

      {/* Data quality */}
      <div className="card p-6">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Database size={15} className="text-veil-deep" /> Data quality — completeness gaps
        </h3>
        {lowCompleteness.length === 0 ? (
          <p className="text-sm text-faint mt-3">Every captured process is at or above the {READINESS_THRESHOLD}% threshold. 🎯</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {lowCompleteness.map((proc) => (
              <li key={proc.id} className="flex items-center gap-4 rounded-2xl border border-line px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-40">
                  <div className="text-sm font-medium truncate">{proc.title}</div>
                  <div className="text-[11px] text-faint">{proc.ownerName} · {proc.gaps.length} open gap{proc.gaps.length === 1 ? '' : 's'}</div>
                </div>
                <div className="w-36 flex items-center gap-2">
                  <div className="flex-1"><Meter value={proc.completenessScore} /></div>
                  <span className="text-xs font-bold">{proc.completenessScore}%</span>
                </div>
                <button className="btn-ghost !py-1.5 !px-3.5 !text-[11px]" onClick={() => chase(proc)}>
                  <Megaphone size={11} /> Chase owner
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div id="admin-composer" className="card p-6">
        <h3 className="font-display font-semibold text-sm flex items-center gap-2">
          <Send size={15} className="text-veil-deep" /> Notify by level, line-of-work or individual
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label" htmlFor="adm-type">Audience</label>
            <select
              id="adm-type"
              className="field cursor-pointer"
              value={targetType}
              onChange={(e) => {
                const t = e.target.value as typeof targetType;
                setTargetType(t);
                setTargetValue(t === 'level' ? 'L4' : t === 'subfunction' ? SUBFUNCTIONS_LIST[0]! : '');
              }}
            >
              <option value="individual">Individual</option>
              <option value="level">Level</option>
              <option value="subfunction">Line of work</option>
              <option value="all">Everyone</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="adm-target">Target</label>
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
                <input id="adm-target" className="field" list="adm-emails" placeholder="person@company.com" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
                <datalist id="adm-emails">
                  {registeredUsers.map((u) => <option key={u.email || u.name} value={u.email || ''} />)}
                </datalist>
              </>
            ) : (
              <input className="field" value="All registered users" disabled />
            )}
          </div>
        </div>
        <div className="mt-3.5">
          <label className="label" htmlFor="adm-subject">Subject</label>
          <input id="adm-subject" className="field" placeholder="e.g. Reminder: documentation deadline Friday" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="mt-3.5">
          <label className="label" htmlFor="adm-msg">Message</label>
          <textarea id="adm-msg" className="field min-h-24" placeholder="What do you need from them?" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {sentFlash && <span className="text-xs font-semibold text-ok animate-fade-up">Sent — logged in broadcast history ✓</span>}
          <button
            className="btn-dark"
            onClick={send}
            disabled={!subject.trim() || !message.trim() || (targetType !== 'all' && !targetValue.trim())}
          >
            <Send size={14} /> Send notification
          </button>
        </div>
      </div>
    </div>
  );
}
