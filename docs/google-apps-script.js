const SHEET_NAME = 'state';
const SPREADSHEET_ID = '1Uj25hLKdkA913mtnLJjcGnQtCOnq8zHrxStdhBOJTdk';

function sheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['key', 'json', 'updatedAt']);
  return sheet;
}

function readState_() {
  const sheet = sheet_();
  const lastRow = sheet.getLastRow();
  const out = {};
  if (lastRow <= 1) return out;

  sheet.getRange(2, 1, lastRow - 1, 2).getValues().forEach(([key, value]) => {
    if (!key || value === '') return;
    try {
      out[String(key)] = JSON.parse(String(value));
    } catch (error) {
      console.error(`Invalid JSON for key "${key}": ${error.message}`);
    }
  });
  return out;
}

function byId_(existing, incoming) {
  const map = {};
  (Array.isArray(existing) ? existing : []).forEach((item) => {
    if (item && item.id) map[item.id] = item;
  });
  (Array.isArray(incoming) ? incoming : []).forEach((item) => {
    if (item && item.id) map[item.id] = item;
  });
  return Object.keys(map).map((id) => map[id]);
}

function profileKey_(profile) {
  if (!profile) return '';
  return String(profile.email || profile.name || '').trim().toLowerCase();
}

function mergeState_(current, incoming) {
  const profileKey = profileKey_(incoming.profile);
  const profiles = Object.assign({}, current.profiles || {}, incoming.profiles || {});
  if (profileKey && incoming.profile) profiles[profileKey] = incoming.profile;

  return Object.assign({}, current, incoming, {
    profiles,
    processes: byId_(current.processes, incoming.processes),
    systems: byId_(current.systems, incoming.systems),
    notifications: byId_(current.notifications, incoming.notifications),
    adminBroadcastLogs: byId_(current.adminBroadcastLogs, incoming.adminBroadcastLogs),
    improvementItems: byId_(current.improvementItems, incoming.improvementItems),
  });
}

function writeState_(state) {
  const sheet = sheet_();
  const lastRow = sheet.getLastRow();
  const existingRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues() : [];
  const rowIndexByKey = new Map(existingRows.map(([key], index) => [String(key), index + 2]));
  const updatedAt = new Date().toISOString();
  const newRows = [];

  Object.entries(state).forEach(([key, value]) => {
    const row = [key, JSON.stringify(value), updatedAt];
    const existingRow = rowIndexByKey.get(key);
    if (existingRow) sheet.getRange(existingRow, 1, 1, 3).setValues([row]);
    else newRows.push(row);
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 3).setValues(newRows);
  }
}

function clearKnownSheets_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  [
    SHEET_NAME,
    'Users',
    'Process Catalogue',
    'Process Steps',
    'Systems Used',
    'Inbox',
    'Broadcast History',
    'Improvement Tracker',
  ].forEach((name) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) sheet.clearContents();
  });
}

function writeTable_(name, headers, rows) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
}

function join_(value) {
  return Array.isArray(value) ? value.join(', ') : value || '';
}

function writeFlatTables_(state) {
  const profiles = Object.values(state.profiles || {});
  const processes = Array.isArray(state.processes) ? state.processes : [];
  const steps = processes.flatMap((process) =>
    (process.steps || []).map((step) => [
      process.id,
      process.title,
      process.ownerEmail,
      step.id,
      step.order,
      step.name,
      step.description,
      join_(step.inputs),
      join_(step.outputs),
      join_(step.decisionPoints),
      join_(step.systems),
      join_(step.handOffs),
      step.aiClassification || '',
      step.aiRationale || '',
    ]),
  );

  writeTable_('Users', ['Name', 'Work Email', 'Role', 'Registered At', 'Password Set'], profiles.map((p) => [
    p.name || '',
    p.email || '',
    p.role || '',
    p.createdAt || '',
    Boolean(p.passwordHash),
  ]));

  writeTable_('Process Catalogue', [
    'Process ID',
    'Process Title',
    'Line of Work',
    'Owner Name',
    'Owner Email',
    'Owner Level',
    'Status',
    'Last Updated',
    'Completeness Score',
    'Automation Suitability',
    'Shared Process',
    'Tagged Users',
    'Open Gaps',
    'Number of Steps',
  ], processes.map((p) => [
    p.id || '',
    p.title || '',
    p.subFunction || '',
    p.ownerName || '',
    p.ownerEmail || '',
    p.ownerLevel || '',
    p.status || '',
    p.lastUpdated || '',
    p.completenessScore || 0,
    p.automationSuitability || '',
    Boolean(p.isShared),
    join_(p.taggedUsers),
    join_(p.gaps),
    (p.steps || []).length,
  ]));

  writeTable_('Process Steps', [
    'Process ID',
    'Process Title',
    'Owner Email',
    'Step ID',
    'Step Number',
    'Step Name',
    'Step Description',
    'Inputs',
    'Outputs',
    'Decision Points',
    'Systems Used',
    'Hand Offs',
    'AI Classification',
    'AI Rationale',
  ], steps);

  writeTable_('Systems Used', ['System ID', 'System Name', 'System Category', 'Process Count'], (state.systems || []).map((s) => [
    s.id || '',
    s.name || '',
    s.category || '',
    s.processCount || 0,
  ]));

  writeTable_('Inbox', ['Notification ID', 'Sender', 'Subject', 'Message', 'Sent At', 'Status', 'Action Required', 'Action Type', 'Related Process ID', 'User Response'], (state.notifications || []).map((n) => [
    n.id || '',
    n.senderName || '',
    n.subject || '',
    n.message || '',
    n.timestamp || '',
    n.status || '',
    Boolean(n.actionRequired),
    n.actionType || '',
    n.targetProcessId || '',
    n.responseText || '',
  ]));

  writeTable_('Broadcast History', ['Broadcast ID', 'Sender', 'Audience Type', 'Audience', 'Subject', 'Message', 'Sent At', 'Status', 'Responses Count'], (state.adminBroadcastLogs || []).map((l) => [
    l.id || '',
    l.senderName || '',
    l.targetType || '',
    l.targetValue || '',
    l.subject || '',
    l.message || '',
    l.timestamp || '',
    l.status || '',
    l.responsesCount || 0,
  ]));

  writeTable_('Improvement Tracker', ['Improvement ID', 'Process ID', 'Process Title', 'Line of Work', 'Recommended Solution', 'Status', 'Owner Name', 'Expected Impact', 'Realized Savings'], (state.improvementItems || []).map((i) => [
    i.id || '',
    i.processId || '',
    i.processTitle || '',
    i.subFunction || '',
    i.recommendedSolution || '',
    i.status || '',
    i.ownerName || '',
    i.expectedImpact || '',
    i.realizedSavings || '',
  ]));
}

function geminiModels_() {
  const props = PropertiesService.getScriptProperties();
  const preferred = props.getProperty('GEMINI_MODEL') || 'gemini-flash-lite-latest';
  // Free-tier text models only — same cascade as frontend. Skip Pro/image/TTS.
  const free = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];
  return Array.from(new Set([preferred].concat(free)));
}

function parseGeminiJson_(text) {
  const clean = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(clean);
  } catch (error) {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('Gemini returned invalid JSON');
  }
}

/** Production AI path — key lives in Script Properties, never in the frontend bundle. */
function runGeminiJson_(prompt) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('Set Script Property GEMINI_API_KEY in Apps Script Project Settings');
  if (!prompt || typeof prompt !== 'string') throw new Error('prompt required');

  let lastError = '';
  for (const model of geminiModels_()) {
    const res = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        payload: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      },
    );
    const code = res.getResponseCode();
    const body = JSON.parse(res.getContentText() || '{}');
    if (code < 200 || code >= 300) {
      lastError = `${model}: ${body?.error?.status || code}`;
      continue;
    }
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = `${model}: empty response`;
      continue;
    }
    return { ok: true, model, data: parseGeminiJson_(text) };
  }
  throw new Error(`Gemini failed on all models. ${lastError}`);
}

function doGet(e) {
  if (e?.parameter?.action !== 'getState') return json_({ ok: false, error: 'Unknown action' });
  try {
    return json_(readState_());
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(e) {
  const body = JSON.parse(e?.postData?.contents || '{}');

  // AI calls skip the sheet lock — they can take >10s and must not block sync.
  if (body.action === 'geminiJSON') {
    try {
      return json_(runGeminiJson_(body.prompt));
    } catch (error) {
      return json_({ ok: false, error: error.message });
    }
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (body.action === 'resetState') {
      clearKnownSheets_();
      sheet_();
      // Keep mirror tab headers; optionally seed an admin profile.
      const seedProfile = body.seed && body.seed.profile && typeof body.seed.profile === 'object' ? body.seed.profile : null;
      const profiles = {};
      if (seedProfile) {
        const key = profileKey_(seedProfile);
        if (key) profiles[key] = seedProfile;
      }
      const clean = {
        profiles,
        profile: seedProfile,
        phase: null,
        processes: [],
        systems: [],
        notifications: [],
        adminBroadcastLogs: [],
        improvementItems: [],
      };
      writeState_(clean);
      writeFlatTables_(clean);
      return json_({ ok: true, reset: true, profiles: Object.keys(profiles).length });
    }
    if (body.action !== 'saveState') return json_({ ok: false, error: 'Unknown action' });
    if (!body.snapshot || typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
      return json_({ ok: false, error: 'snapshot must be an object' });
    }

    const merged = mergeState_(readState_(), body.snapshot);
    writeState_(merged);
    writeFlatTables_(merged);
    return json_({
      ok: true,
      saved: Object.keys(body.snapshot).length,
      mergedProfiles: Object.keys(merged.profiles || {}).length,
      mergedProcesses: (merged.processes || []).length,
    });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
