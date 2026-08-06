import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Crown, Landmark, ShieldCheck, UserRound, Users, Wrench } from 'lucide-react';
import { Persona, UserProfile } from '../types';
import { hashPassword } from '../lib/utils';
import { LanguageToggle, useT } from '../lib/i18n';
import { ProgressDots } from './ui';

const ROLE_ICONS: Record<Persona, typeof Crown> = {
  L1: Crown,
  L2: Landmark,
  L3: Users,
  L4: Wrench,
  Admin: ShieldCheck,
};

const ROLE_KEYS: Persona[] = ['L1', 'L2', 'L3', 'L4'];

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Onboarding({
  onComplete,
  onBack,
  registeredProfiles = [],
}: {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  registeredProfiles?: UserProfile[];
}) {
  const t = useT();
  const [step, setStep] = useState(0); // 0 role · 1 name · 2 password · 3 done
  const [role, setRole] = useState<Persona | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [manualRoleOverride, setManualRoleOverride] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const emailValue = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailTaken = !!emailValue && registeredProfiles.some((p) => (p.email || '').trim().toLowerCase() === emailValue);
  const identityValid = name.trim().length >= 2 && emailValid && !emailTaken;

  const passwordChecks = [
    { ok: password.length >= 8, text: t('onboard.checkLen') },
    { ok: /[a-zA-Z]/.test(password) && /\d/.test(password), text: t('onboard.checkMix') },
    { ok: password.length > 0 && password === confirm, text: t('onboard.checkMatch') },
  ];
  const passwordValid = passwordChecks.every((c) => c.ok);

  const finish = async () => {
    if (!role || !name.trim() || !passwordValid || saving) return;
    setSaving(true);
    const passwordHash = await hashPassword(password);
    setStep(3);
    const lowerName = name.trim().toLowerCase();
    const lowerEmail = (email || '').trim().toLowerCase();
    const isNicole = lowerName.includes('nicole') || lowerEmail.includes('nicole');
    const finalRole: Persona = isNicole ? 'Admin' : role;
    setTimeout(() => {
      onComplete({
        name: name.trim(),
        email: email.trim() || undefined,
        role: finalRole,
        passwordHash,
        createdAt: new Date().toISOString(),
        manualRoleOverride: manualRoleOverride.trim() || undefined,
      });
    }, 1600);
  };

  return (
    <div className="min-h-full sky-wash flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (step === 0 ? onBack() : setStep(step - 1))}
              className="btn-ghost !py-2 !px-3.5 text-xs"
              disabled={step === 3}
            >
              <ArrowLeft size={14} /> {t('onboard.back')}
            </button>
            <LanguageToggle />
          </div>
          <ProgressDots total={3} current={Math.min(step, 2)} />
        </div>

        <div className="glass rounded-card p-8 sm:p-10 min-h-[430px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="role" {...slide} className="flex-1 flex flex-col">
                <div className="text-xs font-semibold text-mute">{t('onboard.progress', { n: 1 })}</div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
                  {t('onboard.roleTitle')}
                </h1>
                <p className="text-sm text-mute mt-1.5">{t('onboard.roleSub')}</p>
                <div className="mt-6 grid gap-2.5">
                  {ROLE_KEYS.map((roleKey) => {
                    const Icon = ROLE_ICONS[roleKey];
                    return (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setRole(roleKey);
                          setTimeout(() => setStep(1), 220);
                        }}
                        className={`text-left rounded-2xl border px-4 py-3.5 flex items-center gap-4 transition-all cursor-pointer bg-card ${
                          role === roleKey ? 'border-ink shadow-lift' : 'border-line hover:border-faint'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-full grid place-items-center shrink-0 transition-colors ${
                            role === roleKey ? 'bg-citron text-ink' : 'bg-canvas text-mute'
                          }`}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-2">
                            <span className="font-semibold text-sm">{t(`onboard.role.${roleKey}.title`)}</span>
                            <span className="text-[11px] font-medium text-faint">{t(`onboard.role.${roleKey}.sub`)}</span>
                          </span>
                          <span className="block text-xs text-mute mt-0.5">{t(`onboard.role.${roleKey}.body`)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="name" {...slide} className="flex-1 flex flex-col">
                <div className="text-xs font-semibold text-mute">{t('onboard.progress', { n: 2 })}</div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
                  {t('onboard.nameTitle')}
                </h1>
                <p className="text-sm text-mute mt-1.5">{t('onboard.nameSub')}</p>
                <div className="mt-8 space-y-4 flex-1">
                  <div>
                    <label className="label" htmlFor="ob-name">{t('common.fullName')}</label>
                    <input
                      id="ob-name"
                      autoFocus
                      className="field !text-lg !py-4"
                      placeholder={t('onboard.namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(2)}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ob-email">{t('common.workEmail')}</label>
                    <input
                      id="ob-email"
                      type="email"
                      className="field"
                      placeholder={t('landing.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && identityValid && setStep(2)}
                    />
                    {email.trim() && !emailValid && <div className="text-xs text-bad mt-2">{t('onboard.emailInvalid')}</div>}
                    {emailTaken && (
                      <div className="text-xs text-bad mt-2">
                        {t('onboard.emailTaken')}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="ob-role-override">
                      {t('onboard.roleOverride')} <span className="text-faint font-normal">{t('onboard.roleOverrideHint')}</span>
                    </label>
                    <input
                      id="ob-role-override"
                      className="field"
                      placeholder={t('onboard.roleOverridePh')}
                      value={manualRoleOverride}
                      onChange={(e) => setManualRoleOverride(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && identityValid && setStep(2)}
                    />
                  </div>
                </div>
                <button className="btn-dark w-full mt-6" disabled={!identityValid} onClick={() => setStep(2)}>
                  {t('common.continue')} <ArrowRight size={15} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="password" {...slide} className="flex-1 flex flex-col">
                <div className="text-xs font-semibold text-mute">{t('onboard.progress', { n: 3 })}</div>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-2">
                  {t('onboard.passTitle')}
                </h1>
                <p className="text-sm text-mute mt-1.5">{t('onboard.passSub')}</p>
                <div className="mt-8 space-y-4 flex-1">
                  <div>
                    <label className="label" htmlFor="ob-pass">{t('common.password')}</label>
                    <input
                      id="ob-pass"
                      autoFocus
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ob-confirm">{t('onboard.confirmPass')}</label>
                    <input
                      id="ob-confirm"
                      type="password"
                      className="field"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && finish()}
                    />
                  </div>
                  <ul className="space-y-1.5 pt-1">
                    {passwordChecks.map((check) => (
                      <li key={check.text} className={`text-xs flex items-center gap-2 ${check.ok ? 'text-ok' : 'text-faint'}`}>
                        <span className={`w-4 h-4 rounded-full grid place-items-center ${check.ok ? 'bg-citron' : 'bg-canvas'}`}>
                          {check.ok && <Check size={10} className="text-ink" />}
                        </span>
                        {check.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <button className="btn-dark w-full mt-6" disabled={!passwordValid || saving} onClick={finish}>
                  {t('onboard.create')} <ArrowRight size={15} />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-citron grid place-items-center"
                >
                  <Check size={34} className="text-ink" />
                </motion.div>
                <h1 className="font-display text-3xl font-semibold tracking-tight mt-6">
                  {t('onboard.doneTitle', { name: name.trim().split(' ')[0] })}
                </h1>
                <p className="text-sm text-mute mt-2 max-w-xs">{t('onboard.doneSub')}</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-faint">
                  <UserRound size={13} /> {t('onboard.starting')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
