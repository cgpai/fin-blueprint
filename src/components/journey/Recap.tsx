import { motion } from 'motion/react';
import { ChartNoAxesColumn, Check, Lightbulb, PencilLine, ScanSearch } from 'lucide-react';
import { DraftProcess } from '../../types';
import { classificationCounts, CLASSIFICATION_META, computeCompleteness } from '../../lib/utils';
import { classLabel, useLocale, useT } from '../../lib/i18n';
import { Meter } from '../ui';

export type RecapChoice = 'edit' | 'analyse' | 'results' | 'advice';

const CHOICE_KEYS: Array<{ id: RecapChoice; icon: typeof PencilLine; titleKey: string; bodyKey: string }> = [
  { id: 'edit', icon: PencilLine, titleKey: 'recap.editTitle', bodyKey: 'recap.editBody' },
  { id: 'analyse', icon: ScanSearch, titleKey: 'recap.analyseTitle', bodyKey: 'recap.analyseBody' },
  { id: 'results', icon: ChartNoAxesColumn, titleKey: 'recap.resultsTitle', bodyKey: 'recap.resultsBody' },
  { id: 'advice', icon: Lightbulb, titleKey: 'recap.adviceTitle', bodyKey: 'recap.adviceBody' },
];

export default function Recap({
  processes,
  onChoose,
}: {
  processes: DraftProcess[];
  onChoose: (choice: RecapChoice) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const counts = classificationCounts(processes.map((p) => ({ steps: p.steps } as any)));
  const totalSteps = processes.reduce((n, p) => n + p.steps.length, 0);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="w-10 h-10 rounded-full bg-citron grid place-items-center shrink-0"
        >
          <Check size={18} className="text-ink" />
        </motion.span>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{t('recap.title')}</h2>
          <p className="text-sm text-mute mt-0.5">
            {t('recap.sub', { processes: processes.length, steps: totalSteps })}
          </p>
        </div>
      </div>

      {/* Per-process recap */}
      <div className="mt-6 space-y-3">
        {processes.map((p) => {
          const completeness = computeCompleteness({ title: p.title, description: p.summary || p.title, steps: p.steps });
          const pc = classificationCounts([{ steps: p.steps } as any]);
          return (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-base font-semibold leading-snug">{p.title || t('common.untitled')}</div>
                  <div className="text-xs text-mute mt-1">{p.subFunction || t('recap.noLine')}</div>
                </div>
                <span className="chip bg-canvas border-transparent">{p.steps.length} {t('common.steps')}</span>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="label">{t('common.completeness')}</div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1"><Meter value={completeness} /></div>
                    <span className="text-sm font-bold">{completeness}%</span>
                  </div>
                </div>
                <div>
                  <div className="label">{t('recap.workProfile')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['automation', 'agentic-ai', 'human-in-the-loop'] as const).map((cls) =>
                      pc[cls] > 0 ? (
                        <span key={cls} className={`chip border-transparent ${CLASSIFICATION_META[cls].bg} ${CLASSIFICATION_META[cls].fg}`}>
                          {pc[cls]} × {classLabel(locale, cls, true)}
                        </span>
                      ) : null,
                    )}
                    {pc.unclassified > 0 && <span className="chip">{pc.unclassified} {t('class.unclassified')}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {processes.length > 1 && (
        <div className="mt-3 text-xs text-mute text-center">
          {t('recap.across')}{' '}
          {(['automation', 'agentic-ai', 'human-in-the-loop'] as const)
            .filter((cls) => counts[cls] > 0)
            .map((cls) => `${counts[cls]} ${classLabel(locale, cls, true).toLowerCase()}`)
            .join(' · ')}
        </div>
      )}

      {/* Choice cards */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {CHOICE_KEYS.map((choice, i) => (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            onClick={() => onChoose(choice.id)}
            className={`card text-left p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-lift hover:-translate-y-0.5 ${
              choice.id === 'analyse' ? 'bg-ink border-transparent text-white' : ''
            }`}
          >
            <span
              className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${
                choice.id === 'analyse' ? 'bg-citron text-ink' : 'bg-veil-soft text-veil-deep'
              }`}
            >
              <choice.icon size={17} />
            </span>
            <span>
              <span className="font-semibold text-sm block">{t(choice.titleKey)}</span>
              <span className={`text-xs mt-0.5 block ${choice.id === 'analyse' ? 'text-white/60' : 'text-mute'}`}>{t(choice.bodyKey)}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
