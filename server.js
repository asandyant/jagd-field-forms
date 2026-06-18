const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const WEEKLY_MEETINGS_FILE = path.join(DATA_DIR, 'weekly-meetings.json');
const FORM_LOGS_FILE = path.join(DATA_DIR, 'form-logs.json');
const WORKERS_FILE = path.join(DATA_DIR, 'workers.json');
const WORKERS_VERSION_FILE = path.join(DATA_DIR, 'workers-source-version.json');
const BUILT_IN_WORKERS_VERSION_FILE = path.join(__dirname, 'public', 'data', 'active-workers-version.json');
const MATERIALS_FILE = path.join(DATA_DIR, 'materials.json');
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || 'JadgForms123!!!';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');
if (!fs.existsSync(WEEKLY_MEETINGS_FILE)) fs.writeFileSync(WEEKLY_MEETINGS_FILE, '[]');
if (!fs.existsSync(FORM_LOGS_FILE)) fs.writeFileSync(FORM_LOGS_FILE, '[]');
if (!fs.existsSync(WORKERS_FILE)) {
  const seed = path.join(__dirname, 'public', 'data', 'active-workers.json');
  fs.writeFileSync(WORKERS_FILE, fs.existsSync(seed) ? fs.readFileSync(seed, 'utf8') : '[]');
}
if (!fs.existsSync(MATERIALS_FILE)) {
  const seeds = ['gwb-materials.json', 'dyre-materials.json'];
  let mats = [];
  for (const file of seeds) {
    const seed = path.join(__dirname, 'public', 'data', file);
    if (fs.existsSync(seed)) {
      try { const rows = JSON.parse(fs.readFileSync(seed, 'utf8')); if (Array.isArray(rows)) mats = mats.concat(rows); } catch (e) {}
    }
  }
  fs.writeFileSync(MATERIALS_FILE, JSON.stringify(mats, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${nanoid(8)}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024, files: 24 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (/\.(html|js|css)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));
app.use('/uploads', express.static(UPLOAD_DIR));

function readSubmissions() {
  return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
}
function writeSubmissions(rows) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(rows, null, 2));
}

function dateToDisplay(dateValue) {
  const d = String(dateValue || '');
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d || 'No Date';
  return `${m[2]}-${m[3]}-${m[1].slice(2)}`;
}
function formTitle(type, data) {
  if (type === 'pir') return `PIR - ${dateToDisplay(data.reportDate)}`;
  if (type === 'mewp') return `MEWP - ${dateToDisplay(data.inspectionDate)}`;
  return `Form - ${dateToDisplay(data.reportDate || data.inspectionDate)}`;
}


function readWeeklyMeetings() {
  return JSON.parse(fs.readFileSync(WEEKLY_MEETINGS_FILE, 'utf8'));
}
function writeWeeklyMeetings(rows) {
  fs.writeFileSync(WEEKLY_MEETINGS_FILE, JSON.stringify(rows, null, 2));
}

function seedWorkersFromPublic() {
  const seed = path.join(__dirname, 'public', 'data', 'active-workers.json');
  if (!fs.existsSync(seed)) return [];
  try {
    const rows = JSON.parse(fs.readFileSync(seed, 'utf8'));
    if (Array.isArray(rows) && rows.length) {
      const normalized = rows.map((w, idx) => ({
        id: cleanText(w.id || w.employeeId || slug(w.fullName || `${w.firstName || ''} ${w.lastName || ''}`.trim()) || `worker-${idx + 1}`),
        firstName: cleanText(w.firstName),
        lastName: cleanText(w.lastName),
        fullName: cleanText(w.fullName) || `${cleanText(w.firstName)} ${cleanText(w.lastName)}`.trim(),
        class: cleanText(w.class),
        local: cleanLocalValue(w.local),
        currentJob: cleanText(w.currentJob),
        status: cleanText(w.status) || 'Active',
        employeeId: cleanText(w.employeeId),
        trade: cleanText(w.trade),
        crew: cleanText(w.crew),
        disabled: !!w.disabled,
        updatedAt: new Date().toISOString()
      })).filter(w => w.fullName);
      const ensured = ensureRequiredDwlWorkers(normalized);
      return ensured.rows;
    }
  } catch (e) {}
  return ensureRequiredDwlWorkers([]).rows;
}
function normalizeWorkerRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(w => ({ ...w, local: cleanLocalValue(w.local) }));
}
function readWorkers() {
  try {
    const rows = JSON.parse(fs.readFileSync(WORKERS_FILE, 'utf8'));
    if (Array.isArray(rows) && rows.length) {
      const normalized = normalizeWorkerRows(rows);
      const ensured = ensureRequiredDwlWorkers(normalized);
      if (ensured.changed) writeWorkers(ensured.rows);
      return ensured.rows;
    }
  } catch (e) {}
  const seeded = seedWorkersFromPublic();
  if (seeded.length) {
    writeWorkers(seeded);
    return seeded;
  }
  const required = ensureRequiredDwlWorkers([]).rows;
  writeWorkers(required);
  return required;
}
function writeWorkers(rows) {
  const ensured = ensureRequiredDwlWorkers(rows);
  fs.writeFileSync(WORKERS_FILE, JSON.stringify(ensured.rows, null, 2));
}
function seedMaterialsFromPublic() {
  const seeds = ['gwb-materials.json', 'dyre-materials.json'];
  let mats = [];
  for (const file of seeds) {
    const seed = path.join(__dirname, 'public', 'data', file);
    if (fs.existsSync(seed)) {
      try {
        const rows = JSON.parse(fs.readFileSync(seed, 'utf8'));
        if (Array.isArray(rows)) mats = mats.concat(rows);
      } catch (e) {}
    }
  }
  return mats;
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return fallback;
  }
}
function writeJsonSafe(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}
function syncWorkersFromBuiltInVersionIfNeeded() {
  const builtInVersion = readJsonSafe(BUILT_IN_WORKERS_VERSION_FILE, null);
  if (!builtInVersion || !builtInVersion.hash) return;
  const currentVersion = readJsonSafe(WORKERS_VERSION_FILE, null);
  if (currentVersion && currentVersion.hash === builtInVersion.hash) return;
  const seeded = seedWorkersFromPublic();
  if (!seeded.length) return;
  writeWorkers(seeded);
  writeJsonSafe(WORKERS_VERSION_FILE, {
    ...builtInVersion,
    syncedAt: new Date().toISOString(),
    source: 'public/data/active-workers.json'
  });
  console.log(`Synced DWL worker list from built-in roster: ${seeded.length} workers (${builtInVersion.hash}).`);
}

function readMaterials() {
  try {
    const rows = JSON.parse(fs.readFileSync(MATERIALS_FILE, 'utf8'));
    if (Array.isArray(rows) && rows.length) return rows;
  } catch (e) {}
  const seeded = seedMaterialsFromPublic();
  if (seeded.length) {
    writeMaterials(seeded);
    return seeded;
  }
  return [];
}
function writeMaterials(rows) {
  fs.writeFileSync(MATERIALS_FILE, JSON.stringify(rows, null, 2));
}
function isWorkerActive(w) {
  if (w.disabled) return false;
  const status = String(w.status || '').toLowerCase();
  if (status.includes('term') || status.includes('inactive') || status.includes('disabled')) return false;
  return true;
}
function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', inQuotes = false;
  const t = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i], next = t[i + 1];
    if (ch === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { row.push(cur); cur = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(v => String(v).trim())) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.some(v => String(v).trim())) rows.push(row);
  return rows;
}
function normalizeHeader(h) { return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function pick(row, map, names) { for (const n of names) { const i = map[normalizeHeader(n)]; if (i !== undefined) return cleanText(row[i]); } return ''; }
function slug(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || nanoid(8); }
function makeMaterialLabel(m) {
  const parts = [m.component || 'Material', m.prodName || m.description || 'COA Material'];
  if (m.batch) parts.push(`Batch ${m.batch}`);
  if (m.expDate) parts.push(`Exp ${m.expDate}`);
  return parts.join(' — ');
}

function readFormLogs() {
  return JSON.parse(fs.readFileSync(FORM_LOGS_FILE, 'utf8'));
}
function writeFormLogs(rows) {
  fs.writeFileSync(FORM_LOGS_FILE, JSON.stringify(rows, null, 2));
}
function requireAdmin(req, res, next) {
  const supplied = req.get('x-admin-pin') || req.query.pin || '';
  if (supplied !== ADMIN_PIN) return res.status(401).json({ error: 'Admin PIN required.' });
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'jagd-field-forms', version: 'dwl-worker-api-fix-20260618', time: new Date().toISOString() });
});
function cleanText(v) {
  return String(v || '').trim().slice(0, 500);
}
function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[\",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

syncWorkersFromBuiltInVersionIfNeeded();

app.post('/api/weekly-meetings', (req, res) => {
  const project = cleanText(req.body.project);
  const date = cleanText(req.body.date);
  const topic = cleanText(req.body.topic);
  const foreman = cleanText(req.body.foreman);
  if (!project || !date || !topic) return res.status(400).json({ error: 'Project, date, and safety topic are required.' });
  const meeting = { id: nanoid(10), project, date, topic, foreman, attendees: [], createdAt: new Date().toISOString() };
  const rows = readWeeklyMeetings();
  rows.push(meeting);
  writeWeeklyMeetings(rows);
  res.json({ ok: true, meeting });
});

app.get('/api/weekly-meetings/:id', (req, res) => {
  const meeting = readWeeklyMeetings().find(x => x.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
  res.json({ ok: true, meeting });
});

app.post('/api/weekly-meetings/:id/sign', (req, res) => {
  const rows = readWeeklyMeetings();
  const meeting = rows.find(x => x.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
  const name = cleanText(req.body.name);
  const company = cleanText(req.body.company);
  let signatureData = String(req.body.signatureData || '');
  if (!signatureData.startsWith('data:image/png;base64,')) signatureData = '';
  if (signatureData.length > 750000) signatureData = '';
  if (!name) return res.status(400).json({ error: 'Worker name is required.' });
  if (!signatureData) return res.status(400).json({ error: 'Worker signature is required.' });
  meeting.attendees = meeting.attendees || [];
  const existing = meeting.attendees.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.company = company || existing.company;
    existing.signatureData = signatureData || existing.signatureData;
    existing.signedAt = new Date().toISOString();
  } else {
    meeting.attendees.push({ id: nanoid(8), name, company, signatureData, signedAt: new Date().toISOString() });
  }
  writeWeeklyMeetings(rows);
  res.json({ ok: true, meeting });
});


app.post('/api/form-logs', (req, res) => {
  const type = cleanText(req.body.type).slice(0, 60);
  const project = cleanText(req.body.project).slice(0, 180) || 'No Project';
  const date = cleanText(req.body.date).slice(0, 20) || new Date().toISOString().slice(0, 10);
  const title = cleanText(req.body.title).slice(0, 220);
  if (!type) return res.status(400).json({ error: 'Form type is required.' });
  const row = {
    id: nanoid(12),
    type,
    project,
    date,
    title: title || `${type} - ${date}`,
    createdAt: new Date().toISOString(),
    source: 'field-app'
  };
  const rows = readFormLogs();
  rows.push(row);
  writeFormLogs(rows);
  res.json({ ok: true, row });
});

app.get('/api/admin/form-logs', requireAdmin, (req, res) => {
  const rows = readFormLogs().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, rows });
});

app.patch('/api/admin/form-logs/:id', requireAdmin, (req, res) => {
  const rows = readFormLogs();
  const idx = rows.findIndex(x => String(x.id) === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Log not found.' });
  if (req.body && req.body.toggleTest) rows[idx].test = !rows[idx].test;
  if (req.body && typeof req.body.test === 'boolean') rows[idx].test = req.body.test;
  rows[idx].updatedAt = new Date().toISOString();
  writeFormLogs(rows);
  res.json({ ok: true, row: rows[idx] });
});

app.delete('/api/admin/form-logs', requireAdmin, (req, res) => {
  const rows = readFormLogs();
  let next = rows;
  if (req.query.testOnly === '1') next = rows.filter(x => !x.test);
  else if (req.query.project) next = rows.filter(x => String(x.project || 'No Project') !== String(req.query.project));
  else next = [];
  writeFormLogs(next);
  res.json({ ok: true, removed: rows.length - next.length });
});

app.delete('/api/admin/form-logs/:id', requireAdmin, (req, res) => {
  const rows = readFormLogs();
  const next = rows.filter(x => x.id !== req.params.id);
  writeFormLogs(next);
  res.json({ ok: true, removed: rows.length - next.length });
});


app.get('/api/workers', (req, res) => {
  const rows = readWorkers().filter(isWorkerActive);
  res.json({ ok: true, rows });
});

app.get('/api/admin/workers/export.csv', requireAdmin, (req, res) => {
  const headers = ['firstName','lastName','fullName','class','local','currentJob','status','employeeId','trade','crew','disabled'];
  const rows = readWorkers();
  const csv = [headers.join(',')].concat(rows.map(w => headers.map(h => csvCell(w[h])).join(','))).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="jagd-field-forms-workers.csv"');
  res.send(csv);
});

app.get('/api/admin/workers', requireAdmin, (req, res) => {
  res.json({ ok: true, rows: readWorkers() });
});

app.post('/api/admin/workers/restore-built-in', requireAdmin, (req, res) => {
  const seeded = seedWorkersFromPublic();
  if (!seeded.length) return res.status(400).json({ error: 'No built-in worker list found.' });
  writeWorkers(seeded);
  res.json({ ok: true, count: seeded.length, activeCount: seeded.filter(isWorkerActive).length, rows: seeded });
});

app.post('/api/admin/workers/import-csv', requireAdmin, (req, res) => {
  const csvText = String(req.body.csvText || '');
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) return res.status(400).json({ error: 'Paste a CSV with a header row and worker rows.' });
  const headers = parsed[0].map(normalizeHeader);
  const map = {}; headers.forEach((h, i) => { map[h] = i; });
  const rows = parsed.slice(1).map(r => {
    const firstName = pick(r, map, ['firstName', 'first name', 'First Name']);
    const lastName = pick(r, map, ['lastName', 'last name', 'Last Name']);
    const fullName = pick(r, map, ['fullName', 'full name', 'Employee', 'Name']) || `${firstName} ${lastName}`.trim();
    return {
      id: pick(r, map, ['employeeId', 'employee id', 'id']) || slug(fullName),
      firstName,
      lastName,
      fullName,
      class: pick(r, map, ['class', 'workerClass']),
      local: cleanLocalValue(pick(r, map, ['local', 'unionLocal'])),
      currentJob: pick(r, map, ['currentJob', 'current job', 'job']),
      status: pick(r, map, ['status']) || 'Active',
      employeeId: pick(r, map, ['employeeId', 'employee id']),
      trade: pick(r, map, ['trade']),
      crew: pick(r, map, ['crew']),
      disabled: false,
      updatedAt: new Date().toISOString()
    };
  }).filter(w => w.fullName);
  if (!rows.length) return res.status(400).json({ error: 'No valid workers found in the CSV.' });
  writeWorkers(rows);
  res.json({ ok: true, count: rows.length, activeCount: rows.filter(isWorkerActive).length, rows });
});

app.post('/api/admin/workers', requireAdmin, (req, res) => {
  const body = req.body || {};
  const rows = readWorkers();
  const id = cleanText(body.id) || nanoid(10);
  const idx = rows.findIndex(w => String(w.id) === id);
  const firstName = cleanText(body.firstName);
  const lastName = cleanText(body.lastName);
  const fullName = cleanText(body.fullName) || `${firstName} ${lastName}`.trim();
  if (!fullName) return res.status(400).json({ error: 'Worker full name is required.' });
  const worker = {
    ...(idx >= 0 ? rows[idx] : {}),
    id,
    firstName,
    lastName,
    fullName,
    class: cleanText(body.class),
    local: cleanLocalValue(body.local),
    currentJob: cleanText(body.currentJob),
    status: cleanText(body.status) || 'Active',
    employeeId: cleanText(body.employeeId),
    trade: cleanText(body.trade),
    crew: cleanText(body.crew),
    disabled: !!body.disabled,
    updatedAt: new Date().toISOString()
  };
  if (idx >= 0) rows[idx] = worker; else rows.push(worker);
  writeWorkers(rows);
  res.json({ ok: true, worker });
});

app.delete('/api/admin/workers/:id', requireAdmin, (req, res) => {
  const rows = readWorkers();
  const next = rows.map(w => String(w.id) === req.params.id ? { ...w, disabled: true, status: 'Disabled', updatedAt: new Date().toISOString() } : w);
  writeWorkers(next);
  res.json({ ok: true });
});

app.get('/api/materials', (req, res) => {
  const rows = readMaterials().filter(m => !m.disabled);
  res.json({ ok: true, rows });
});

app.get('/api/admin/materials', requireAdmin, (req, res) => {
  res.json({ ok: true, rows: readMaterials() });
});

app.post('/api/admin/materials', requireAdmin, (req, res) => {
  const body = req.body || {};
  const rows = readMaterials();
  const id = cleanText(body.id) || slug(`${body.project}-${body.prodName}-${body.batch}`) + '-' + nanoid(4);
  const idx = rows.findIndex(m => String(m.id) === id);
  const material = {
    ...(idx >= 0 ? rows[idx] : {}),
    id,
    project: cleanText(body.project),
    mfr: cleanText(body.mfr),
    prodName: cleanText(body.prodName),
    description: cleanText(body.description),
    color: cleanText(body.color),
    component: cleanText(body.component) || 'Base / Paint',
    itemNo: cleanText(body.itemNo),
    batch: cleanText(body.batch),
    mfgDate: cleanText(body.mfgDate),
    expDate: cleanText(body.expDate),
    shelfLife: cleanText(body.shelfLife),
    fileName: cleanText(body.fileName),
    disabled: !!body.disabled,
    updatedAt: new Date().toISOString()
  };
  material.label = cleanText(body.label) || makeMaterialLabel(material);
  if (!material.project) return res.status(400).json({ error: 'Project is required.' });
  if (!material.prodName && !material.description) return res.status(400).json({ error: 'Product name or description is required.' });
  if (idx >= 0) rows[idx] = material; else rows.push(material);
  writeMaterials(rows);
  res.json({ ok: true, material });
});



app.post('/api/admin/materials/import', requireAdmin, upload.array('coaFiles', 60), (req, res) => {
  const project = cleanText(req.body.project);
  if (!project) return res.status(400).json({ error: 'Project is required before importing COAs.' });
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'Choose at least one COA PDF.' });
  const rows = readMaterials();
  const added = [];
  files.forEach(file => {
    const original = cleanText(file.originalname || file.filename);
    const base = original.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim();
    const batchMatch = base.match(/([A-Z0-9]{5,})\s*$/i);
    const batch = batchMatch ? batchMatch[1] : '';
    const prodName = batch ? base.replace(new RegExp('\\s*' + batch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$','i'), '').trim() : base;
    const material = {
      id: slug(`${project}-${base}`) + '-' + nanoid(4),
      project,
      mfr: '',
      prodName: prodName || base,
      description: base,
      color: '',
      component: 'Base / Paint',
      itemNo: '',
      batch,
      mfgDate: '',
      expDate: '',
      shelfLife: '',
      fileName: original,
      uploadPath: `/uploads/${file.filename}`,
      disabled: true,
      needsReview: true,
      label: `${prodName || base}${batch ? ' — Batch ' + batch : ''} — NEEDS REVIEW`,
      updatedAt: new Date().toISOString(),
      importedAt: new Date().toISOString()
    };
    rows.push(material);
    added.push(material);
  });
  writeMaterials(rows);
  res.json({ ok: true, added });
});

app.delete('/api/admin/materials/:id', requireAdmin, (req, res) => {
  const rows = readMaterials();
  const next = rows.map(m => String(m.id) === req.params.id ? { ...m, disabled: true, updatedAt: new Date().toISOString() } : m);
  writeMaterials(next);
  res.json({ ok: true });
});

app.get('/api/submissions', (req, res) => {
  const type = req.query.type;
  const rows = readSubmissions()
    .filter(x => !type || x.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(rows.map(x => ({ id: x.id, type: x.type, title: x.title, createdAt: x.createdAt, project: x.data?.project || x.data?.jobName || '' })));
});

app.get('/api/submissions/:id', (req, res) => {
  const found = readSubmissions().find(x => x.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json(found);
});

app.post('/api/submissions', upload.array('photos', 24), (req, res) => {
  let data;
  try { data = JSON.parse(req.body.data || '{}'); }
  catch (e) { return res.status(400).json({ error: 'Invalid form data' }); }
  const type = req.body.type;
  if (!['pir', 'mewp'].includes(type)) return res.status(400).json({ error: 'Invalid form type' });

  const files = (req.files || []).map(f => ({
    originalName: f.originalname,
    filename: f.filename,
    url: `/uploads/${f.filename}`,
    size: f.size,
    mimetype: f.mimetype
  }));
  const id = nanoid(12);
  const title = formTitle(type, data);

  const record = { id, type, title, data, files, createdAt: new Date().toISOString() };
  const rows = readSubmissions();
  rows.push(record);
  writeSubmissions(rows);
  res.json({ ok: true, id, title, record });
});

app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found on this deployed server.', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: 'Server error while handling API request.' });
  }
  next(err);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`JAGD Field Forms running on ${PORT}`));
