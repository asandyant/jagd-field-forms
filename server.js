const vn84bRoutes = require('./routes/vn84b');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const https = require('https');



function coaAwsSha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function coaAwsHmac(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding);
}

function coaAwsAmzDate(date = new Date()) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function coaAwsSignedRequest({ service, region, host, method = 'POST', pathname = '/', headers = {}, body = Buffer.alloc(0) }) {
  return new Promise((resolve, reject) => {
    const accessKeyId = String(process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = String(process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    if (!accessKeyId || !secretAccessKey) return reject(new Error('AWS access keys are not configured in Render.'));
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ''), 'utf8');
    const now = new Date();
    const amzDate = coaAwsAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = coaAwsSha256Hex(bodyBuffer);
    const normalized = {};
    Object.entries(headers || {}).forEach(([key, value]) => { normalized[String(key).toLowerCase()] = String(value).trim().replace(/\s+/g, ' '); });
    normalized.host = host;
    normalized['x-amz-date'] = amzDate;
    normalized['x-amz-content-sha256'] = payloadHash;
    const signedHeaderNames = Object.keys(normalized).sort();
    const canonicalHeaders = signedHeaderNames.map(name => `${name}:${normalized[name]}\n`).join('');
    const canonicalRequest = [method.toUpperCase(), pathname, '', canonicalHeaders, signedHeaderNames.join(';'), payloadHash].join('\n');
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, coaAwsSha256Hex(canonicalRequest)].join('\n');
    const kDate = coaAwsHmac(Buffer.from(`AWS4${secretAccessKey}`, 'utf8'), dateStamp);
    const kRegion = coaAwsHmac(kDate, region);
    const kService = coaAwsHmac(kRegion, service);
    const kSigning = coaAwsHmac(kService, 'aws4_request');
    const signature = coaAwsHmac(kSigning, stringToSign, 'hex');
    normalized.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`;
    const request = https.request({ hostname: host, method: method.toUpperCase(), path: pathname, headers: normalized }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const responseBody = Buffer.concat(chunks);
        const text = responseBody.toString('utf8');
        if (response.statusCode >= 200 && response.statusCode < 300) return resolve({ statusCode: response.statusCode, body: responseBody, text });
        let message = text || `AWS request failed with status ${response.statusCode}.`;
        try { const parsed = JSON.parse(text); message = parsed.Message || parsed.message || parsed.__type || message; } catch (_) {}
        const error = new Error(message); error.statusCode = response.statusCode; reject(error);
      });
    });
    request.on('error', reject);
    if (bodyBuffer.length) request.write(bodyBuffer);
    request.end();
  });
}

function coaAwsTestPng() {
  // Normal-size valid PNG with readable text for Textract connection verification.
  return Buffer.from('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YIitre2vv/4qOInWRx99FBUVZbjMhx9+mGsZHV9f3zZt2oiUhE5ERISxL3Malt+urmlpaf369bt69apaFQJqWbJkCYNpA1AwD2FeM6dHk45Wq92wYcP06dNVac+sWbMOHjxowoqOjo4dOnRo3759kyZNqlevXrFiRRcXFycnp+Tk5MTExOjo6MjIyKtXr166dCk0NPT69euqtNa6AgMD33333Q0bNli7ITCkevXqS5cufe+993ItGR8f/8477xgYXm/btm262bRy1ahRo9mzZ4s3EjqbN2/u27evWrXlt6vrlClTQkNDTVixdu3avXv3btOmTe3atT08PFxdXe3s7BITE+Pj4+/evRsREREWFnb06FHVJwmAJJKSknbs2CFYuHjx4n379u3UqZOnp2e1atWKFy/u4uKi1WqTkpJiYmKio6MjIiKuXLly5syZsLAwC72FC8DiLDzxfQHw888/C+6rGzdumLmtW7du2djYmH/UatWqpcrffuLECRPaU7t27R9++OHp06fiG4qOjv7111/79u3r7OycqbaaNWsKVmLykUpLS3v27Nndu3dPnjy5YcOGyZMnN2/e3NbWxMfjq1evNmIX5xXxZ7zbtm1Ta6N5+W/HWOLTmfz444/Z1hAdHV2mTBmRGpycnC5evKhi4/P+aJpzKJOSkh49enT69OnVq1d3797dqEtKhQoVVGm/Nv9dXQ8dOmTC1gcNGnTq1CnBTdy5c2fBggWenp6ZKjl+/Lg5LbfKxSQvFax/X5Zw4MABkcbY2tpOnTr12bNngtWmpaWFhIRMnDjxlVdesejfVehPUSDv0WU0T61fv16rRieNmzdvnjhxwsxK0tPTP/zwQ6Pa4+rqumLFisuXL48fP7548eLiK5YvX37kyJEBAQHR0dHLly9v2LCh8e01nb29fbFixSpXrtyqVau333578eLFZ86ciYyMXLhwoYeHh7G1ffLJJ7wRlP/9/PPPZcuWFSn5+eefZ3tA33vvPcGRSOfOndugQQPj2leIODs7u7m5tWjR4v333w8ODj569Kibm5vgutHR0Q8fPlSlGfnq6vry5Utjh1GtUaPG0aNHt2/f3rJlS8FVqlSpMmXKlCtXruzdu7ddu3bGNxOSEnxw/f3333/99deCPfA1Go29vX3nzp2XLl0aERFx7dq1adOmlS9f3oxmAsg7BMK8oxWbIKt+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derUvn37TP8bTPXKK69YqOa3335bfLI1KFQ5Iu7u7g8ePMi1WERExBdffCFSYcmSJdeuXWuggLe399ixY1etWpVrVVevXp02bdrSpUtFtiuJOXPmCA48uHbt2ilTplSvXj2nApJcXbVa7bZt27Zt21anTp3evXu3adNGN9lp0aJF7ezskpKS4uLi7t69GxERERYWduzYsfDwcLP+DOQ/eXmpzCosLCwsLOyrr75ycXFp1apVo0aN6tevX6NGjUqVKrm5ubm4uDg4OCQlJT179uz27duXLl0KDg7ev3+/+ISi3t7etrY8hwDyIwKhavz9/dPT03MtZmNj899//4kPOZDVb7/9Nnz48FyLXbp06dy5c02bNjVcbNGiRSdPnjx58qSxzXj48OG6devWrVtn7IoFV8+ePX/55RdrtwKGpKenjxgxIjExUaTw8uXLPTw8DJf55ptvDh06dPPmzVxr++677/r169epUyeRTcugV69ebdq0CQ0NzbVkWlranDlzDFxMZLu6Xr9+3erjqUJmiYmJf/75559//qlutcOGDVO3QgBq4asa1QhOkNWlSxdz7lc0Gs3AgQOLFSsmUlKkk5WDg0NAQAC9OHLl5eW1c+dOR0dHazcEhsyfP19wiMXXX3/9rbfeyrVY0aJFN2zYkGnImWxptdpRo0YV+glajDJ37lzBkv7+/hERETl9ytUVKOg8PT0FuwwAyHsEQnWcPn1acDqykSNHmrmtIkWK+Pj4iJTcvHmzyHBzbm5uBw8erFmzppkNK8TGjBkTGBjIBEr53D///CM4lkm5cuVEOoLqtGnTZsqUKSIl79y58+mnnwpWKwMvLy/BR6bp6emzZs3K9iOurkAhsGDBAvqLAvkW/ziNYGNjk9NHggMeuLq6vv766+a3ZMSIESLFYmNj9+7dK1KyUqVKoaGhbdu2Na9dhVCRIkW+++67X375xcHBwdptgSEpKSlvv/224ID7P/30k5ubm3jls2fPbtKkiUjJtWvX5jpPnVTEHxJu3bo125fiuLoCBd3w4cP79+9v7VYAyBGBUJOQkCBYMqfugikpKb///rtIDT4+PkWLFhVtWc46duwoOJmP+NB8bm5uISEh7733nunNMoOBsG1FHTp0uHDhwieffGLthiB3M2bMEBxjY9SoUcbemjg4OPj7+zs5OYkUfu+992JjY42qvxBr3759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AAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBSBEIAAAAAkBSBEAAAAAAkRSAEAAAAAEkRCAEAAABAUgRCAAAAAJAUgRAAAAAAJEUgBAAAAABJEQgBAAAAQFIEQgAAAACQFIEQAAAAACRFIAQAAAAASREIAQAAAEBS/w82HDy/6eAJzAAAAABJRU5ErkJggg==', 'base64');
}

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const WEEKLY_MEETINGS_FILE = path.join(DATA_DIR, 'weekly-meetings.json');
const FORM_LOGS_FILE = path.join(DATA_DIR, 'form-logs.json');
const WORKERS_FILE = path.join(DATA_DIR, 'workers.json');
const WORKERS_VERSION_FILE = path.join(DATA_DIR, 'workers-source-version.json');
const JOBS_FILE = path.join(DATA_DIR, 'portal-jobs.json');
const BUILT_IN_WORKERS_VERSION_FILE = path.join(__dirname, 'public', 'data', 'active-workers-version.json');
const MATERIALS_FILE = path.join(DATA_DIR, 'materials.json');
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || 'Jagd123!!!';
const PORTAL_ACTIVE_WORKERS_URL = process.env.PORTAL_ACTIVE_WORKERS_URL || 'https://portal.jagdapps.com/api/forms/active-workers';
const PORTAL_JOBS_URL = process.env.PORTAL_JOBS_URL || 'https://portal.jagdapps.com/api/forms/jobs';
const PORTAL_SYNC_TOKEN = process.env.PORTAL_SYNC_TOKEN || process.env.FORMS_SYNC_TOKEN || '';
const PORTAL_WORKER_SYNC_TIMEOUT_MS = Number(process.env.PORTAL_WORKER_SYNC_TIMEOUT_MS || 4000);
const PORTAL_DWL_SUBMIT_URL = process.env.PORTAL_DWL_SUBMIT_URL || 'https://portal.jagdapps.com/api/forms/dwl/submit';
const PORTAL_DWL_SYNC_TIMEOUT_MS = Number(process.env.PORTAL_DWL_SYNC_TIMEOUT_MS || 6000);
const DWL_PORTAL_SYNC_LOG_FILE = path.join(DATA_DIR, 'dwl-portal-sync-log.json');
const PORTAL_BOL_SUBMIT_URL = process.env.PORTAL_BOL_SUBMIT_URL || 'https://portal.jagdapps.com/api/forms/bol/submit';
const PORTAL_BOL_SYNC_TIMEOUT_MS = Number(process.env.PORTAL_BOL_SYNC_TIMEOUT_MS || 6000);
const BOL_PORTAL_SYNC_LOG_FILE = path.join(DATA_DIR, 'bol-portal-sync-log.json');
const BOL_COUNTERS_FILE = path.join(DATA_DIR, 'bol-counters.json');
const BOL_INVENTORY_CACHE_FILE = path.join(DATA_DIR, 'bol-inventory-cache.json');
const DWL_LAST_CREWS_FILE = path.join(DATA_DIR, 'dwl-last-crews.json');
const PIR_LAST_SERIALS_FILE = path.join(DATA_DIR, 'pir-last-instrument-serials.json');
const DWL_GENERATED_PDF_DIR = path.join(DATA_DIR, 'dwl-generated-pdfs');
const TM_UPLOAD_DIR = path.join(DATA_DIR, 'tm-uploads');
const TM_RECORDS_FILE = path.join(DATA_DIR, 'tm-records.json');
const TM_PROJECTS_FILE = path.join(DATA_DIR, 'tm-projects.json');
const TM_DEFAULT_PROJECTS = [
  { id: 'BRX9579', contract: 'BRX9579', name: 'Boston Road', active: true },
  { id: 'D265495', contract: 'D265495', name: '8 Bridges', active: true },
  { id: 'D265307', contract: 'D265307', name: 'D265307', active: true },
  { id: 'D265343', contract: 'D265343', name: 'D265343', active: true },
  { id: 'HB1070MD', contract: 'HB1070MD', name: 'Macombs Dam Bridge', active: false }
];


fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DWL_GENERATED_PDF_DIR, { recursive: true });
fs.mkdirSync(TM_UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(TM_RECORDS_FILE)) fs.writeFileSync(TM_RECORDS_FILE, '[]');
if (!fs.existsSync(TM_PROJECTS_FILE)) {
  fs.writeFileSync(TM_PROJECTS_FILE, JSON.stringify(TM_DEFAULT_PROJECTS, null, 2));
} else {
  // Keep the persistent project list accurate after tracker updates.
  try {
    const existing = JSON.parse(fs.readFileSync(TM_PROJECTS_FILE, 'utf8'));
    if (Array.isArray(existing)) {
      const byId = new Map(existing.map(p => [String(p.id || p.contract || '').toUpperCase(), p]));
      byId.set('BRX9579', { ...(byId.get('BRX9579') || {}), id: 'BRX9579', contract: 'BRX9579', name: 'Boston Road', active: true });
      byId.set('D265495', { ...(byId.get('D265495') || {}), id: 'D265495', contract: 'D265495', name: '8 Bridges', active: true });
      fs.writeFileSync(TM_PROJECTS_FILE, JSON.stringify(Array.from(byId.values()), null, 2));
    }
  } catch (e) {
    console.error('Could not normalize T&M projects:', e.message);
  }
}
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');
if (!fs.existsSync(WEEKLY_MEETINGS_FILE)) fs.writeFileSync(WEEKLY_MEETINGS_FILE, '[]');
if (!fs.existsSync(FORM_LOGS_FILE)) fs.writeFileSync(FORM_LOGS_FILE, '[]');
if (!fs.existsSync(DWL_PORTAL_SYNC_LOG_FILE)) fs.writeFileSync(DWL_PORTAL_SYNC_LOG_FILE, '[]');
if (!fs.existsSync(BOL_PORTAL_SYNC_LOG_FILE)) fs.writeFileSync(BOL_PORTAL_SYNC_LOG_FILE, '[]');
if (!fs.existsSync(BOL_COUNTERS_FILE)) fs.writeFileSync(BOL_COUNTERS_FILE, '{}');
if (!fs.existsSync(BOL_INVENTORY_CACHE_FILE)) fs.writeFileSync(BOL_INVENTORY_CACHE_FILE, JSON.stringify({ items: [], savedAt: '' }, null, 2));
if (!fs.existsSync(DWL_LAST_CREWS_FILE)) fs.writeFileSync(DWL_LAST_CREWS_FILE, '{}');
if (!fs.existsSync(PIR_LAST_SERIALS_FILE)) fs.writeFileSync(PIR_LAST_SERIALS_FILE, '{}');
if (!fs.existsSync(WORKERS_FILE)) {
  const seed = path.join(__dirname, 'public', 'data', 'active-workers.json');
  fs.writeFileSync(WORKERS_FILE, fs.existsSync(seed) ? fs.readFileSync(seed, 'utf8') : '[]');
}
if (!fs.existsSync(JOBS_FILE)) fs.writeFileSync(JOBS_FILE, '[]');
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
const tmStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TM_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = String(file.originalname || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${nanoid(8)}-${safe}`);
  }
});
const tmUpload = multer({
  storage: tmStorage,
  limits: { fileSize: 15 * 1024 * 1024, files: 24 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || String(file.mimetype || '').startsWith('image/');
    cb(ok ? null : new Error('Only images and PDF files are allowed.'), ok);
  }
});

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

function mergeWorkersByName(primaryRows, fallbackRows) {
  const out = [];
  const seen = new Set();
  const add = (w) => {
    if (!w) return;
    const fullName = cleanText(w.fullName || `${w.firstName || ''} ${w.lastName || ''}`.trim());
    const key = normalizeNameKey(fullName);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ ...w, fullName });
  };
  (Array.isArray(primaryRows) ? primaryRows : []).forEach(add);
  (Array.isArray(fallbackRows) ? fallbackRows : []).forEach(add);
  return ensureRequiredDwlWorkers(normalizeWorkerRows(out)).rows;
}

async function fetchPortalActiveWorkers() {
  if (!PORTAL_ACTIVE_WORKERS_URL) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PORTAL_WORKER_SYNC_TIMEOUT_MS);
  try {
    const headers = { Accept: 'application/json' };
    if (PORTAL_SYNC_TOKEN) headers['X-Forms-Sync-Token'] = PORTAL_SYNC_TOKEN;
    const res = await fetch(PORTAL_ACTIVE_WORKERS_URL, { headers, signal: controller.signal });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error || `Portal workers returned HTTP ${res.status}`);
    const rows = Array.isArray(json.rows) ? json.rows : (Array.isArray(json) ? json : []);
    return normalizeWorkerRows(rows).filter(isWorkerActive);
  } finally {
    clearTimeout(timer);
  }
}


function normalizeJobRows(rows = []) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : [])
    .map(row => cleanText(typeof row === 'string' ? row : (row.name || row.jobName || row.project || '')))
    .filter(name => name && !['Other'].includes(name))
    .filter(name => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}
function readCachedJobs() {
  try {
    const rows = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    return normalizeJobRows(rows);
  } catch (e) {
    return [];
  }
}
function writeCachedJobs(rows = []) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(normalizeJobRows(rows), null, 2));
}
async function fetchPortalJobs() {
  if (!PORTAL_JOBS_URL) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PORTAL_WORKER_SYNC_TIMEOUT_MS);
  try {
    const headers = { Accept: 'application/json' };
    if (PORTAL_SYNC_TOKEN) headers['X-Forms-Sync-Token'] = PORTAL_SYNC_TOKEN;
    const res = await fetch(PORTAL_JOBS_URL, { headers, signal: controller.signal });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error || `Portal jobs returned HTTP ${res.status}`);
    const rows = Array.isArray(json.rows) ? json.rows : (Array.isArray(json) ? json : []);
    return normalizeJobRows(rows);
  } finally {
    clearTimeout(timer);
  }
}
async function readJobsWithPortalSync() {
  try {
    const portalRows = await fetchPortalJobs();
    if (portalRows.length) {
      writeCachedJobs(portalRows);
      return { rows: portalRows, source: 'portal-live', portalCount: portalRows.length };
    }
  } catch (err) {
    console.warn('Portal job sync unavailable; using Field Forms cached job list:', err.message || err);
  }
  const cached = readCachedJobs();
  return { rows: cached, source: cached.length ? 'forms-cache' : 'forms-static', portalCount: 0 };
}

async function readWorkersWithPortalSync() {
  const localRows = readWorkers().filter(isWorkerActive);
  try {
    const portalRows = await fetchPortalActiveWorkers();
    if (portalRows.length) {
      // Portal is now the source of truth for DWL names/class/local/job.
      // Do not merge cached/static rows over portal rows or old class/local values can show in Forms.
      const freshPortalRows = normalizeWorkerRows(portalRows).filter(isWorkerActive);
      writeWorkers(freshPortalRows);
      return { rows: freshPortalRows, source: 'portal-live', portalCount: freshPortalRows.length };
    }
  } catch (err) {
    console.warn('Portal worker sync unavailable; using Field Forms cached worker list:', err.message || err);
  }
  return { rows: localRows, source: 'forms-cache', portalCount: 0 };
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

function cleanLocalValue(v) {
  let s = String(v || '').trim();
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  return s;
}

const REQUIRED_DWL_WORKERS = [
  { firstName: 'Michael', lastName: 'Valenti', fullName: 'Michael Valenti', class: 'JM', local: '806', currentJob: 'GWB Cables', status: 'Active', trade: 'Painter' },
  { firstName: 'Daniel', lastName: 'Amorim', fullName: 'Daniel Amorim', class: '', local: '', currentJob: '', status: 'Active', trade: 'Painter' }
];

function normalizeNameKey(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function ensureRequiredDwlWorkers(rows) {
  const next = Array.isArray(rows) ? rows.map(w => ({ ...w, local: cleanLocalValue(w.local) })) : [];
  let changed = false;
  const byName = new Map();
  next.forEach((w, idx) => {
    const fullName = cleanText(w.fullName || `${w.firstName || ''} ${w.lastName || ''}`.trim());
    if (fullName && !w.fullName) { w.fullName = fullName; changed = true; }
    const key = normalizeNameKey(fullName);
    if (key && !byName.has(key)) byName.set(key, idx);
  });

  for (const required of REQUIRED_DWL_WORKERS) {
    const key = normalizeNameKey(required.fullName);
    const idx = byName.get(key);
    if (idx === undefined) {
      next.push({
        id: slug(required.fullName),
        firstName: required.firstName,
        lastName: required.lastName,
        fullName: required.fullName,
        class: required.class || '',
        local: cleanLocalValue(required.local),
        currentJob: required.currentJob || '',
        status: required.status || 'Active',
        employeeId: required.employeeId || '',
        trade: required.trade || '',
        crew: required.crew || '',
        disabled: false,
        updatedAt: new Date().toISOString(),
        protectedWorker: true
      });
      byName.set(key, next.length - 1);
      changed = true;
      continue;
    }

    const w = next[idx];
    let touched = false;
    if (w.disabled) { w.disabled = false; touched = true; }
    if (!w.status || /inactive|disabled|terminated/i.test(String(w.status))) { w.status = 'Active'; touched = true; }
    for (const field of ['firstName','lastName','fullName','class','local','currentJob','trade']) {
      if (!String(w[field] || '').trim() && String(required[field] || '').trim()) {
        w[field] = field === 'local' ? cleanLocalValue(required[field]) : required[field];
        touched = true;
      }
    }
    if (touched) {
      w.updatedAt = new Date().toISOString();
      changed = true;
    }
  }
  return { rows: next, changed };
}

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

function readDwlPortalSyncLog() {
  try {
    const rows = JSON.parse(fs.readFileSync(DWL_PORTAL_SYNC_LOG_FILE, 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}
function writeDwlPortalSyncLog(rows) {
  fs.writeFileSync(DWL_PORTAL_SYNC_LOG_FILE, JSON.stringify(Array.isArray(rows) ? rows.slice(-1000) : [], null, 2));
}

function readBolPortalSyncLog() {
  try {
    const rows = JSON.parse(fs.readFileSync(BOL_PORTAL_SYNC_LOG_FILE, 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}
function writeBolPortalSyncLog(rows) {
  fs.writeFileSync(BOL_PORTAL_SYNC_LOG_FILE, JSON.stringify(Array.isArray(rows) ? rows.slice(-1000) : [], null, 2));
}
function readBolCounters() {
  try {
    const data = JSON.parse(fs.readFileSync(BOL_COUNTERS_FILE, 'utf8'));
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    return {};
  }
}
function writeBolCounters(data) {
  fs.writeFileSync(BOL_COUNTERS_FILE, JSON.stringify(data && typeof data === 'object' ? data : {}, null, 2));
}
function nextBolNumber(dateValue = '') {
  const raw = String(dateValue || '').trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
  const key = date.replace(/-/g, '');
  const counters = readBolCounters();
  counters[key] = Number(counters[key] || 0) + 1;
  writeBolCounters(counters);
  return `BOL-${key}-${String(counters[key]).padStart(3, '0')}`;
}
function bolCleanText(v, max = 500) {
  return String(v || '').trim().slice(0, max);
}
function bolSyncIdFor(data = {}) {
  const seed = [data.bolNumber, data.date, data.toJob, data.fromLocation, Date.now(), nanoid(5)].join('|');
  return `forms-bol-${slug(seed).slice(0, 30)}-${nanoid(6)}`;
}
async function postBolToPortal(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PORTAL_BOL_SYNC_TIMEOUT_MS);
  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (PORTAL_SYNC_TOKEN) headers['x-forms-sync-token'] = PORTAL_SYNC_TOKEN;
    const res = await fetch(PORTAL_BOL_SUBMIT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text.slice(0, 250) }; }
    if (!res.ok) throw new Error(json.error || json.raw || `Portal returned ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}
function dwlSyncCleanText(v, max = 500) {
  return String(v || '').trim().slice(0, max);
}
function dwlSyncWeekEndingSaturdayIso(value = '') {
  const text = dwlSyncCleanText(value, 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const d = new Date(`${text}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d.toISOString().slice(0, 10);
}
function dwlSyncIdFor(data = {}, title = '') {
  const seed = [data.reportDate, data.project, data.crew, data.foreman, data.printName, title, Date.now(), nanoid(5)].join('|');
  return `forms-dwl-${slug(seed).slice(0, 30)}-${nanoid(6)}`;
}
function dwlDownloadSafeFileName(value = '') {
  const cleaned = String(value || '')
    .replace(/\.pdf$/i, '')
    .replace(/[\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return `${cleaned || 'JAGD DWL'}.pdf`;
}
function cleanupOldGeneratedDwlPdfs() {
  try {
    const cutoff = Date.now() - (3 * 24 * 60 * 60 * 1000);
    for (const file of fs.readdirSync(DWL_GENERATED_PDF_DIR)) {
      const full = path.join(DWL_GENERATED_PDF_DIR, file);
      const stat = fs.statSync(full);
      if (stat.isFile() && stat.mtimeMs < cutoff) fs.unlinkSync(full);
    }
  } catch (e) {}
}
async function postDwlToPortal(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PORTAL_DWL_SYNC_TIMEOUT_MS);
  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (PORTAL_SYNC_TOKEN) headers['x-forms-sync-token'] = PORTAL_SYNC_TOKEN;
    const res = await fetch(PORTAL_DWL_SUBMIT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text.slice(0, 250) }; }
    if (!res.ok) throw new Error(json.error || json.raw || `Portal returned ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}
function requireAdmin(req, res, next) {
  const supplied = req.get('x-admin-pin') || req.query.pin || '';
  if (supplied !== ADMIN_PIN) return res.status(401).json({ error: 'Admin PIN required.' });
  next();
}


function readTmRows() {
  try { const rows = JSON.parse(fs.readFileSync(TM_RECORDS_FILE, 'utf8')); return Array.isArray(rows) ? rows : []; }
  catch (e) { return []; }
}
function writeTmRows(rows) { fs.writeFileSync(TM_RECORDS_FILE, JSON.stringify(rows, null, 2)); }
function readTmProjects() {
  try { const rows = JSON.parse(fs.readFileSync(TM_PROJECTS_FILE, 'utf8')); return Array.isArray(rows) ? rows : TM_DEFAULT_PROJECTS; }
  catch (e) { return TM_DEFAULT_PROJECTS; }
}
function writeTmProjects(rows) { fs.writeFileSync(TM_PROJECTS_FILE, JSON.stringify(rows, null, 2)); }
function tmMoney(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0; }
function tmMonthFromDate(v) { const m = String(v || '').match(/^(\d{4}-\d{2})-\d{2}$/); return m ? m[1] : ''; }
function tmProjectLabel(p) { return p ? `${p.contract}${p.name && p.name !== p.contract ? ` - ${p.name}` : ''}` : ''; }
function tmFileHash(filePath) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}
function tmSafeRecordForPublic(record) {
  return { ok: true, id: record.id, project: record.projectLabel, category: record.category, attachmentCount: record.files.length, createdAt: record.createdAt };
}

app.get('/api/tm/projects', (req, res) => {
  res.json({ rows: readTmProjects().filter(p => p.active).map(p => ({ id: p.id, contract: p.contract, name: p.name })) });
});

app.post('/api/tm/submissions', tmUpload.array('files', 24), (req, res) => {
  const cleanup = () => (req.files || []).forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
  let data = {};
  try { data = JSON.parse(req.body.data || '{}'); } catch (e) { cleanup(); return res.status(400).json({ error: 'Invalid submission data.' }); }
  const files = req.files || [];
  const projectId = cleanText(data.projectId);
  const projects = readTmProjects();
  let project = projects.find(p => p.id === projectId);
  const customContract = cleanText(data.customContract);
  const customName = cleanText(data.customName);
  const isCustom = projectId === 'CUSTOM';
  if (isCustom) {
    if (!customContract) { cleanup(); return res.status(400).json({ error: 'Enter the custom contract number or job name.' }); }
    const id = `CUSTOM-${nanoid(8)}`;
    project = { id, contract: customContract, name: customName || customContract, active: false, custom: true, createdAt: new Date().toISOString() };
    projects.push(project); writeTmProjects(projects);
  }
  if (!project) { cleanup(); return res.status(400).json({ error: 'Choose a valid project.' }); }
  if (!files.length) return res.status(400).json({ error: 'Add at least one receipt photo or PDF.' });
  const now = new Date();
  const transactionDate = now.toISOString().slice(0, 10);
  const billingMonth = transactionDate.slice(0, 7);
  const category = cleanText(data.category);
  if (!['Material', 'Equipment'].includes(category)) { cleanup(); return res.status(400).json({ error: 'Choose Material or Equipment.' }); }
  const vendor = '', description = '', submitter = 'Field Submission', purchaser = '';
  const fileRows = files.map(f => ({ originalName: f.originalname, filename: f.filename, size: f.size, mimetype: f.mimetype, hash: tmFileHash(f.path) }));
  const existing = readTmRows();
  const exactDuplicateIds = [...new Set(fileRows.flatMap(f => existing.filter(r => (r.files || []).some(old => old.hash === f.hash)).map(r => r.id)))];
  const amount = tmMoney(data.amount);
  const likelyDuplicateIds = [];
  const id = `${String(project.contract || 'TM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}-${billingMonth.replace('-', '')}-${nanoid(6).toUpperCase()}`;
  const record = {
    id, projectId: project.id, projectLabel: tmProjectLabel(project), customJob: !!project.custom,
    type: cleanText(data.type) || 'Receipt / Materials', vendor, transactionDate, billingMonth, amount,
    description, category: cleanText(data.category) || 'Other', paymentMethod: cleanText(data.paymentMethod) || 'Unknown',
    purchaser: purchaser || submitter, submitter, status: project.custom ? 'Missing Information' : 'New',
    notes: '', exactDuplicateIds, likelyDuplicateIds, files: fileRows,
    rental: data.rental && typeof data.rental === 'object' ? data.rental : null,
    owned: data.owned && typeof data.owned === 'object' ? data.owned : null,
    history: [{ action: 'Submitted', by: submitter, at: new Date().toISOString() }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  existing.push(record); writeTmRows(existing);
  res.json(tmSafeRecordForPublic(record));
});

app.get('/api/admin/tm/records', requireAdmin, (req, res) => {
  const projectId = cleanText(req.query.projectId), month = cleanText(req.query.month), status = cleanText(req.query.status);
  const rows = readTmRows().filter(r => (!projectId || r.projectId === projectId) && (!month || r.billingMonth === month) && (!status || r.status === status)).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  res.json({ rows });
});
app.get('/api/admin/tm/projects', requireAdmin, (req, res) => res.json({ rows: readTmProjects() }));
app.post('/api/admin/tm/projects', requireAdmin, (req, res) => {
  const contract = cleanText(req.body.contract), name = cleanText(req.body.name), active = req.body.active !== false;
  if (!contract || !name) return res.status(400).json({ error: 'Contract and job name are required.' });
  const rows = readTmProjects();
  if (rows.some(p => String(p.contract).toLowerCase() === contract.toLowerCase())) return res.status(409).json({ error: 'That contract already exists.' });
  const row = { id: contract.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || nanoid(8), contract, name, active, createdAt: new Date().toISOString() };
  rows.push(row); writeTmProjects(rows); res.json({ ok: true, row });
});
app.patch('/api/admin/tm/projects/:id', requireAdmin, (req, res) => {
  const rows = readTmProjects(), row = rows.find(p => p.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Project not found.' });
  if (req.body.active !== undefined) row.active = !!req.body.active;
  if (cleanText(req.body.contract)) row.contract = cleanText(req.body.contract);
  if (cleanText(req.body.name)) row.name = cleanText(req.body.name);
  writeTmProjects(rows); res.json({ ok: true, row });
});
app.patch('/api/admin/tm/records/:id', requireAdmin, (req, res) => {
  const rows = readTmRows(), row = rows.find(r => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Record not found.' });
  const allowed = ['projectId','billingMonth','vendor','transactionDate','amount','description','category','paymentMethod','purchaser','status','notes'];
  const before = {}; allowed.forEach(k => { if (req.body[k] !== undefined) { before[k] = row[k]; row[k] = k === 'amount' ? tmMoney(req.body[k]) : cleanText(req.body[k]); } });
  if (req.body.projectId) { const p = readTmProjects().find(x => x.id === row.projectId); if (p) { row.projectLabel = tmProjectLabel(p); row.customJob = !!p.custom; } }
  row.updatedAt = new Date().toISOString(); row.history = Array.isArray(row.history) ? row.history : [];
  row.history.push({ action:'Office update', before, after:Object.fromEntries(Object.keys(before).map(k=>[k,row[k]])), by:'Office/Admin', at:row.updatedAt });
  writeTmRows(rows); res.json({ ok:true,row });
});
app.post('/api/admin/tm/rentals/carry-forward', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(cleanText) : [], targetMonth = cleanText(req.body.targetMonth);
  if (!/^\d{4}-\d{2}$/.test(targetMonth) || !ids.length) return res.status(400).json({ error:'Select rentals and a target month.' });
  const rows = readTmRows(), made=[];
  ids.forEach(id => { const src = rows.find(r => r.id === id && r.type === 'Rental'); if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)); copy.id = `${String(src.projectId).replace(/[^a-zA-Z0-9]/g,'').slice(0,10)}-${targetMonth.replace('-','')}-${nanoid(6).toUpperCase()}`;
    copy.billingMonth=targetMonth; copy.transactionDate=`${targetMonth}-01`; copy.amount=0; copy.status='Missing Information'; copy.files=[];
    copy.description=`${src.description} - carried forward from ${src.billingMonth}`; copy.carriedFrom=src.id; copy.createdAt=new Date().toISOString(); copy.updatedAt=copy.createdAt;
    copy.history=[{action:'Rental carried forward',from:src.id,by:'Office/Admin',at:copy.createdAt}]; rows.push(copy); made.push(copy);
  }); writeTmRows(rows); res.json({ok:true,rows:made});
});
app.get('/api/admin/tm/files/:filename', requireAdmin, (req, res) => {
  const safe = path.basename(req.params.filename); const full = path.join(TM_UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) return res.status(404).json({ error:'File not found.' });
  res.sendFile(full);
});

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
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const meeting = readWeeklyMeetings().find(x => x.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
  res.json({ ok: true, meeting });
});

app.post('/api/weekly-meetings/:id/sign', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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
  meeting.updatedAt = new Date().toISOString();
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


app.post('/api/dwl/generated-pdf', (req, res) => {
  try {
    cleanupOldGeneratedDwlPdfs();
    const fileName = dwlDownloadSafeFileName(req.body?.fileName || 'JAGD DWL.pdf');
    const pdfBase64 = String(req.body?.pdfBase64 || '').replace(/^data:application\/pdf;?base64,/i, '');
    if (!pdfBase64) return res.status(400).json({ ok: false, error: 'PDF data missing.' });
    const buffer = Buffer.from(pdfBase64, 'base64');
    if (!buffer.length || buffer.length > 20 * 1024 * 1024) return res.status(400).json({ ok: false, error: 'PDF is empty or too large.' });
    if (buffer.slice(0, 4).toString() !== '%PDF') return res.status(400).json({ ok: false, error: 'Generated file was not a valid PDF.' });
    const id = `${Date.now()}-${nanoid(10)}`;
    const stored = `${id}.pdf`;
    fs.writeFileSync(path.join(DWL_GENERATED_PDF_DIR, stored), buffer);
    res.json({ ok: true, id, fileName, downloadUrl: `/api/dwl/generated-pdf/${encodeURIComponent(id)}/download?name=${encodeURIComponent(fileName)}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Unable to prepare named PDF download.' });
  }
});

app.get('/api/dwl/generated-pdf/:id/download', (req, res) => {
  try {
    const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(DWL_GENERATED_PDF_DIR, `${id}.pdf`);
    if (!id || !fs.existsSync(filePath)) return res.status(404).send('PDF not found. Please save the DWL again.');
    const fileName = dwlDownloadSafeFileName(req.query.name || 'JAGD DWL.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '')}"`);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).send('Unable to download PDF.');
  }
});


function reusableKey(v){ return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }
app.get('/api/dwl/last-crew', (req,res)=>{
  const project=String(req.query.project||'').trim(), crew=String(req.query.crew||'').trim();
  if(!project || !crew) return res.status(400).json({ok:false,error:'Project and crew are required.'});
  const all=readJsonSafe(DWL_LAST_CREWS_FILE,{}), row=all[`${reusableKey(project)}|${reusableKey(crew)}`]||null;
  res.json({ok:true,names:Array.isArray(row?.names)?row.names:[],savedAt:row?.savedAt||''});
});
app.post('/api/dwl/last-crew', (req,res)=>{
  const project=String(req.body?.project||'').trim(), crew=String(req.body?.crew||'').trim();
  const names=Array.isArray(req.body?.names)?req.body.names.map(v=>String(v||'').trim()).filter(Boolean).slice(0,40):[];
  if(!project || !crew || !names.length) return res.status(400).json({ok:false,error:'Project, crew, and names are required.'});
  const all=readJsonSafe(DWL_LAST_CREWS_FILE,{}); all[`${reusableKey(project)}|${reusableKey(crew)}`]={project,crew,names,savedAt:new Date().toISOString()}; writeJsonSafe(DWL_LAST_CREWS_FILE,all);
  res.json({ok:true,count:names.length});
});
app.get('/api/pir/last-instrument-serials', (req,res)=>{
  const saved=readJsonSafe(PIR_LAST_SERIALS_FILE,{}); res.json({ok:true,...saved});
});
app.post('/api/pir/last-instrument-serials', (req,res)=>{
  const serials=Array.isArray(req.body?.serials)?req.body.serials.map(v=>String(v||'').trim()).slice(0,20):[];
  if(!serials.some(Boolean)) return res.status(400).json({ok:false,error:'At least one serial number is required.'});
  const saved={serials,project:String(req.body?.project||'').trim(),reportDate:String(req.body?.reportDate||'').trim(),savedAt:new Date().toISOString()}; writeJsonSafe(PIR_LAST_SERIALS_FILE,saved); res.json({ok:true});
});

app.post('/api/dwl/portal-sync', async (req, res) => {
  const data = req.body && typeof req.body.data === 'object' ? req.body.data : {};
  const title = dwlSyncCleanText(req.body?.title || req.body?.sourceFileName || '', 220);
  const syncId = dwlSyncCleanText(req.body?.syncId || '', 120) || dwlSyncIdFor(data, title);
  const project = dwlSyncCleanText(data.project || 'No Project', 180) || 'No Project';
  const reportDate = dwlSyncCleanText(data.reportDate || new Date().toISOString().slice(0, 10), 30);
  const crew = dwlSyncCleanText(data.crew || '', 80);
  const logRow = {
    id: syncId,
    syncId,
    project,
    reportDate,
    crew,
    weekEnding: dwlSyncWeekEndingSaturdayIso(reportDate),
    title,
    sourceFileName: title ? `${title.replace(/\.pdf$/i, '')}.pdf` : '',
    status: 'pending',
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: ''
  };
  const payload = {
    syncId,
    sourceApp: 'jagd-field-forms',
    sourceFileName: logRow.sourceFileName,
    submittedAt: new Date().toISOString(),
    data: {
      ...data,
      project,
      reportDate,
      crew,
      sourceFileName: logRow.sourceFileName,
      submittedAt: new Date().toISOString()
    }
  };
  const rows = readDwlPortalSyncLog();
  rows.push(logRow);
  try {
    const portal = await postDwlToPortal(payload);
    logRow.status = 'synced';
    logRow.portalId = portal.id || '';
    logRow.portalWeekEnding = portal.weekEnding || logRow.weekEnding;
    logRow.syncedAt = new Date().toISOString();
    logRow.updatedAt = logRow.syncedAt;
    writeDwlPortalSyncLog(rows);
    res.json({ ok: true, status: 'synced', id: syncId, portalId: logRow.portalId, weekEnding: logRow.portalWeekEnding });
  } catch (err) {
    logRow.status = 'failed';
    logRow.error = err.message || 'Portal sync failed';
    logRow.updatedAt = new Date().toISOString();
    writeDwlPortalSyncLog(rows);
    res.status(202).json({ ok: false, status: 'failed', id: syncId, error: logRow.error, manualUploadNeeded: true, message: `${dateToDisplay(reportDate)} DWL failed to import to portal. Office may need manual upload.` });
  }
});


app.get('/api/jobs', async (req, res) => {
  try {
    const result = await readJobsWithPortalSync();
    res.json({ ok: true, generatedAt: new Date().toISOString(), ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Job list unavailable', rows: [] });
  }
});


app.get('/api/bol/next-number', (req, res) => {
  const bolNumber = nextBolNumber(req.query.date || req.query.bolDate || '');
  res.json({ ok: true, bolNumber });
});

app.get('/api/bol/inventory-items', async (req, res) => {
  const cached = readJsonSafe(BOL_INVENTORY_CACHE_FILE, { items: [], savedAt: '' });
  const cachedItems = Array.isArray(cached?.items) ? cached.items : [];
  try {
    const baseUrl = new URL(PORTAL_BOL_SUBMIT_URL);
    const invUrl = `${baseUrl.origin}/api/forms/inventory/items`;
    const controller = new AbortController();
    const timeoutMs = Math.max(15000, Math.min(Number(process.env.PORTAL_BOL_INVENTORY_TIMEOUT_MS || 25000), 45000));
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers = { Accept: 'application/json' };
    if (PORTAL_SYNC_TOKEN) headers['x-forms-sync-token'] = PORTAL_SYNC_TOKEN;
    let r;
    try {
      r = await fetch(invUrl, { headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const json = await r.json().catch(() => ({}));
    if (!r.ok || !json.ok) throw new Error(json.error || `Portal inventory unavailable (${r.status})`);
    const isCompanyStockLocation = (location = '') => ['warehouse', 'main yard', 'shop', 'other'].includes(String(location || 'Warehouse').trim().toLowerCase());
    const isPositiveStock = (row = {}) => Number(row.quantity || 0) > 0;
    let items=[];
    if (Array.isArray(json.items)) {
      items = json.items.filter(row => isCompanyStockLocation(row.location) && isPositiveStock(row));
    } else {
      const seen = new Map();
      const add = (row) => {
        const item = bolCleanText(row.item || row.product || '', 180);
        const unit = bolCleanText(row.unit || '', 40);
        if (!item) return;
        const location = bolCleanText(row.location || 'Warehouse', 180);
        const key = `${item.toLowerCase()}|${unit.toLowerCase()}|${location.toLowerCase()}`;
        if (!seen.has(key)) seen.set(key, { item, unit, location, quantity: row.quantity || 0, sku: row.sku || '', aliases: row.aliases || [] });
      };
      (Array.isArray(json.warehouse) ? json.warehouse : []).filter(isPositiveStock).forEach(add);
      items = Array.from(seen.values()).filter(row => isCompanyStockLocation(row.location) && isPositiveStock(row)).sort((a,b)=>String(a.item).localeCompare(String(b.item)) || String(a.location).localeCompare(String(b.location)));
    }
    writeJsonSafe(BOL_INVENTORY_CACHE_FILE, { items, savedAt: new Date().toISOString() });
    return res.json({ ok: true, items, source: 'portal', cached: false });
  } catch (err) {
    if (cachedItems.length) {
      return res.json({ ok: true, items: cachedItems, source: 'cache', cached: true, savedAt: cached?.savedAt || '', warning: err.message || 'Portal inventory unavailable' });
    }
    return res.status(503).json({ ok: false, items: [], error: err.message || 'Could not load inventory items' });
  }
});

app.post('/api/bol/portal-sync', async (req, res) => {
  const data = req.body && typeof req.body.data === 'object' ? req.body.data : {};
  const bolNumber = bolCleanText(data.bolNumber || req.body?.bolNumber || '', 80) || nextBolNumber(data.date || '');
  const syncId = bolCleanText(req.body?.syncId || '', 120) || bolSyncIdFor({ ...data, bolNumber });
  const date = bolCleanText(data.date || new Date().toISOString().slice(0, 10), 30);
  const fromLocation = bolCleanText(data.fromLocation || '', 120);
  const toJob = bolCleanText(data.toJob || data.project || 'No Job', 180) || 'No Job';
  const status = bolCleanText(data.status || '', 40) || (data.receivedBy || data.receivedBySignatureData ? 'Received' : 'In Transit');
  const logRow = {
    id: syncId,
    syncId,
    bolNumber,
    date,
    fromLocation,
    toJob,
    status: 'pending',
    bolStatus: status,
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: ''
  };
  const payload = {
    syncId,
    sourceApp: 'jagd-field-forms',
    submittedAt: new Date().toISOString(),
    data: {
      ...data,
      bolNumber,
      date,
      fromLocation,
      toJob,
      status,
      submittedAt: new Date().toISOString()
    }
  };
  const rows = readBolPortalSyncLog();
  rows.push(logRow);
  try {
    const portal = await postBolToPortal(payload);
    logRow.status = 'synced';
    logRow.portalId = portal.id || '';
    logRow.syncedAt = new Date().toISOString();
    logRow.updatedAt = logRow.syncedAt;
    writeBolPortalSyncLog(rows);
    res.json({ ok: true, status: 'synced', id: syncId, portalId: logRow.portalId, bolNumber });
  } catch (err) {
    logRow.status = 'failed';
    logRow.error = err.message || 'Portal BOL sync failed';
    logRow.updatedAt = new Date().toISOString();
    writeBolPortalSyncLog(rows);
    res.status(202).json({ ok: false, status: 'failed', id: syncId, bolNumber, error: logRow.error, manualUploadNeeded: true, message: `${dateToDisplay(date)} BOL failed to import to portal. Office may need manual entry.` });
  }
});

app.get('/api/admin/bol-portal-sync-log', requireAdmin, (req, res) => {
  const rows = readBolPortalSyncLog().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json({ ok: true, rows });
});

app.get('/api/admin/dwl-portal-sync-log', requireAdmin, (req, res) => {
  const rows = readDwlPortalSyncLog().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json({ ok: true, rows });
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


app.get('/api/workers', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const result = await readWorkersWithPortalSync();
  res.json({ ok: true, rows: result.rows, source: result.source, portalCount: result.portalCount, generatedAt: new Date().toISOString() });
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





app.post('/api/admin/materials/aws-test', requireAdmin, async (req, res) => {
  const region = String(process.env.AWS_REGION || 'us-east-1').trim() || 'us-east-1';
  const configured = {
    accessKeyId: !!String(process.env.AWS_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: !!String(process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    region
  };
  if (!configured.accessKeyId || !configured.secretAccessKey) {
    return res.status(500).json({ ok: false, configured, error: 'AWS Forms credentials are not configured in Render.' });
  }
  try {
    const host = `textract.${region}.amazonaws.com`;
    const body = Buffer.from(JSON.stringify({ Document: { Bytes: coaAwsTestPng().toString('base64') }, FeatureTypes: ['TABLES', 'FORMS'] }), 'utf8');
    const response = await coaAwsSignedRequest({
      service: 'textract', region, host, method: 'POST', pathname: '/',
      headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': 'Textract.AnalyzeDocument' }, body
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ok: true, region, message: `AWS Textract connection verified in ${region}.`, pages: Number(parsed?.DocumentMetadata?.Pages || 0), blocks: Array.isArray(parsed?.Blocks) ? parsed.Blocks.length : 0 });
  } catch (err) {
    return res.status(502).json({ ok: false, region, error: err.message || 'Textract connection failed.' });
  }
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

app.get('/api/mewp/next-file-title', (req, res) => {
  const date = cleanText(req.query.date).slice(0, 20);
  const serial = cleanText(req.query.serial).slice(0, 120);
  const baseTitle = cleanText(req.query.baseTitle).slice(0, 220);
  if (!date || !serial || !baseTitle) return res.status(400).json({ error: 'Date, serial, and base title are required.' });
  const normalizedSerial = serial.toLowerCase().replace(/\s+/g, ' ').trim();
  const same = readFormLogs().filter(row => {
    if (String(row.type || '').toLowerCase() !== 'mewp') return false;
    if (String(row.date || '') !== date) return false;
    const title = String(row.title || '');
    // New filenames include the serial between separators. Keep matching conservative
    // so different lifts on the same date never share a sequence.
    return title.toLowerCase().includes(` - ${normalizedSerial} - `) ||
      title.toLowerCase().endsWith(` - ${normalizedSerial}`);
  });
  const sequence = same.length + 1;
  const title = sequence > 1 ? `${baseTitle} - ${sequence}` : baseTitle;
  res.json({ ok: true, title, sequence });
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


app.use(vn84bRoutes);

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
