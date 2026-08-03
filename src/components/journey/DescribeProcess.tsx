import { ArrowLeft, Loader2, Mic, MicOff, Sparkles } from 'lucide-react';
import { SubFunction } from '../../types';
import { useSpeech } from '../../lib/useSpeech';
import { SUBFUNCTIONS_LIST } from '../../data/mockData';
import { useLocale, useT } from '../../lib/i18n';
import { AutoTextarea } from '../ui';

export default function DescribeProcess({
  title,
  setTitle,
  subFunction,
  setSubFunction,
  narrative,
  setNarrative,
  hasOutputs,
  onBack,
  onMine,
}: {
  title: string;
  setTitle: (v: string) => void;
  subFunction: SubFunction | '';
  setSubFunction: (v: SubFunction | '') => void;
  narrative: string;
  setNarrative: (v: string) => void;
  hasOutputs: boolean;
  onBack: () => void;
  onMine: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const speech = useSpeech(
    (chunk) => setNarrative(narrative ? `${narrative.trimEnd()} ${chunk}` : chunk),
    locale === 'id' ? 'id-ID' : 'en-US',
  );
  const canMine = narrative.trim().length >= 30 || hasOutputs;

  return (
    <div className="animate-fade-up">
      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{t('describe.title')}</h2>
      <p className="text-sm text-mute mt-1.5 max-w-lg">{t('describe.sub')}</p>

      <div className="mt-7 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="j-title">
            {t('describe.workingTitle')} <span className="text-faint font-normal">{t('common.optional')}</span>
          </label>
          <input
            id="j-title"
            className="field"
            placeholder={t('describe.titlePh')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="j-sf">
            {t('describe.lineOfWork')} <span className="text-faint font-normal">{t('describe.lineHint')}</span>
          </label>
          <select
            id="j-sf"
            className="field cursor-pointer"
            value={subFunction}
            onChange={(e) => setSubFunction(e.target.value as SubFunction | '')}
          >
            <option value="">{t('describe.suggest')}</option>
            {SUBFUNCTIONS_LIST.map((sf) => (
              <option key={sf} value={sf}>{sf}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 relative">
        <label className="label" htmlFor="j-narrative">{t('describe.narrative')}</label>
        <AutoTextarea
          id="j-narrative"
          className="field min-h-52 resize-y !pr-16 leading-relaxed"
          placeholder={t('describe.narrativePh')}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
        />
        {speech.supported && (
          <button
            type="button"
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
            disabled={speech.loading}
            className={`absolute right-3.5 top-9 w-11 h-11 rounded-full grid place-items-center transition-all cursor-pointer ${
              speech.loading
                ? 'bg-ink/50 text-white cursor-not-allowed'
                : speech.listening
                  ? 'bg-bad text-white animate-pulse-ring'
                  : 'bg-ink text-white hover:scale-105'
            }`}
            aria-label={speech.loading ? t('describe.micLoading') : speech.listening ? t('describe.stopDictate') : t('describe.dictate')}
            title={speech.loading ? t('describe.micLoading') : speech.listening ? t('describe.stopDictate') : t('describe.dictate')}
          >
            {speech.loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : speech.listening ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={speech.error ? 'text-bad font-medium' : 'text-faint'}>
          {speech.error
            ? speech.error
            : speech.loading
              ? t('describe.micPerm')
              : speech.listening
                ? t('describe.listening')
                : speech.supported
                  ? t('describe.micTip')
                  : t('describe.noMic')}
        </span>
        <span className="text-faint">{t('describe.chars', { n: narrative.trim().length })}</span>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button className="btn-ghost !py-2 !px-4 text-xs" onClick={onBack}>
          <ArrowLeft size={14} /> {t('common.back')}
        </button>
        <button className="btn-dark" onClick={onMine} disabled={!canMine} title={canMine ? undefined : t('describe.needMore')}>
          <Sparkles size={15} /> {t('describe.mine')}
        </button>
      </div>
    </div>
  );
}
