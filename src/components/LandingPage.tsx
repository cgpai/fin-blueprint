import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  ChartNoAxesColumn,
  Fingerprint,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { LanguageToggle, classLabel, useLocale, useT } from '../lib/i18n';

export default function LandingPage({
  registeredProfiles,
  onLogin,
  sheetsSync = 'off',
}: {
  registeredProfiles: UserProfile[];
  onLogin: (profile: UserProfile) => void;
  sheetsSync?: 'off' | 'loading' | 'ok' | 'error';
}) {
  const t = useT();
  const { locale } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInStep, setSignInStep] = useState<'email' | 'password'>('email');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const howItWorks = [
    { icon: Fingerprint, title: t('landing.how1Title'), body: t('landing.how1Body') },
    { icon: AudioLines, title: t('landing.how2Title'), body: t('landing.how2Body') },
    { icon: ScanSearch, title: t('landing.how3Title'), body: t('landing.how3Body') },
    { icon: ChartNoAxesColumn, title: t('landing.how4Title'), body: t('landing.how4Body') },
  ];

  const capabilities = [
    { icon: BookOpen, title: t('landing.cap1Title'), body: t('landing.cap1Body') },
    { icon: Sparkles, title: t('landing.cap2Title'), body: t('landing.cap2Body') },
    { icon: LayoutDashboard, title: t('landing.cap3Title'), body: t('landing.cap3Body') },
    { icon: Lightbulb, title: t('landing.cap4Title'), body: t('landing.cap4Body') },
    { icon: UsersRound, title: t('landing.cap5Title'), body: t('landing.cap5Body') },
    { icon: MessagesSquare, title: t('landing.cap6Title'), body: t('landing.cap6Body') },
  ];

  const demoSteps = [
    { nameKey: 'landing.demo1', cls: 'automation' as const, tagClass: 'bg-citron text-ink' },
    { nameKey: 'landing.demo2', cls: 'agentic-ai' as const, tagClass: 'bg-veil text-ink' },
    { nameKey: 'landing.demo3', cls: 'human-in-the-loop' as const, tagClass: 'bg-blush text-ink' },
  ];

  const openSignIn = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setSignInStep('email');
    setSignInOpen(true);
  };

  const continueToPassword = () => {
    if (sheetsSync === 'loading') {
      setError(t('landing.errLoading'));
      return;
    }
    if (!email.trim()) {
      setError(t('landing.errNotRegistered'));
      return;
    }
    setError('');
    setSignInStep('password');
  };

  const signIn = async () => {
    if (!email.trim() || !password || checking) return;
    setChecking(true);
    setError('');
    try {
      const { loginRequest } = await import('../lib/spreadsheetDb');
      const profile = await loginRequest(email.trim().toLowerCase(), password);
      onLogin(profile);
    } catch {
      setError(t('landing.errMismatch'));
    }
    setChecking(false);
  };

  return (
    <div className="min-h-full sky-wash overflow-y-auto">
      {/* Floating pill nav */}
      <nav className="sticky top-4 z-20 mx-auto max-w-3xl px-4">
        <div className="glass rounded-full px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-semibold text-sm">
            <span className="w-7 h-7 rounded-full bg-ink text-citron grid place-items-center">
              <Sparkles size={14} />
            </span>
            Blueprint
          </div>
          <div className="hidden sm:flex items-center gap-5 text-sm font-medium text-inksoft">
            <a href="#how" className="hover:text-ink transition-colors">{t('landing.how')}</a>
            <a href="#capabilities" className="hover:text-ink transition-colors">{t('landing.capabilities')}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button onClick={openSignIn} className="btn-dark !py-2 !px-4 text-xs">
              {t('landing.signIn')}
            </button>
          </div>
        </div>
      </nav>

      {signInOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="card w-full max-w-sm p-5 shadow-lift"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">{t('landing.signInTitle')}</h2>
                <p className="text-xs text-mute mt-0.5">{t('landing.signInSub')}</p>
              </div>
              <button className="btn-ghost !p-2 !rounded-full" onClick={() => setSignInOpen(false)} aria-label={t('landing.closeSignIn')}>
                <X size={14} />
              </button>
            </div>

            {signInStep === 'email' ? (
              <div className="mt-5">
                <label className="label" htmlFor="signin-user">{t('common.username')}</label>
                <input
                  id="signin-user"
                  className="field"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder={t('landing.usernamePlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.trim().toLowerCase());
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') continueToPassword();
                  }}
                />
                {error && <div className="text-xs text-bad mt-2">{error}</div>}
                <button className="btn-dark w-full mt-4" disabled={!email.trim()} onClick={continueToPassword}>
                  {t('landing.continue')} <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="chip bg-veil-soft border-transparent text-veil-deep mb-3">{email}</div>
                <label className="label" htmlFor="signin-password">{t('common.password')}</label>
                <div className="relative">
                  <input
                    id="signin-password"
                    className="field pr-11"
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    placeholder={t('common.password')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') signIn();
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost !p-2 !rounded-full"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {error && <div className="text-xs text-bad mt-2">{error}</div>}
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => setSignInStep('email')}>
                    {t('common.back')}
                  </button>
                  <button className="btn-dark flex-1" disabled={!password || checking} onClick={signIn}>
                    {checking ? t('common.checking') : t('landing.signIn')}
                  </button>
                </div>
                <p className="mt-3 text-xs text-mute">{t('landing.forgot')}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <span className="chip bg-citron-soft border-transparent text-citron-deep mb-6 inline-flex">
            <Sparkles size={12} /> {t('landing.chip')}
          </span>
          <h1 className="font-display font-semibold tracking-tight text-5xl sm:text-6xl leading-[1.05] text-ink">
            {t('landing.hero1')}
            <br />
            <span className="text-veil-deep">{t('landing.hero2')}</span>
          </h1>
          <p className="mt-6 text-lg text-mute max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroBody')}
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <button onClick={openSignIn} className="btn-dark !px-7 !py-3.5 text-base">
              {t('landing.signIn')} <ArrowRight size={17} />
            </button>
            <a href="#how" className="btn-ghost !px-7 !py-3.5 text-base">
              {t('landing.learnMore')}
            </a>
          </div>
        </motion.div>

        {/* Hero visual: soft glass "process" preview */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 glass rounded-card p-6 sm:p-8 max-w-3xl mx-auto text-left"
        >
          <div className="text-xs font-semibold text-mute mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-citron animate-pulse" />
            {t('landing.mining')}
          </div>
          <div className="space-y-3">
            {demoSteps.map((step, i) => (
              <motion.div
                key={step.nameKey}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.18 }}
                className="bg-card rounded-2xl border border-line px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-canvas grid place-items-center text-[11px] font-bold text-mute shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{t(step.nameKey)}</span>
                </div>
                <span className={`chip border-transparent ${step.tagClass}`}>{classLabel(locale, step.cls)}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </header>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-center">{t('landing.howTitle')}</h2>
        <p className="text-mute text-center mt-2 text-sm">{t('landing.howSub')}</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08 }}
              className="card p-6"
            >
              <div className="w-10 h-10 rounded-full bg-veil-soft text-veil-deep grid place-items-center mb-4">
                <item.icon size={18} />
              </div>
              <div className="text-[11px] font-bold text-faint mb-1.5">{t('landing.step', { n: i + 1 })}</div>
              <div className="font-display font-semibold">{item.title}</div>
              <p className="text-sm text-mute mt-1.5 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="max-w-5xl mx-auto px-6 py-16">
        <div className="card bg-ink border-transparent p-8 sm:p-12 text-white">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t('landing.capTitle1')} <span className="text-citron">{t('landing.capTitle2')}</span>
          </h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
            {capabilities.map((cap) => (
              <div key={cap.title}>
                <div className="flex items-center gap-2.5 font-semibold text-sm">
                  <cap.icon size={16} className="text-citron shrink-0" />
                  {cap.title}
                </div>
                <p className="text-[13px] text-white/60 mt-1.5 leading-relaxed">{cap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="max-w-5xl mx-auto px-6 pb-20 pt-4 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">{t('landing.ready')}</h2>
        <p className="text-mute mt-2 text-sm">{t('landing.readySub')}</p>
        <button onClick={openSignIn} className="btn-citron !px-7 !py-3.5 text-base mt-6">
          {t('landing.signIn')} <ArrowRight size={17} />
        </button>
        <div className="mt-14 text-xs text-faint">{t('landing.footer')}</div>
      </footer>
    </div>
  );
}
