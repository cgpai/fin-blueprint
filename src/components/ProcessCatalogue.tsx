import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  GitBranch,
  Layers,
  PencilLine,
  Plus,
  Printer,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { Persona, Process } from '../types';
import { SUBFUNCTIONS_LIST } from '../data/mockData';
import { timeAgo } from '../lib/utils';
import { Avatar, ClassChip, EmptyState, Meter, StatusChip } from './ui';

function ProcessDetail({
  proc,
  onBack,
  onEdit,
  onDelete,
}: {
  proc: Process;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const systems = Array.from(new Set(proc.steps.flatMap((s) => s.systems)));

  return (
    <div id="process-detail-view" className="animate-fade-up space-y-4">
      <button onClick={onBack} className="btn-ghost !py-2 !px-4 text-xs">
        <ArrowLeft size={13} /> All processes
      </button>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip status={proc.status} />
              <span className="chip">{proc.subFunction}</span>
              {proc.isShared && (
                <span className="chip bg-veil-soft border-transparent text-veil-deep">
                  <UsersRound size={11} /> Shared
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight mt-3 leading-snug">{proc.title}</h2>
            <p className="text-sm text-mute mt-2 leading-relaxed max-w-2xl">{proc.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => window.print()} className="btn-ghost !p-2.5" title="Export / print (PDF)" aria-label="Export or print">
              <Printer size={15} />
            </button>
            <button onClick={onEdit} className="btn-ghost !py-2.5 !px-4 text-xs">
              <PencilLine size={13} /> Edit
            </button>
            <button onClick={onDelete} className="btn-ghost !p-2.5 hover:!border-bad hover:text-bad" title="Delete" aria-label="Delete process">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-5 mt-6 pt-5 border-t border-line">
          <div>
            <div className="label">Owner</div>
            <div className="flex items-center gap-2">
              <Avatar name={proc.ownerName} size={26} />
              <div>
                <div className="text-sm font-medium leading-tight">{proc.ownerName}</div>
                <div className="text-[11px] text-faint">{proc.ownerLevel} · {timeAgo(proc.lastUpdated)}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="label">Completeness</div>
            <div className="flex items-center gap-2">
              <div className="flex-1"><Meter value={proc.completenessScore} /></div>
              <span className="text-sm font-bold">{proc.completenessScore}%</span>
            </div>
          </div>
          <div>
            <div className="label">Automation suitability</div>
            {proc.automationSuitability != null ? (
              <div className="flex items-center gap-2">
                <div className="flex-1"><Meter value={proc.automationSuitability} tone="veil" /></div>
                <span className="text-sm font-bold">{proc.automationSuitability}</span>
              </div>
            ) : (
              <span className="text-xs text-faint">Run AI refinement to score</span>
            )}
          </div>
          <div>
            <div className="label">Collaborators</div>
            <div className="text-xs text-inksoft">
              {proc.taggedUsers.length ? proc.taggedUsers.join(', ') : <span className="text-faint">None tagged</span>}
            </div>
          </div>
        </div>
      </div>

      {proc.gaps.length > 0 && (
        <div className="card bg-blush/40 border-transparent px-5 py-4">
          <div className="text-xs font-bold text-warn mb-1.5">Open gaps flagged for completion</div>
          <ul className="text-sm text-inksoft space-y-1 list-disc list-inside">
            {proc.gaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step timeline */}
      <div className="card p-6">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <GitBranch size={16} className="text-veil-deep" /> Workflow steps
          <span className="text-mute font-normal text-sm">({proc.steps.length})</span>
        </h3>
        <ol className="mt-5 relative">
          {proc.steps.map((step, i) => {
            const cls = proc.userOverrides?.[step.id] ?? step.aiClassification;
            return (
              <li key={step.id} className="relative pl-12 pb-7 last:pb-0">
                {i < proc.steps.length - 1 && (
                  <span className="absolute left-[15px] top-9 bottom-0 w-px bg-line" aria-hidden />
                )}
                <span className="absolute left-0 top-0.5 w-8 h-8 rounded-full bg-ink text-white grid place-items-center text-xs font-bold">
                  {step.order}
                </span>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-sm">{step.name}</div>
                  {cls && <ClassChip classification={cls} overridden={Boolean(proc.userOverrides?.[step.id])} />}
                </div>
                <p className="text-sm text-mute mt-1.5 leading-relaxed max-w-2xl">{step.description}</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-2 max-w-2xl">
                  {step.inputs.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-mute inline-flex items-center gap-1"><ArrowDownRight size={11} /> In:</span>{' '}
                      <span className="text-inksoft">{step.inputs.join(', ')}</span>
                    </div>
                  )}
                  {step.outputs.length > 0 && (
                    <div className="text-xs">
                      <span className="font-semibold text-mute inline-flex items-center gap-1"><ArrowUpRight size={11} /> Out:</span>{' '}
                      <span className="text-inksoft">{step.outputs.join(', ')}</span>
                    </div>
                  )}
                  {step.decisionPoints.length > 0 && (
                    <div className="text-xs sm:col-span-2">
                      <span className="font-semibold text-mute">Decisions:</span>{' '}
                      <span className="text-inksoft">{step.decisionPoints.join(' · ')}</span>
                    </div>
                  )}
                  {step.handOffs.length > 0 && (
                    <div className="text-xs sm:col-span-2">
                      <span className="font-semibold text-mute">Hand-offs:</span>{' '}
                      <span className="text-inksoft">{step.handOffs.join(' · ')}</span>
                    </div>
                  )}
                </div>
                {step.systems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {step.systems.map((sys) => (
                      <span key={sys} className="chip !text-[11px]">{sys}</span>
                    ))}
                  </div>
                )}
                {step.aiRationale && (
                  <div className="mt-2.5 text-[11px] text-mute bg-canvas rounded-xl px-3 py-2 max-w-2xl">
                    <span className="font-semibold">Why {cls ? cls.replace(/-/g, ' ') : 'this'}?</span> {step.aiRationale}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Consolidated systems */}
      <div className="card p-6">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Layers size={16} className="text-veil-deep" /> Systems touched by this process
        </h3>
        <div className="flex flex-wrap gap-2 mt-4">
          {systems.length ? (
            systems.map((sys) => (
              <span key={sys} className="chip !py-1.5 !px-3.5 bg-veil-soft border-transparent text-veil-deep">{sys}</span>
            ))
          ) : (
            <span className="text-sm text-faint">No systems tagged yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProcessCatalogue({
  processes,
  selectedViewProcess,
  onSelectProcess,
  onEditProcess,
  onDeleteProcess,
  currentPersona,
  profileName,
  onCreateNew,
}: {
  processes: Process[];
  selectedViewProcess: Process | null;
  onSelectProcess: (proc: Process | null) => void;
  onEditProcess: (proc: Process) => void;
  onDeleteProcess: (id: string) => void;
  currentPersona: Persona;
  profileName: string;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const [subFunction, setSubFunction] = useState('');
  const [status, setStatus] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return processes.filter((p) => {
      if (mineOnly && p.ownerName !== profileName) return false;
      if (subFunction && p.subFunction !== subFunction) return false;
      if (status && p.status !== status) return false;
      if (q) {
        const haystack = `${p.title} ${p.description} ${p.ownerName} ${p.steps.map((s) => s.name).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [processes, query, subFunction, status, mineOnly, profileName]);

  if (selectedViewProcess) {
    return (
      <ProcessDetail
        proc={selectedViewProcess}
        onBack={() => onSelectProcess(null)}
        onEdit={() => onEditProcess(selectedViewProcess)}
        onDelete={() => onDeleteProcess(selectedViewProcess.id)}
      />
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Process catalogue</h2>
          <p className="text-sm text-mute mt-0.5">
            {processes.length} documented process{processes.length === 1 ? '' : 'es'} across the directorate.
          </p>
        </div>
      </div>

      {/* Pill filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            className="field !rounded-full !py-2 !pl-9 !pr-4 w-full sm:!w-60 text-sm"
            placeholder="Search title, owner, steps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="field !rounded-full !py-2 !px-4 !w-full sm:!w-auto text-sm cursor-pointer" value={subFunction} onChange={(e) => setSubFunction(e.target.value)}>
          <option value="">All lines of work</option>
          {SUBFUNCTIONS_LIST.map((sf) => (
            <option key={sf} value={sf}>{sf}</option>
          ))}
        </select>
        <select className="field !rounded-full !py-2 !px-4 !w-full sm:!w-auto text-sm cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {['Draft', 'Submitted', 'Refined', 'Approved'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setMineOnly(!mineOnly)}
          className={`chip !py-2 !px-4 cursor-pointer transition-colors ${mineOnly ? 'bg-ink text-white border-transparent' : 'hover:border-faint'}`}
        >
          Mine only
        </button>
      </div>

      {filtered.length === 0 ? (
        processes.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={22} />}
            title="Your catalogue is empty"
            body="Document your first working process — the guided journey takes about ten minutes, and the AI does the heavy lifting."
            action={
              currentPersona !== 'Admin' ? (
                <button onClick={onCreateNew} className="btn-dark mt-2"><Plus size={15} /> Capture your first process</button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            icon={<Search size={22} />}
            title="No matches"
            body="No process matches those filters — try clearing the search or switching line of work."
          />
        )
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((proc) => {
            const systems = Array.from(new Set(proc.steps.flatMap((s) => s.systems)));
            return (
              <button
                key={proc.id}
                onClick={() => onSelectProcess(proc)}
                className="card text-left p-5 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-lift hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusChip status={proc.status} />
                  <span className="text-[11px] text-faint">{timeAgo(proc.lastUpdated)}</span>
                </div>
                <div>
                  <div className="font-display font-semibold leading-snug">{proc.title}</div>
                  <div className="text-xs text-mute mt-1">{proc.subFunction}</div>
                </div>
                <p className="text-xs text-mute leading-relaxed line-clamp-2 flex-1">{proc.description}</p>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={proc.ownerName} size={24} />
                    <span className="text-xs font-medium truncate">{proc.ownerName}</span>
                  </div>
                  <span className="chip !text-[11px] shrink-0">{proc.steps.length} steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><Meter value={proc.completenessScore} /></div>
                  <span className="text-[11px] font-bold text-mute">{proc.completenessScore}%</span>
                </div>
                {systems.length > 0 && (
                  <div className="text-[11px] text-faint truncate">{systems.join(' · ')}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
