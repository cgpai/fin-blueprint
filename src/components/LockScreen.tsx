import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, RotateCcw, X } from 'lucide-react';
import { UserProfile } from '../types';
import { hashPassword } from '../lib/utils';
import { Avatar } from './ui';

export default function LockScreen({
  profile,
  onUnlock,
  onStartOver,
}: {
  profile: UserProfile;
  onUnlock: () => void;
  onStartOver: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const attempt = async () => {
    if (!password || checking) return;
    setChecking(true);
    const hash = await hashPassword(password);
    if (hash === profile.passwordHash) {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      setChecking(false);
    }
  };

  return (
    <div className="min-h-full sky-wash flex items-center justify-center px-4">
      {confirmReset && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="card w-full max-w-sm p-5 shadow-lift text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Start over?</h2>
                <p className="text-xs text-mute mt-1.5 leading-relaxed">
                  This clears the local profile on this browser. Documented processes remain in the spreadsheet.
                </p>
              </div>
              <button className="btn-ghost !p-2 !rounded-full" onClick={() => setConfirmReset(false)} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button className="btn-dark flex-1" onClick={onStartOver}>
                <RotateCcw size={14} /> Start over
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-card p-10 w-full max-w-sm text-center"
      >
        <div className="flex justify-center">
          <Avatar name={profile.name} size={64} />
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight mt-4">Welcome back, {profile.name.split(' ')[0]}</h1>
        <p className="text-xs text-mute mt-1.5 flex items-center justify-center gap-1.5">
          <LockKeyhole size={12} /> Enter your password to re-open your catalogue
        </p>

        <motion.div
          animate={error ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mt-7"
        >
          <div className="relative">
            <input
              autoFocus
              type={showPassword ? 'text' : 'password'}
              className="field text-center pr-11"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && attempt()}
              aria-label="Password"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost !p-2 !rounded-full"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <div className="text-xs text-bad mt-2">That password didn&rsquo;t match — try again.</div>}
        </motion.div>

        <button className="btn-dark w-full mt-4" onClick={attempt} disabled={!password || checking}>
          Unlock <ArrowRight size={15} />
        </button>

        <button
          onClick={() => setConfirmReset(true)}
          className="text-xs text-faint hover:text-mute mt-6 transition-colors cursor-pointer"
        >
          Not you? Start over
        </button>
      </motion.div>
    </div>
  );
}
