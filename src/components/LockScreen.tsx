import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { UserProfile } from '../types';
import { LanguageToggle, useT } from '../lib/i18n';
import { Avatar } from './ui';

export default function LockScreen({
  profile,
  onUnlock,
  onStartOver,
}: {
  profile: UserProfile;
  onUnlock: (updatedProfile?: UserProfile) => void;
  onStartOver: () => void;
}) {
  const t = useT();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const attempt = async () => {
    if (!password || checking) return;
    setChecking(true);
    try {
      const { loginRequest } = await import('../lib/spreadsheetDb');
      const loginKey = (profile.email || profile.name.replace(/\s+/g, '')).trim().toLowerCase();
      const updated = await loginRequest(loginKey, password);
      onUnlock(updated);
    } catch {
      setError(true);
      setPassword('');
      setChecking(false);
    }
  };

  return (
    <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4">
      <LanguageToggle className="mb-4" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-card p-10 w-full max-w-sm text-center"
      >
        <div className="flex justify-center">
          <Avatar name={profile.name} size={64} />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight mt-4">
          {t('lock.welcome', { name: profile.name.split(' ')[0] })}
        </h1>
        <p className="text-xs text-mute mt-1.5 flex items-center justify-center gap-1.5">
          <LockKeyhole size={12} /> {t('lock.sub')}
        </p>

        <motion.div
          animate={error ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mt-7"
        >
          <input
            autoFocus
            type="password"
            className="field text-center"
            placeholder={t('common.password')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            aria-label={t('common.password')}
          />
          {error && <div className="text-xs text-bad mt-2">{t('lock.badPassword')}</div>}
        </motion.div>

        <button className="btn-dark w-full mt-4" onClick={attempt} disabled={!password || checking}>
          {t('lock.unlock')} <ArrowRight size={15} />
        </button>

        <button
          onClick={() => {
            if (confirm(t('lock.confirmReset'))) {
              onStartOver();
            }
          }}
          className="text-xs text-faint hover:text-mute mt-6 transition-colors cursor-pointer"
        >
          {t('lock.notYou')}
        </button>
      </motion.div>
    </div>
  );
}
