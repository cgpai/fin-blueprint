import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { enExtra1, idExtra1 } from './i18n-extra-part1';
import { enExtra2, idExtra2 } from './i18n-extra-part2';
import { enExtra3, idExtra3 } from './i18n-extra-part3';
import { enExtra4, idExtra4 } from './i18n-extra-part4';

export type Locale = 'en' | 'id';

const STORAGE_KEY = 'bp_lang';

type Dict = Record<string, string>;

const en: Dict = {
  'lang.en': 'EN',
  'lang.id': 'ID',
  'lang.switch': 'Language',

  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.close': 'Close',
  'common.reset': 'Reset',
  'common.ok': 'ok',
  'common.tryAgain': 'Try again',
  'common.optional': '(optional)',
  'common.password': 'Password',
  'common.email': 'Email',
  'common.username': 'Username',
  'common.fullName': 'Full name',
  'common.workEmail': 'Work email',
  'common.checking': 'Checking...',
  'common.signingIn': 'Signing in…',
  'common.creating': 'Creating…',
  'common.hidePassword': 'Hide password',
  'common.showPassword': 'Show password',
  'common.steps': 'steps',
  'common.untitled': 'Untitled process',
  'common.completeness': 'Completeness',

  'greeting.late': 'Working late',
  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',

  'class.agentic': 'Agentic AI',
  'class.agenticShort': 'Agentic',
  'class.automation': 'Automation',
  'class.automationShort': 'Auto',
  'class.human': 'Human-in-the-loop',
  'class.humanShort': 'Human',
  'class.unclassified': 'unclassified',

  'time.justNow': 'just now',
  'time.mAgo': '{n}m ago',
  'time.hAgo': '{n}h ago',
  'time.dAgo': '{n}d ago',

  'nav.dashboard': 'Dashboard',
  'nav.dashboardShort': 'Dashboard',
  'nav.catalogue': 'Catalogue',
  'nav.catalogueShort': 'Catalogue',
  'nav.prdHub': 'Consolidated PRD Hub',
  'nav.prdHubShort': 'PRD Hub',
  'nav.capture': 'Capture a process',
  'nav.captureShort': 'Capture',
  'nav.refinement': 'AI Refinement',
  'nav.refinementShort': 'AI Refine',
  'nav.projects': 'Project Management',
  'nav.projectsShort': 'Projects',
  'nav.admin': 'Programme admin',
  'nav.adminShort': 'Admin',
  'nav.lock': 'Lock your space',
  'nav.viewAs': 'VIEW AS',
  'nav.viewAsRole': 'View as {role} ({level})',
  'nav.demoPersona': 'Demo: view the app as another role',
  'nav.brandCatalogue': 'Blueprint — go to the process catalogue',
  'persona.L1': 'CFO',
  'persona.L2': 'GM / Head',
  'persona.L3': 'Manager',
  'persona.L4': 'Executor',
  'persona.Admin': 'Admin',

  'landing.how': 'How it works',
  'landing.capabilities': 'Capabilities',
  'landing.signUp': 'Sign up',
  'landing.signIn': 'Sign in',
  'landing.signInTitle': 'Sign in',
  'landing.signInSub': 'Use the username and password from your programme admin.',
  'landing.closeSignIn': 'Close sign in',
  'landing.continue': 'Continue',
  'landing.forgot': 'Forgot password? Ask your programme admin to reset your account.',
  'landing.chip': 'Native-AI transformation · Project Vanguard',
  'landing.hero1': 'Map how you really work.',
  'landing.hero2': "Let AI find what's next.",
  'landing.heroBody':
    'Blueprint turns the way you work — spoken, typed, or uploaded — into a structured process catalogue, then shows where agentic AI, automation, or a human touch fits best.',
  'landing.startJourney': 'Start your journey',
  'landing.learnMore': 'Learn more',
  'landing.mining': 'Understanding agent · mining your narrative',
  'landing.demo1': 'Retrieve patient billing records',
  'landing.demo2': 'Verify tariffs against INA-CBG rules',
  'landing.demo3': 'Manager sign-off on exceptions',
  'landing.howTitle': 'Four steps, no training needed',
  'landing.howSub': 'From "this is how I work" to a transformation-ready catalogue.',
  'landing.step': 'STEP {n}',
  'landing.how1Title': 'Sign in with your issued account',
  'landing.how1Body': 'Your programme admin creates a username and temporary password — there is no self-signup.',
  'landing.how2Title': 'Capture your process',
  'landing.how2Body': 'Upload working outputs, type, or just talk — describe how you actually work.',
  'landing.how3Title': 'AI mines & refines',
  'landing.how3Body': 'The understanding agent counts, expands and classifies every step for you.',
  'landing.how4Title': "See what's next",
  'landing.how4Body': 'Dashboards, a living catalogue, and concrete improvement advice per workflow.',
  'landing.capTitle1': 'Everything the directorate needs,',
  'landing.capTitle2': 'in one place',
  'landing.cap1Title': 'Living process catalogue',
  'landing.cap1Body': 'Every documented workflow in one structured, searchable place.',
  'landing.cap2Title': 'AI refinement & classification',
  'landing.cap2Body': 'Steps labelled agentic-AI, automation, or human-in-the-loop — with the reasoning shown.',
  'landing.cap3Title': 'Role-scoped dashboards',
  'landing.cap3Body': 'Directorate views for the CFO, subfunction maps for leads, completion tracking for managers.',
  'landing.cap4Title': 'Improvement advice',
  'landing.cap4Body': 'High-effort workflows flagged with recommended solutions and tracked outcomes.',
  'landing.cap5Title': 'Collaboration built-in',
  'landing.cap5Body': 'Tag teammates on shared tasks so nothing is double-recorded.',
  'landing.cap6Title': 'Targeted notifications',
  'landing.cap6Body': 'Reach people by level or line-of-work when detail is missing.',
  'landing.ready': 'Ready when you are.',
  'landing.readySub': 'Accounts are issued by your programme admin — sign in with your username and password.',
  'landing.startNow': 'Sign in',
  'landing.footer': 'Blueprint · Finance Process Catalogue · Project Vanguard',
  'landing.errLoading': 'User list is still loading. Try again in a moment.',
  'landing.errSync': 'Could not reach the shared user directory. Check your connection and try again.',
  'landing.errNotRegistered': 'Username not found. Ask your programme admin for access.',
  'landing.errMismatch': 'Wrong username or password.',

  'lock.welcome': 'Welcome back, {name}',
  'lock.sub': 'Enter your password to re-open your catalogue',
  'lock.unlock': 'Unlock',
  'lock.badPassword': "That password didn't match — try again.",
  'lock.notYou': 'Not you? Start over',
  'lock.confirmReset': 'Start over? This clears your local profile (your documented processes stay).',

  'remote.signInSub': 'Sign in with your programme username and password.',
  'remote.newHere': 'New here? Create an account',
  'remote.firstSetup': 'First time programme setup? Create the Admin account',
  'remote.registerTitle': 'Create your account',
  'remote.registerSub': 'Register with your work email — saved to the programme database.',
  'remote.registerCta': 'Register & sign in',
  'remote.haveAccount': 'Already have an account? Sign in',
  'remote.bootstrapTitle': 'Set up the Admin account',
  'remote.bootstrapSub': 'This only works once, before any account exists. Staff should use Register afterwards.',
  'remote.createAdmin': 'Create Admin account',
  'remote.backSignIn': 'Back to sign in',
  'remote.adminCreated': 'Admin account created',
  'remote.copyNow': "Copy these now — the temporary password won't be shown again.",
  'remote.tempPassword': 'Temporary password',
  'remote.continueSignIn': 'Continue to sign in',
  'remote.placeholderName': 'Your full name',
  'remote.placeholderEmail': 'Your work email',
  'remote.placeholderPass': 'Password (min 8 characters)',
  'remote.roleLevel': 'Role level',
  'remote.lineOfWork': 'Line of work',

  'onboard.back': 'Back',
  'onboard.progress': 'Understanding you · {n} of 3',
  'onboard.roleTitle': "What's your role?",
  'onboard.roleSub': "This decides which views and dashboards you'll get.",
  'onboard.role.L1.title': 'CFO',
  'onboard.role.L1.sub': 'L1 · Directorate leader',
  'onboard.role.L1.body': 'Full-directorate visibility, strategy and native-AI adoption.',
  'onboard.role.L2.title': 'GM / Head / Advisor',
  'onboard.role.L2.sub': 'L2 · Subfunction leader',
  'onboard.role.L2.body': 'Plans the transformation for one subfunction.',
  'onboard.role.L3.title': 'Controller / Dept. head',
  'onboard.role.L3.sub': 'L3 · Unit manager',
  'onboard.role.L3.body': 'Manages people and tracks documentation completion.',
  'onboard.role.L4.title': 'Executive / Coordinator',
  'onboard.role.L4.sub': 'L4 · Process executor',
  'onboard.role.L4.body': 'Documents day-to-day working processes in detail.',
  'onboard.role.Admin.title': 'Programme admin',
  'onboard.role.Admin.sub': 'Project Vanguard lead',
  'onboard.role.Admin.body': 'Runs the programme: data quality, hackathon list, next stage.',
  'onboard.nameTitle': "What's your name?",
  'onboard.nameSub': 'So we can greet you properly and attribute your catalogue.',
  'onboard.namePlaceholder': 'e.g. Budi Santoso',
  'onboard.emailInvalid': 'Enter a valid work email.',
  'onboard.emailTaken': 'Email already registered. Please sign in instead.',
  'onboard.roleOverride': 'Manual Role Override',
  'onboard.roleOverrideHint': '(optional — completely bypasses system-assigned role)',
  'onboard.roleOverridePh': 'e.g. Senior Finance Manager, CFO Consultant',
  'onboard.passTitle': 'Set a password',
  'onboard.passSub': 'Your catalogue stays on this device — the password makes sure only you can re-open it later.',
  'onboard.confirmPass': 'Confirm password',
  'onboard.checkLen': 'At least 8 characters',
  'onboard.checkMix': 'Mixes letters and numbers',
  'onboard.checkMatch': 'Both entries match',
  'onboard.create': 'Create my space',
  'onboard.doneTitle': "You're set, {name}!",
  'onboard.doneSub': "Let's capture your first working process — the understanding agent is ready.",
  'onboard.starting': 'Starting your journey…',

  'ws.tagline': "Let's make the way you work visible.",
  'ws.processesDoc': 'Processes documented',
  'ws.yours': '{n} yours',
  'ws.yoursLabel': 'yours',
  'ws.avgCompleteness': 'Avg. completeness',
  'ws.capture': 'Capture process',
  'ws.transfer': 'Transfer Data',
  'ws.transferTitle': 'Transfer local data (Import/Export)',
  'ws.viewAs': 'View As',
  'ws.logOut': 'Log out',
  'ws.language': 'Language',

  'journey.stage.upload': 'Outputs',
  'journey.stage.describe': 'Describe',
  'journey.stage.interview': 'Interview',
  'journey.stage.mining': 'Mine',
  'journey.stage.review': 'Review',
  'journey.stage.recap': 'Confirm',
  'journey.skip': 'Skip for now →',
  'journey.resumed': 'Resumed your unfinished draft — nothing was lost.',
  'journey.miningTitle': 'Understanding agent at work',
  'journey.miningFailTitle': "That didn't go through",
  'journey.miningError':
    'The understanding agent could not reach the server. Check that the dev server is running, then try again.',
  'journey.mine1': 'Reading your description…',
  'journey.mine2': 'Separating the distinct processes…',
  'journey.mine3': 'Counting the steps in each one…',
  'journey.mine4': 'Expanding triggers, actions and results…',
  'journey.mine5': 'Detecting the systems you touch…',
  'journey.mine6': 'Classifying each step for the AI transformation…',

  'upload.title': 'Upload your working outputs',
  'upload.sub':
    'Reports, checklists, handover notes, exported logs — anything you produce while working. The understanding agent reads them to reconstruct your process. This step is optional.',
  'upload.drop': 'Drop your files here',
  'upload.formats': 'Plain text works best — {formats} up to 1 MB each',
  'upload.aria': 'Upload working output files',
  'upload.paste': 'Paste text instead',
  'upload.pastePh': 'Paste an excerpt of a report, checklist or handover note…',
  'upload.addPaste': 'Add to working outputs',
  'upload.pastedName': 'Pasted notes {n}',
  'upload.rejected': 'Skipped "{name}" — only small plain-text formats can be mined here.',
  'upload.skip': 'Nothing to upload — skip',
  'upload.next': 'Continue',
  'upload.nextWith': 'Continue with {n} document(s)',

  'describe.title': 'Describe how you work',
  'describe.sub':
    "In your own words — type it or just talk. Don't worry about structure; counting, classifying and expanding the steps is the agent's job.",
  'describe.workingTitle': 'Give it a working title',
  'describe.titlePh': 'e.g. Monthly VAT filing',
  'describe.lineOfWork': 'Line of work',
  'describe.lineHint': '(optional — AI can suggest)',
  'describe.suggest': 'Let the agent suggest…',
  'describe.narrative': 'Your process, in your own words',
  'describe.narrativePh':
    'e.g. "Every morning I download the discharged patient billings from KAIROS, check the tariff codes against the BPJS rules, then upload the verified claims to the BPJS e-Claim portal…"',
  'describe.dictate': 'Dictate with your voice',
  'describe.stopDictate': 'Stop dictating',
  'describe.micLoading': 'Requesting microphone...',
  'describe.micPerm': 'Requesting microphone permission...',
  'describe.listening': 'Listening… speak naturally, pause anytime.',
  'describe.micTip': 'Tip: tap the mic and narrate your day — the transcript lands here.',
  'describe.noMic': "Voice input isn't supported in this browser — typing works just as well.",
  'describe.mine': 'Let the agent do its work',
  'describe.needMore': 'Describe your process (or upload outputs) first',
  'describe.chars': '{n} chars',

  'recap.title': 'Captured & saved',
  'recap.sub': '{processes} process(es) · {steps} step(s) — what would you like to do next?',
  'recap.noLine': 'Line of work not set',
  'recap.workProfile': 'Work profile',
  'recap.across': 'Across all processes:',
  'recap.editTitle': 'Edit them',
  'recap.editBody': 'Go back and adjust processes, steps or details.',
  'recap.analyseTitle': 'Analyse them',
  'recap.analyseBody': 'Run the full AI refinement & classification.',
  'recap.resultsTitle': 'See the results',
  'recap.resultsBody': 'Open your dashboard and catalogue.',
  'recap.adviceTitle': 'Get improvement advice',
  'recap.adviceBody': 'Where automation or agentic AI helps most.',

  'dash.cfo.L1': 'Directorate overview',
  'dash.cfo.L2': 'Subfunction overview',
  'dash.cfo.refreshed': 'Last refreshed {time}',
  'dash.cfo.statProcesses': 'Processes documented',
  'dash.cfo.statProcessesHint': 'across 7 functions',
  'dash.cfo.statComplete': 'Avg. completeness',
  'dash.cfo.statCompleteHint': 'of required detail captured',
  'dash.cfo.statAuto': 'Automation candidates',
  'dash.cfo.statAutoHint': 'suitability ≥ 70',
  'dash.cfo.statImp': 'Improvements resolved',
  'dash.cfo.statImpHint': 'tracked initiatives',
  'dash.cfo.coverage': 'Documentation coverage by line of work',
  'dash.cfo.coverageSub': 'Documented processes per subfunction',
  'dash.cfo.mix': 'AI transformation mix',
  'dash.cfo.mixSub': 'Step classifications across the catalogue',
  'dash.cfo.champions': 'Documentation champions',
  'dash.cfo.riceSummary': 'RICE Score summary',
  'dash.cfo.riceFormula': '(Reach × Impact × Confidence) ÷ Effort — locked projects ranked by priority',
  'dash.cfo.riceEmpty': 'No projects scored with RICE inputs yet.',
  'dash.cfo.recent': 'Recently updated',
  'dash.cfo.plan': 'Transformation plan',
  'dash.mgr.title': 'Team space',
  'dash.mgr.completion': 'Team completion',
  'dash.mgr.completionHint': 'of personnel fully documented',
  'dash.mgr.highEffort': 'High-effort workflows',
  'dash.mgr.highEffortHint': 'flagged for improvement',
  'dash.mgr.guidance': 'Guidance items',
  'dash.mgr.guidanceHint': 'open vs resolved tracked below',
  'dash.mgr.tracker': 'Personnel documentation tracker',
  'dash.mgr.emptyRoster': 'No process owners yet — roster fills as staff capture processes.',
  'dash.mgr.noEmail': 'No email',
  'dash.mgr.complete': 'Complete',
  'dash.mgr.inProgress': 'In progress',
  'dash.mgr.notStarted': 'Not started',
  'dash.mgr.remind': 'Remind',
  'dash.mgr.reminded': 'Reminded',
  'dash.mgr.highTitle': 'High-effort / high-automation workflows',
  'dash.mgr.track': 'Track improvement',
  'dash.mgr.tracked': 'Tracked',
  'dash.mgr.board': 'Improvement guidance board',
};

const id: Dict = {
  'lang.en': 'EN',
  'lang.id': 'ID',
  'lang.switch': 'Bahasa',

  'common.back': 'Kembali',
  'common.continue': 'Lanjut',
  'common.close': 'Tutup',
  'common.reset': 'Reset',
  'common.ok': 'oke',
  'common.tryAgain': 'Coba lagi',
  'common.optional': '(opsional)',
  'common.password': 'Kata sandi',
  'common.email': 'Email',
  'common.username': 'Nama pengguna',
  'common.fullName': 'Nama lengkap',
  'common.workEmail': 'Email kantor',
  'common.checking': 'Memeriksa...',
  'common.signingIn': 'Masuk…',
  'common.creating': 'Membuat…',
  'common.hidePassword': 'Sembunyikan kata sandi',
  'common.showPassword': 'Tampilkan kata sandi',
  'common.steps': 'langkah',
  'common.untitled': 'Proses tanpa judul',
  'common.completeness': 'Kelengkapan',

  'greeting.late': 'Masih begadang',
  'greeting.morning': 'Selamat pagi',
  'greeting.afternoon': 'Selamat siang',
  'greeting.evening': 'Selamat malam',

  'class.agentic': 'AI Agen',
  'class.agenticShort': 'Agen',
  'class.automation': 'Otomasi',
  'class.automationShort': 'Otomatis',
  'class.human': 'Manusia di loop',
  'class.humanShort': 'Manusia',
  'class.unclassified': 'belum diklasifikasi',

  'time.justNow': 'baru saja',
  'time.mAgo': '{n} mnt lalu',
  'time.hAgo': '{n} jam lalu',
  'time.dAgo': '{n} hr lalu',

  'nav.dashboard': 'Dasbor',
  'nav.dashboardShort': 'Dasbor',
  'nav.catalogue': 'Katalog',
  'nav.catalogueShort': 'Katalog',
  'nav.prdHub': 'Hub PRD Terkonsolidasi',
  'nav.prdHubShort': 'Hub PRD',
  'nav.capture': 'Catat proses',
  'nav.captureShort': 'Catat',
  'nav.refinement': 'Pemurnian AI',
  'nav.refinementShort': 'AI',
  'nav.projects': 'Manajemen Proyek',
  'nav.projectsShort': 'Proyek',
  'nav.admin': 'Admin program',
  'nav.adminShort': 'Admin',
  'nav.lock': 'Kunci ruang Anda',
  'nav.viewAs': 'LIHAT SBG',
  'nav.viewAsRole': 'Lihat sebagai {role} ({level})',
  'nav.demoPersona': 'Demo: lihat aplikasi sebagai peran lain',
  'nav.brandCatalogue': 'Blueprint — buka katalog proses',
  'persona.L1': 'CFO',
  'persona.L2': 'GM / Kepala',
  'persona.L3': 'Manajer',
  'persona.L4': 'Pelaksana',
  'persona.Admin': 'Admin',

  'landing.how': 'Cara kerja',
  'landing.capabilities': 'Kemampuan',
  'landing.signUp': 'Daftar',
  'landing.signIn': 'Masuk',
  'landing.signInTitle': 'Masuk',
  'landing.signInSub': 'Pakai username dan kata sandi dari admin program.',
  'landing.closeSignIn': 'Tutup masuk',
  'landing.continue': 'Lanjut',
  'landing.forgot': 'Lupa kata sandi? Minta admin program untuk mereset akun Anda.',
  'landing.chip': 'Transformasi Native-AI · Project Vanguard',
  'landing.hero1': 'Petakan cara Anda benar-benar bekerja.',
  'landing.hero2': 'Biarkan AI menemukan langkah selanjutnya.',
  'landing.heroBody':
    'Blueprint mengubah cara Anda bekerja — diucapkan, diketik, atau diunggah — menjadi katalog proses terstruktur, lalu menunjukkan di mana AI agen, otomasi, atau sentuhan manusia paling cocok.',
  'landing.startJourney': 'Masuk',
  'landing.learnMore': 'Pelajari lebih lanjut',
  'landing.mining': 'Agen pemahaman · menambang narasi Anda',
  'landing.demo1': 'Ambil catatan penagihan pasien',
  'landing.demo2': 'Verifikasi tarif terhadap aturan INA-CBG',
  'landing.demo3': 'Persetujuan manajer untuk pengecualian',
  'landing.howTitle': 'Empat langkah, tanpa pelatihan',
  'landing.howSub': 'Dari "begini cara saya bekerja" ke katalog siap transformasi.',
  'landing.step': 'LANGKAH {n}',
  'landing.how1Title': 'Masuk dengan akun yang disediakan',
  'landing.how1Body': 'Admin membuat username dan kata sandi sementara untuk Anda — tidak ada pendaftaran mandiri.',
  'landing.how2Title': 'Catat proses Anda',
  'landing.how2Body': 'Unggah output kerja, ketik, atau bicara — jelaskan cara Anda benar-benar bekerja.',
  'landing.how3Title': 'AI menambang & memurnikan',
  'landing.how3Body': 'Agen pemahaman menghitung, memperluas, dan mengklasifikasi setiap langkah untuk Anda.',
  'landing.how4Title': 'Lihat langkah selanjutnya',
  'landing.how4Body': 'Dasbor, katalog hidup, dan saran perbaikan konkret per alur kerja.',
  'landing.capTitle1': 'Semua yang dibutuhkan direktorat,',
  'landing.capTitle2': 'di satu tempat',
  'landing.cap1Title': 'Katalog proses hidup',
  'landing.cap1Body': 'Setiap alur kerja terdokumentasi dalam satu tempat terstruktur dan dapat dicari.',
  'landing.cap2Title': 'Pemurnian & klasifikasi AI',
  'landing.cap2Body': 'Langkah dilabeli AI agen, otomasi, atau manusia di loop — beserta alasannya.',
  'landing.cap3Title': 'Dasbor sesuai peran',
  'landing.cap3Body': 'Tampilan direktorat untuk CFO, peta subfungsi untuk lead, pelacakan kelengkapan untuk manajer.',
  'landing.cap4Title': 'Saran perbaikan',
  'landing.cap4Body': 'Alur kerja berupaya tinggi ditandai dengan solusi yang disarankan dan hasil yang dilacak.',
  'landing.cap5Title': 'Kolaborasi bawaan',
  'landing.cap5Body': 'Tandai rekan di tugas bersama agar tidak tercatat dobel.',
  'landing.cap6Title': 'Notifikasi terarah',
  'landing.cap6Body': 'Jangkau orang menurut level atau lini kerja saat detail kurang.',
  'landing.ready': 'Siap kapan pun Anda siap.',
  'landing.readySub': 'Akun dibuat admin program — masuk dengan username dan kata sandi Anda.',
  'landing.startNow': 'Masuk',
  'landing.footer': 'Blueprint · Katalog Proses Keuangan · Project Vanguard',
  'landing.errLoading': 'Daftar pengguna masih dimuat. Coba lagi sebentar.',
  'landing.errSync': 'Tidak bisa menghubungi direktori pengguna bersama. Periksa koneksi lalu coba lagi.',
  'landing.errNotRegistered': 'Username tidak ditemukan. Minta akses ke admin program.',
  'landing.errMismatch': 'Username atau kata sandi salah.',

  'lock.welcome': 'Selamat datang kembali, {name}',
  'lock.sub': 'Masukkan kata sandi untuk membuka kembali katalog Anda',
  'lock.unlock': 'Buka',
  'lock.badPassword': 'Kata sandi tidak cocok — coba lagi.',
  'lock.notYou': 'Bukan Anda? Mulai ulang',
  'lock.confirmReset': 'Mulai ulang? Ini menghapus profil lokal Anda (proses terdokumentasi tetap tersimpan).',

  'remote.signInSub': 'Masuk dengan nama pengguna dan kata sandi program Anda.',
  'remote.newHere': 'Baru di sini? Buat akun',
  'remote.firstSetup': 'Setup program pertama kali? Buat akun Admin',
  'remote.registerTitle': 'Buat akun Anda',
  'remote.registerSub': 'Daftar dengan email kantor — disimpan ke database program.',
  'remote.registerCta': 'Daftar & masuk',
  'remote.haveAccount': 'Sudah punya akun? Masuk',
  'remote.bootstrapTitle': 'Siapkan akun Admin',
  'remote.bootstrapSub': 'Hanya berfungsi sekali, sebelum ada akun. Staf harus memakai Daftar setelahnya.',
  'remote.createAdmin': 'Buat akun Admin',
  'remote.backSignIn': 'Kembali ke masuk',
  'remote.adminCreated': 'Akun Admin dibuat',
  'remote.copyNow': 'Salin sekarang — kata sandi sementara tidak akan ditampilkan lagi.',
  'remote.tempPassword': 'Kata sandi sementara',
  'remote.continueSignIn': 'Lanjut ke masuk',
  'remote.placeholderName': 'Nama lengkap Anda',
  'remote.placeholderEmail': 'Email kantor Anda',
  'remote.placeholderPass': 'Kata sandi (min. 8 karakter)',
  'remote.roleLevel': 'Level peran',
  'remote.lineOfWork': 'Lini kerja',

  'onboard.back': 'Kembali',
  'onboard.progress': 'Memahami Anda · {n} dari 3',
  'onboard.roleTitle': 'Apa peran Anda?',
  'onboard.roleSub': 'Ini menentukan tampilan dan dasbor yang Anda dapatkan.',
  'onboard.role.L1.title': 'CFO',
  'onboard.role.L1.sub': 'L1 · Pemimpin direktorat',
  'onboard.role.L1.body': 'Visibilitas penuh direktorat, strategi, dan adopsi native-AI.',
  'onboard.role.L2.title': 'GM / Kepala / Advisor',
  'onboard.role.L2.sub': 'L2 · Pemimpin subfungsi',
  'onboard.role.L2.body': 'Merencanakan transformasi untuk satu subfungsi.',
  'onboard.role.L3.title': 'Controller / Kepala dept.',
  'onboard.role.L3.sub': 'L3 · Manajer unit',
  'onboard.role.L3.body': 'Mengelola orang dan melacak kelengkapan dokumentasi.',
  'onboard.role.L4.title': 'Eksekutif / Koordinator',
  'onboard.role.L4.sub': 'L4 · Pelaksana proses',
  'onboard.role.L4.body': 'Mendokumentasikan proses kerja harian secara detail.',
  'onboard.role.Admin.title': 'Admin program',
  'onboard.role.Admin.sub': 'Lead Project Vanguard',
  'onboard.role.Admin.body': 'Menjalankan program: kualitas data, daftar hackathon, tahap berikutnya.',
  'onboard.nameTitle': 'Siapa nama Anda?',
  'onboard.nameSub': 'Agar kami bisa menyapa dengan benar dan mencatat katalog Anda.',
  'onboard.namePlaceholder': 'mis. Budi Santoso',
  'onboard.emailInvalid': 'Masukkan email kantor yang valid.',
  'onboard.emailTaken': 'Email sudah terdaftar. Silakan masuk saja.',
  'onboard.roleOverride': 'Override peran manual',
  'onboard.roleOverrideHint': '(opsional — sepenuhnya mengabaikan peran sistem)',
  'onboard.roleOverridePh': 'mis. Senior Finance Manager, Konsultan CFO',
  'onboard.passTitle': 'Buat kata sandi',
  'onboard.passSub': 'Katalog Anda tetap di perangkat ini — kata sandi memastikan hanya Anda yang bisa membukanya lagi.',
  'onboard.confirmPass': 'Konfirmasi kata sandi',
  'onboard.checkLen': 'Minimal 8 karakter',
  'onboard.checkMix': 'Campuran huruf dan angka',
  'onboard.checkMatch': 'Kedua isian cocok',
  'onboard.create': 'Buat ruang saya',
  'onboard.doneTitle': 'Siap, {name}!',
  'onboard.doneSub': 'Mari catat proses kerja pertama Anda — agen pemahaman sudah siap.',
  'onboard.starting': 'Memulai perjalanan Anda…',

  'ws.tagline': 'Mari buat cara Anda bekerja terlihat.',
  'ws.processesDoc': 'Proses terdokumentasi',
  'ws.yours': '{n} milik Anda',
  'ws.yoursLabel': 'milik Anda',
  'ws.avgCompleteness': 'Rata-rata kelengkapan',
  'ws.capture': 'Catat proses',
  'ws.transfer': 'Transfer Data',
  'ws.transferTitle': 'Transfer data lokal (Impor/Ekspor)',
  'ws.viewAs': 'Lihat sebagai',
  'ws.logOut': 'Keluar',
  'ws.language': 'Bahasa',

  'journey.stage.upload': 'Output',
  'journey.stage.describe': 'Jelaskan',
  'journey.stage.interview': 'Wawancara',
  'journey.stage.mining': 'Tambang',
  'journey.stage.review': 'Tinjau',
  'journey.stage.recap': 'Konfirmasi',
  'journey.skip': 'Lewati dulu →',
  'journey.resumed': 'Draf yang belum selesai dilanjutkan — tidak ada yang hilang.',
  'journey.miningTitle': 'Agen pemahaman sedang bekerja',
  'journey.miningFailTitle': 'Tidak berhasil',
  'journey.miningError':
    'Agen pemahaman tidak bisa menjangkau server. Pastikan server dev berjalan, lalu coba lagi.',
  'journey.mine1': 'Membaca deskripsi Anda…',
  'journey.mine2': 'Memisahkan proses yang berbeda…',
  'journey.mine3': 'Menghitung langkah di setiap proses…',
  'journey.mine4': 'Memperluas pemicu, aksi, dan hasil…',
  'journey.mine5': 'Mendeteksi sistem yang Anda sentuh…',
  'journey.mine6': 'Mengklasifikasi setiap langkah untuk transformasi AI…',

  'upload.title': 'Unggah output kerja Anda',
  'upload.sub':
    'Laporan, checklist, catatan serah terima, log ekspor — apa pun yang Anda hasilkan saat bekerja. Agen pemahaman membacanya untuk merekonstruksi proses Anda. Langkah ini opsional.',
  'upload.drop': 'Jatuhkan file di sini',
  'upload.formats': 'Teks biasa paling cocok — {formats} hingga 1 MB per file',
  'upload.aria': 'Unggah file output kerja',
  'upload.paste': 'Tempel teks saja',
  'upload.pastePh': 'Tempel cuplikan laporan, checklist, atau catatan serah terima…',
  'upload.addPaste': 'Tambah ke output kerja',
  'upload.pastedName': 'Catatan ditempel {n}',
  'upload.rejected': '"{name}" dilewati — hanya format teks biasa berukuran kecil yang bisa ditambang di sini.',
  'upload.skip': 'Tidak ada yang diunggah — lewati',
  'upload.next': 'Lanjut',
  'upload.nextWith': 'Lanjut dengan {n} dokumen',

  'describe.title': 'Jelaskan cara Anda bekerja',
  'describe.sub':
    'Dengan kata Anda sendiri — ketik atau bicara saja. Jangan khawatir soal struktur; menghitung, mengklasifikasi, dan memperluas langkah adalah tugas agen.',
  'describe.workingTitle': 'Beri judul sementara',
  'describe.titlePh': 'mis. Pelaporan PPN bulanan',
  'describe.lineOfWork': 'Lini kerja',
  'describe.lineHint': '(opsional — AI bisa menyarankan)',
  'describe.suggest': 'Biarkan agen menyarankan…',
  'describe.narrative': 'Proses Anda, dengan kata Anda sendiri',
  'describe.narrativePh':
    'mis. "Setiap pagi saya unduh billing pasien keluar dari KAIROS, cek kode tarif terhadap aturan BPJS, lalu unggah klaim terverifikasi ke portal e-Claim BPJS…"',
  'describe.dictate': 'Diktekan dengan suara',
  'describe.stopDictate': 'Berhenti mendikte',
  'describe.micLoading': 'Meminta mikrofon...',
  'describe.micPerm': 'Meminta izin mikrofon...',
  'describe.listening': 'Mendengarkan… bicara dengan natural, jeda kapan saja.',
  'describe.micTip': 'Tips: ketuk mikrofon dan ceritakan hari Anda — transkrip muncul di sini.',
  'describe.noMic': 'Input suara tidak didukung di browser ini — mengetik juga sama bagusnya.',
  'describe.mine': 'Biarkan agen bekerja',
  'describe.needMore': 'Jelaskan proses Anda (atau unggah output) dulu',
  'describe.chars': '{n} karakter',

  'recap.title': 'Tercatat & tersimpan',
  'recap.sub': '{processes} proses · {steps} langkah — apa yang ingin Anda lakukan selanjutnya?',
  'recap.noLine': 'Lini kerja belum diisi',
  'recap.workProfile': 'Profil kerja',
  'recap.across': 'Di semua proses:',
  'recap.editTitle': 'Edit lagi',
  'recap.editBody': 'Kembali dan sesuaikan proses, langkah, atau detail.',
  'recap.analyseTitle': 'Analisis',
  'recap.analyseBody': 'Jalankan pemurnian & klasifikasi AI penuh.',
  'recap.resultsTitle': 'Lihat hasil',
  'recap.resultsBody': 'Buka dasbor dan katalog Anda.',
  'recap.adviceTitle': 'Dapatkan saran perbaikan',
  'recap.adviceBody': 'Di mana otomasi atau AI agen paling membantu.',

  'dash.cfo.L1': 'Ringkasan direktorat',
  'dash.cfo.L2': 'Ringkasan subfungsi',
  'dash.cfo.refreshed': 'Terakhir diperbarui {time}',
  'dash.cfo.statProcesses': 'Proses terdokumentasi',
  'dash.cfo.statProcessesHint': 'di 7 fungsi',
  'dash.cfo.statComplete': 'Rata-rata kelengkapan',
  'dash.cfo.statCompleteHint': 'dari detail yang diperlukan',
  'dash.cfo.statAuto': 'Kandidat otomasi',
  'dash.cfo.statAutoHint': 'kesesuaian ≥ 70',
  'dash.cfo.statImp': 'Perbaikan terselesaikan',
  'dash.cfo.statImpHint': 'inisiatif yang dilacak',
  'dash.cfo.coverage': 'Cakupan dokumentasi per lini kerja',
  'dash.cfo.coverageSub': 'Proses terdokumentasi per subfungsi',
  'dash.cfo.mix': 'Bauran transformasi AI',
  'dash.cfo.mixSub': 'Klasifikasi langkah di seluruh katalog',
  'dash.cfo.champions': 'Juara dokumentasi',
  'dash.cfo.riceSummary': 'Ringkasan skor RICE',
  'dash.cfo.riceFormula': '(Reach × Impact × Confidence) ÷ Effort — proyek terkunci diurutkan prioritas',
  'dash.cfo.riceEmpty': 'Belum ada proyek dengan input RICE.',
  'dash.cfo.recent': 'Baru diperbarui',
  'dash.cfo.plan': 'Rencana transformasi',
  'dash.mgr.title': 'Ruang tim',
  'dash.mgr.completion': 'Kelengkapan tim',
  'dash.mgr.completionHint': 'personel yang terdokumentasi penuh',
  'dash.mgr.highEffort': 'Alur kerja berupaya tinggi',
  'dash.mgr.highEffortHint': 'ditandai untuk perbaikan',
  'dash.mgr.guidance': 'Item panduan',
  'dash.mgr.guidanceHint': 'terbuka vs terselesaikan dilacak di bawah',
  'dash.mgr.tracker': 'Pelacak dokumentasi personel',
  'dash.mgr.emptyRoster': 'Belum ada pemilik proses — daftar terisi saat staf mencatat proses.',
  'dash.mgr.noEmail': 'Tanpa email',
  'dash.mgr.complete': 'Selesai',
  'dash.mgr.inProgress': 'Berjalan',
  'dash.mgr.notStarted': 'Belum mulai',
  'dash.mgr.remind': 'Ingatkan',
  'dash.mgr.reminded': 'Diingatkan',
  'dash.mgr.highTitle': 'Alur kerja berupaya tinggi / kandidat otomasi',
  'dash.mgr.track': 'Lacak perbaikan',
  'dash.mgr.tracked': 'Dilacak',
  'dash.mgr.board': 'Papan panduan perbaikan',
};

const catalogs: Record<Locale, Dict> = {
  en: { ...en, ...enExtra1, ...enExtra2, ...enExtra3, ...enExtra4 },
  id: { ...id, ...idExtra1, ...idExtra2, ...idExtra3, ...idExtra4 },
};

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('id')) return 'id';
  return 'en';
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

interface LocaleCtx {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale === 'id' ? 'id' : 'en';
  }, [locale]);

  const value = useMemo<LocaleCtx>(() => {
    const dict = catalogs[locale];
    const t: TFn = (key, vars) => format(dict[key] ?? catalogs.en[key] ?? key, vars);
    return { locale, setLocale, t };
  }, [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useT() {
  return useLocale().t;
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-white/70 p-0.5 text-[11px] font-semibold ${className}`}
      role="group"
      aria-label={t('lang.switch')}
    >
      {(['en', 'id'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-full px-2.5 py-1 transition-colors cursor-pointer ${
            locale === code ? 'bg-ink text-white' : 'text-mute hover:text-ink'
          }`}
          aria-pressed={locale === code}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}

export function greetingFor(locale: Locale): string {
  const h = new Date().getHours();
  const dict = catalogs[locale];
  if (h < 5) return dict['greeting.late']!;
  if (h < 12) return dict['greeting.morning']!;
  if (h < 17) return dict['greeting.afternoon']!;
  return dict['greeting.evening']!;
}

export function classLabel(locale: Locale, cls: 'agentic-ai' | 'automation' | 'human-in-the-loop', short = false): string {
  const dict = catalogs[locale];
  if (cls === 'agentic-ai') return dict[short ? 'class.agenticShort' : 'class.agentic']!;
  if (cls === 'automation') return dict[short ? 'class.automationShort' : 'class.automation']!;
  return dict[short ? 'class.humanShort' : 'class.human']!;
}
