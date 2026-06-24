const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const configuredDataFile = process.env.VN84B_DATA_PATH || '';
const dataFile = configuredDataFile || path.join(__dirname, '..', 'data', 'vn84b-tracker.json');
const dataDir = path.dirname(dataFile);

const bearingSubAreas = [
  { id: 'abutment', name: 'Abutment', total: 10 },
  { id: 'sp1', name: 'SP1', total: 20 },
  { id: 'sp2', name: 'SP2', total: 20 },
  { id: 'sp3', name: 'SP3', total: 18 },
  { id: 'sp4', name: 'SP4', total: 18 },
  { id: 'sp5', name: 'SP5', total: 18 },
  { id: 'sp6', name: 'SP6', total: 18 },
  { id: 'sp7', name: 'SP7', total: 18 },
  { id: 'sp8', name: 'SP8', total: 18 },
  { id: 'sp9', name: 'SP9', total: 18 },
  { id: 'sp10', name: 'SP10', total: 18 },
  { id: 'sp11', name: 'SP11', total: 18 },
  { id: 'sp12', name: 'SP12', total: 18 }
];

const defaultData = {
  contract: 'VN84-B',
  bridge: 'Verrazzano-Narrows Bridge',
  updatedAt: null,
  areas: [
    {
      id: 'blue-bridge-87',
      name: 'Blue Bridge 87',
      description: 'Steel repairs, power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'locations',
      total: 87,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'belt-parkway-bearings',
      name: 'Belt Parkway Bearings',
      description: '230 bearings broken out by Abutment and SP1–SP12. Each stage counts as its own 100% billing item: power tool, zinc, midcoat, finish.',
      unitLabel: 'bearings',
      total: 230,
      subAreas: bearingSubAreas,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'blue-bridge-237-crosses',
      name: 'Blue Bridge 237 New Crosses',
      description: '237 new crosses: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'crosses',
      total: 237,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'orange-bridge-piers',
      name: 'Orange Bridge Piers',
      description: '25,200 sq ft across 9 piers: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'sq ft',
      total: 25200,
      pierCount: 9,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    },
    {
      id: 'belt-parkway-jacking',
      name: 'Belt Parkway Jacking Locations',
      description: '13 piers / jacking locations: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'piers',
      total: 13,
      stages: ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'],
      items: []
    }
  ],
  dailyLog: [],
  notes: []
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
  }
}

function migrateData(data) {
  const bearings = data.areas && data.areas.find(a => a.id === 'belt-parkway-bearings');
  if (bearings) {
    bearings.total = 230;
    bearings.description = '230 bearings broken out by Abutment and SP1–SP12. Each stage counts as its own 100% billing item: power tool, zinc, midcoat, finish.';
    bearings.subAreas = bearingSubAreas;
  }
  return data;
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf8');
  return migrateData(JSON.parse(raw));
}

function writeData(data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dataFile)) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(dataFile, path.join(dataDir, `vn84b-tracker-backup-${stamp}.json`));
    } catch (backupErr) {
      console.warn('VN84-B backup warning:', backupErr.message);
    }
  }
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(dataFile, JSON.stringify(migrateData(data), null, 2));
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}


router.get('/api/vn84b/storage', (req, res) => {
  res.json({
    dataFile,
    usingPersistentPath: Boolean(process.env.VN84B_DATA_PATH),
    updatedAt: fs.existsSync(dataFile) ? fs.statSync(dataFile).mtime.toISOString() : null
  });
});

router.get('/api/vn84b', (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    console.error('VN84-B read error:', err);
    res.status(500).json({ error: 'Could not load VN84-B tracker data.' });
  }
});

router.post('/api/vn84b/progress', express.json({ limit: '2mb' }), (req, res) => {
  try {
    const { areaId, subAreaId, stage, completed, note, enteredBy } = req.body || {};
    const data = readData();
    const area = data.areas.find(a => a.id === areaId);
    if (!area) return res.status(404).json({ error: 'Area not found.' });
    if (!area.stages.includes(stage)) return res.status(400).json({ error: 'Stage not found for this area.' });

    const subArea = area.subAreas && subAreaId ? area.subAreas.find(s => s.id === subAreaId) : null;
    if (area.subAreas && area.subAreas.length && !subArea) return res.status(400).json({ error: 'Location / pier is required for this area.' });

    const totalForEntry = subArea ? subArea.total : area.total;
    const safeCompleted = clampNumber(completed, 0, totalForEntry);
    const existing = (area.items || []).find(i => i.stage === stage && (i.subAreaId || '') === (subAreaId || ''));
    if (existing) {
      existing.completed = safeCompleted;
      existing.updatedAt = new Date().toISOString();
      existing.enteredBy = enteredBy || existing.enteredBy || '';
      existing.subAreaId = subArea ? subArea.id : '';
      existing.subAreaName = subArea ? subArea.name : '';
    } else {
      if (!area.items) area.items = [];
      area.items.push({
        stage,
        subAreaId: subArea ? subArea.id : '',
        subAreaName: subArea ? subArea.name : '',
        completed: safeCompleted,
        enteredBy: enteredBy || '',
        updatedAt: new Date().toISOString()
      });
    }

    const areaLogName = subArea ? `${area.name} — ${subArea.name}` : area.name;
    data.dailyLog.unshift({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      areaId,
      subAreaId: subArea ? subArea.id : '',
      areaName: areaLogName,
      stage,
      completed: safeCompleted,
      total: totalForEntry,
      note: note || '',
      enteredBy: enteredBy || ''
    });
    data.dailyLog = data.dailyLog.slice(0, 500);
    writeData(data);
    res.json(data);
  } catch (err) {
    console.error('VN84-B progress save error:', err);
    res.status(500).json({ error: 'Could not save VN84-B progress.' });
  }
});


router.post('/api/vn84b/restore', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.areas)) return res.status(400).json({ error: 'Invalid VN84-B backup file.' });
    writeData(data);
    res.json(readData());
  } catch (err) {
    console.error('VN84-B restore error:', err);
    res.status(500).json({ error: 'Could not restore VN84-B backup.' });
  }
});

router.get('/api/vn84b/backup', (req, res) => {
  try {
    const data = readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="vn84b-tracker-backup.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('VN84-B backup download error:', err);
    res.status(500).json({ error: 'Could not download VN84-B backup.' });
  }
});

router.post('/api/vn84b/note', express.json({ limit: '2mb' }), (req, res) => {
  try {
    const { areaId, note, enteredBy } = req.body || {};
    if (!note || !note.trim()) return res.status(400).json({ error: 'Note is required.' });
    const data = readData();
    const area = data.areas.find(a => a.id === areaId);
    data.notes.unshift({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      areaId: areaId || '',
      areaName: area ? area.name : 'General',
      note: note.trim(),
      enteredBy: enteredBy || ''
    });
    data.notes = data.notes.slice(0, 300);
    writeData(data);
    res.json(data);
  } catch (err) {
    console.error('VN84-B note save error:', err);
    res.status(500).json({ error: 'Could not save VN84-B note.' });
  }
});

router.get('/vn84b', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'vn84b', 'index.html'));
});

module.exports = router;
