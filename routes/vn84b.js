const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'vn84b-tracker.json');

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
      description: '190 bearings: power tool prep, zinc, midcoat, finish coat',
      unitLabel: 'bearings',
      total: 190,
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

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

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
    const { areaId, stage, completed, note, enteredBy } = req.body || {};
    const data = readData();
    const area = data.areas.find(a => a.id === areaId);
    if (!area) return res.status(404).json({ error: 'Area not found.' });
    if (!area.stages.includes(stage)) return res.status(400).json({ error: 'Stage not found for this area.' });

    const safeCompleted = clampNumber(completed, 0, area.total);
    const existing = area.items.find(i => i.stage === stage);
    if (existing) {
      existing.completed = safeCompleted;
      existing.updatedAt = new Date().toISOString();
      existing.enteredBy = enteredBy || existing.enteredBy || '';
    } else {
      area.items.push({ stage, completed: safeCompleted, enteredBy: enteredBy || '', updatedAt: new Date().toISOString() });
    }

    data.dailyLog.unshift({
      id: Date.now().toString(36),
      timestamp: new Date().toISOString(),
      areaId,
      areaName: area.name,
      stage,
      completed: safeCompleted,
      total: area.total,
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
