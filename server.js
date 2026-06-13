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

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');
if (!fs.existsSync(WEEKLY_MEETINGS_FILE)) fs.writeFileSync(WEEKLY_MEETINGS_FILE, '[]');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${nanoid(8)}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024, files: 24 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
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
function cleanText(v) {
  return String(v || '').trim().slice(0, 500);
}

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
  if (!name) return res.status(400).json({ error: 'Worker name is required.' });
  meeting.attendees = meeting.attendees || [];
  const existing = meeting.attendees.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.company = company || existing.company;
    existing.signedAt = new Date().toISOString();
  } else {
    meeting.attendees.push({ id: nanoid(8), name, company, signedAt: new Date().toISOString() });
  }
  writeWeeklyMeetings(rows);
  res.json({ ok: true, meeting });
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`JAGD Field Forms running on ${PORT}`));
