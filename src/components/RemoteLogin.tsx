import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Copy } from 'lucide-react';
import { bootstrapAdmin, remoteLogin, remoteRegister, RemoteUser } from '../lib/blueprintApi';
import { SUBFUNCTIONS_LIST } from '../data/mockData';
import { LanguageToggle, useT } from '../lib/i18n';

type Mode = 'login' | 'register' | 'bootstrap' | 'bootstrap-result';

export default function RemoteLogin({
  onSignedIn,
}: {
  onSignedIn: (token: string, user: RemoteUser) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('L4');
  const [subFunction, setSubFunction] = useState<string>(SUBFUNCTIONS_LIST[0] || 'All');
  const [createdCreds, setCreatedCreds] = useState<{ username: string; tempPassword: string } | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const attemptLogin = async () => {
    if (!username || !password || checking) return;
    setChecking(true);
    setError('');
    try {
      const { token, user } = await remoteLogin(username.trim(), password);
      onSignedIn(token, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setChecking(false);
    }
  };

  const attemptRegister = async () => {
    if (!name || !email || !password || checking) return;
    setChecking(true);
    setError('');
    try {
      const { token, user } = await remoteRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        level,
        subFunction,
      });
      onSignedIn(token, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setChecking(false);
    }
  };

  const attemptBootstrap = async () => {
    if (!name || !email || checking) return;
    setChecking(true);
    setError('');
    try {
      const creds = await bootstrapAdmin(name.trim(), email.trim());
      setCreatedCreds(creds);
      setMode('bootstrap-result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the Admin account.');
    } finally {
      setChecking(false);
    }
  };

  if (mode === 'bootstrap-result' && createdCreds) {
    return (
      <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4">
        <LanguageToggle className="mb-4" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-card p-10 w-full max-w-sm text-center"
        >
          <div className="flex justify-center">
            <span className="w-14 h-14 rounded-full bg-citron grid place-items-center">
              <ShieldCheck size={22} className="text-ink" />
            </span>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight mt-4">{t('remote.adminCreated')}</h1>
          <p className="text-xs text-mute mt-1.5">{t('remote.copyNow')}</p>

          <div className="mt-6 space-y-2 text-left">
            <div className="rounded-lg border border-line bg-white/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-mute">{t('common.username')}</div>
              <div className="font-mono text-sm">{createdCreds.username}</div>
            </div>
            <div className="rounded-lg border border-line bg-white/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-mute">{t('remote.tempPassword')}</div>
              <div className="font-mono text-sm">{createdCreds.tempPassword}</div>
            </div>
          </div>

          <button
            className="btn-dark w-full mt-6"
            onClick={() => {
              setUsername(createdCreds.username);
              setPassword('');
              setMode('login');
            }}
          >
            <Copy size={15} /> {t('remote.continueSignIn')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'bootstrap') {
    return (
      <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4">
        <LanguageToggle className="mb-4" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-card p-10 w-full max-w-sm text-center"
        >
          <div className="flex justify-center">
            <span className="w-14 h-14 rounded-full bg-citron grid place-items-center">
              <ShieldCheck size={22} className="text-ink" />
            </span>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight mt-4">{t('remote.bootstrapTitle')}</h1>
          <p className="text-xs text-mute mt-1.5">{t('remote.bootstrapSub')}</p>

          <motion.div
            animate={error ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mt-7 space-y-3"
          >
            <input
              autoFocus
              className="field text-center"
              placeholder={t('remote.placeholderName')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              aria-label={t('common.fullName')}
            />
            <input
              className="field text-center"
              placeholder={t('remote.placeholderEmail')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && attemptBootstrap()}
              aria-label={t('common.workEmail')}
            />
            {error && <div className="text-xs text-bad">{error}</div>}
          </motion.div>

          <button className="btn-dark w-full mt-5" onClick={attemptBootstrap} disabled={!name || !email || checking}>
            {checking ? t('common.creating') : t('remote.createAdmin')} <ArrowRight size={15} />
          </button>
          <button className="text-xs text-mute mt-4 underline" onClick={() => { setMode('login'); setError(''); }}>
            {t('remote.backSignIn')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4">
        <LanguageToggle className="mb-4" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-card p-10 w-full max-w-sm text-center"
        >
          <div className="flex justify-center">
            <span className="w-14 h-14 rounded-full bg-citron grid place-items-center">
              <ShieldCheck size={22} className="text-ink" />
            </span>
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight mt-4">{t('remote.registerTitle')}</h1>
          <p className="text-xs text-mute mt-1.5">{t('remote.registerSub')}</p>

          <motion.div
            animate={error ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mt-7 space-y-3 text-left"
          >
            <input
              autoFocus
              className="field"
              placeholder={t('common.fullName')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              aria-label={t('common.fullName')}
            />
            <input
              className="field"
              type="email"
              placeholder={t('common.workEmail')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              aria-label={t('common.workEmail')}
            />
            <input
              className="field"
              type="password"
              placeholder={t('remote.placeholderPass')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && attemptRegister()}
              aria-label={t('common.password')}
            />
            <select className="field cursor-pointer" value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t('remote.roleLevel')}>
              {(['L4', 'L3', 'L2', 'L1'] as const).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select className="field cursor-pointer" value={subFunction} onChange={(e) => setSubFunction(e.target.value)} aria-label={t('remote.lineOfWork')}>
              {SUBFUNCTIONS_LIST.map((sf) => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
            {error && <div className="text-xs text-bad text-center">{error}</div>}
          </motion.div>

          <button
            className="btn-dark w-full mt-5"
            onClick={attemptRegister}
            disabled={!name || !email || password.length < 8 || checking}
          >
            {checking ? t('common.creating') : t('remote.registerCta')} <ArrowRight size={15} />
          </button>
          <button className="text-xs text-mute mt-4 underline" onClick={() => { setMode('login'); setError(''); }}>
            {t('remote.haveAccount')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4">
      <LanguageToggle className="mb-4" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-card p-10 w-full max-w-sm text-center"
      >
        <div className="flex justify-center">
          <span className="w-14 h-14 rounded-full bg-citron grid place-items-center">
            <ShieldCheck size={22} className="text-ink" />
          </span>
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight mt-4">Blueprint</h1>
        <p className="text-xs text-mute mt-1.5">{t('remote.signInSub')}</p>

        <motion.div
          animate={error ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mt-7 space-y-3"
        >
          <input
            autoFocus
            className="field text-center"
            placeholder={t('common.username')}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
            aria-label={t('common.username')}
          />
          <input
            type="password"
            className="field text-center"
            placeholder={t('common.password')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
            aria-label={t('common.password')}
          />
          {error && <div className="text-xs text-bad">{error}</div>}
        </motion.div>

        <button className="btn-dark w-full mt-5" onClick={attemptLogin} disabled={!username || !password || checking}>
          {checking ? t('common.signingIn') : t('landing.signIn')} <ArrowRight size={15} />
        </button>
        <button className="text-xs text-mute mt-4 underline block w-full" onClick={() => { setMode('register'); setError(''); setPassword(''); }}>
          {t('remote.newHere')}
        </button>
        <button className="text-xs text-faint mt-2 underline" onClick={() => { setMode('bootstrap'); setError(''); }}>
          {t('remote.firstSetup')}
        </button>
      </motion.div>
    </div>
  );
}
