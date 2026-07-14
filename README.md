# Blueprint · Finance Process Catalogue

Map how you really work — and let AI find what's next.

Blueprint is the data-capture foundation of the finance directorate's native-AI
transformation (Project Vanguard). Every staff member documents their working
processes into a single catalogue; the app's understanding agent mines, refines
and classifies each step (agentic-AI / automation / human-in-the-loop), and
role-scoped dashboards turn the captured data into transformation decisions.

## The user journey

1. **Landing page** — what Blueprint is and how it works.
2. **Understanding you** — pick your role (CFO L1 → Executor L4, or Programme
   Admin), tell us your name, and set a password so only you can re-open your
   space later (stored locally, SHA-256 hashed).
3. **Capture journey** —
   - *Upload your working outputs* (reports, checklists, notes — optional),
   - *Describe your process* by typing **or talking** (Web Speech API),
   - the **understanding agent** counts, expands and classifies the steps,
   - *Review* the mined steps (edit, reorder, tag systems & collaborators),
   - *Confirm* — then choose: **Edit · Analyse · See results · Get advice**.
4. **Workspace** — role-scoped views:
   - **Dashboard** (L1/L2: directorate coverage, classification mix, champions,
     transformation plan · L3: team completion tracker, high-effort flags,
     guidance tracker),
   - **Catalogue** (search/filter, step timeline detail, print/PDF export),
   - **AI Refinement** (suitability score, drivers, explainable and overridable
     classifications),
   - **Inbox** (tags, chases, broadcasts),
   - **Programme admin** (hackathon challenge list, data quality, next-stage
     readiness, targeted notifications, dataset export).

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev        # http://localhost:3000
```

### AI engine

The mining and refinement engines run in the browser. If `VITE_GEMINI_API_KEY`
is set, the app calls Gemini directly from the frontend; if it is empty or the
request fails, it falls back to local heuristics.

Browser-side Gemini is only suitable for one-off/demo use because the key is
visible to anyone who can open the app. Use a restricted, low-quota key.

The browser miner segments one free-text dump into N distinct processes, then
structures the steps of each and maps every process to exactly one of the fixed
**lines of work** (`SUBFUNCTIONS_LIST` in `src/data/mockData.ts`). The capture
review stage lets you rename each process, edit its steps, and split/merge
before all of them save as separate catalogue entries.

### Spreadsheet sync

By default the app runs local-first with `localStorage`. To sync through Google
Sheets while keeping Vercel frontend-only:

1. Create a Google Sheet.
2. Open **Extensions -> Apps Script**.
3. Paste `docs/google-apps-script.js`.
4. Deploy it as a Web App with access set for the intended users.
5. Set `VITE_SHEETS_ENDPOINT` in Vercel to the Web App URL.

The spreadsheet stores a simple JSON snapshot per key in a `state` sheet.

### Other scripts

```bash
npm run lint       # typecheck (tsc --noEmit)
npm run build      # production build
npm run start      # preview the production build
```

## Notes

- All data is local-first: processes, systems and your profile persist in
  `localStorage`; the capture journey autosaves a draft so interruptions never
  lose work.
- The rail's **View as** switcher is a demo affordance to preview every
  role's scoped experience without re-onboarding.
