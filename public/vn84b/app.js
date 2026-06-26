let trackerData = null;
let areaChart = null;

const AREA_COLORS = {
  'blue-bridge-87': { name: 'Blue Bridge 87', color: '#2563eb', soft: '#eff6ff' },
  'belt-parkway-bearings': { name: 'Belt Parkway Bearings', color: '#ca8a04', soft: '#fefce8' },
  'blue-bridge-237-crosses': { name: 'Blue Bridge 237 New Crosses', color: '#16a34a', soft: '#f0fdf4' },
  'orange-bridge-piers': { name: 'Orange Bridge Piers', color: '#f97316', soft: '#fff7ed' },
  'belt-parkway-jacking': { name: 'Belt Parkway Jacking Locations', color: '#dc2626', soft: '#fef2f2' }
};

function areaColor(area) {
  return AREA_COLORS[area.id] || { color: '#334155', soft: '#f8fafc' };
}

function storeBrowserBackup(data) {
  try { localStorage.setItem('vn84bLastGoodBackup', JSON.stringify(data)); } catch (e) {}
}

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}

function getStageCompleted(area, stage, subAreaId = null) {
  const rows = area.items || [];
  if (subAreaId) {
    const row = rows.find(i => i.stage === stage && i.subAreaId === subAreaId);
    return row ? Number(row.completed || 0) : 0;
  }
  return rows
    .filter(i => i.stage === stage)
    .reduce((sum, i) => sum + Number(i.completed || 0), 0);
}

function areaPercent(area) {
  const totalSteps = area.total * area.stages.length;
  const completedSteps = area.stages.reduce((sum, stage) => sum + getStageCompleted(area, stage), 0);
  return pct(completedSteps, totalSteps);
}

function stagePercent(area, stage, subAreaId = null) {
  const total = subAreaId && area.subAreas ? (area.subAreas.find(s => s.id === subAreaId) || {}).total : area.total;
  return pct(getStageCompleted(area, stage, subAreaId), total || 0);
}

function billingPercent(area) {
  return Math.round(area.stages.reduce((sum, stage) => sum + stagePercent(area, stage), 0) * 10) / 10;
}

function subAreaBillingPercent(area, sub) {
  return Math.round(area.stages.reduce((sum, stage) => sum + stagePercent(area, stage, sub.id), 0) * 10) / 10;
}

function stageClass(stage) {
  if (/power/i.test(stage)) return 'stage-power';
  if (/zinc/i.test(stage)) return 'stage-zinc';
  if (/mid/i.test(stage)) return 'stage-mid';
  if (/finish/i.test(stage)) return 'stage-finish';
  return 'stage-default';
}


function stageColor(stage) {
  if (/power/i.test(stage)) return '#2563eb';
  if (/zinc/i.test(stage)) return '#f97316';
  if (/mid/i.test(stage)) return '#16a34a';
  if (/finish/i.test(stage)) return '#9333ea';
  return '#334155';
}

function subAreaPercent(area, sub) {
  const totalSteps = sub.total * area.stages.length;
  const completedSteps = area.stages.reduce((sum, stage) => sum + getStageCompleted(area, stage, sub.id), 0);
  return pct(completedSteps, totalSteps);
}

function overallPercent(data) {
  const totals = data.areas.reduce((acc, area) => {
    acc.total += area.total * area.stages.length;
    acc.done += area.stages.reduce((sum, stage) => sum + getStageCompleted(area, stage), 0);
    return acc;
  }, { done: 0, total: 0 });
  return pct(totals.done, totals.total);
}

function overallBillingPercent(data) {
  const perArea = data.areas.map(area => billingPercent(area));
  if (!perArea.length) return 0;
  return Math.round((perArea.reduce((a,b)=>a+b,0) / perArea.length) * 10) / 10;
}

async function loadData() {
  const res = await fetch('/api/vn84b', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load tracker data');
  trackerData = await res.json();
  storeBrowserBackup(trackerData);
  render();
}


function renderStorageWarning() {
  // Field users should not see storage/admin warnings on the tracker page.
  // Storage can still be checked from /api/vn84b/storage when needed.
  const banner = document.getElementById('storageWarningBanner');
  if (banner) banner.style.display = 'none';
}

function render() {
  renderStorageWarning();
  document.getElementById('overallPercent').textContent = `${overallPercent(trackerData)}%`;
  const billingEl = document.getElementById('overallBillingPercent');
  if (billingEl) billingEl.textContent = `${overallBillingPercent(trackerData)}%`;
  renderSummary();
  renderAreaSelects();
  renderChart();
  renderAreas();
  renderLogs();
}

function renderSummary() {
  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = trackerData.areas.map((area) => {
    const c = areaColor(area);
    return `
      <article class="summary-card" style="--area-color:${c.color}; --area-soft:${c.soft};">
        <h3>${area.name}</h3>
        <strong>${billingPercent(area)}%</strong>
        <p>Stage average · ${areaPercent(area)}% physical complete</p>
        <small>${area.total.toLocaleString()} ${area.unitLabel}</small>
      </article>
    `;
  }).join('');
}

function renderAreaSelects() {
  const current = document.getElementById('areaSelect').value;
  const noteCurrent = document.getElementById('noteAreaSelect').value;
  const options = trackerData.areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('areaSelect').innerHTML = options;
  document.getElementById('noteAreaSelect').innerHTML = `<option value="">General</option>${options}`;
  if (current) document.getElementById('areaSelect').value = current;
  if (noteCurrent) document.getElementById('noteAreaSelect').value = noteCurrent;
  renderStageSelect();
}

function renderStageSelect() {
  const area = trackerData.areas.find(a => a.id === document.getElementById('areaSelect').value) || trackerData.areas[0];
  const stageSelect = document.getElementById('stageSelect');
  const previousStage = stageSelect.value;
  stageSelect.innerHTML = area.stages.map(s => `<option value="${s}">${s}</option>`).join('');
  if (previousStage && area.stages.includes(previousStage)) stageSelect.value = previousStage;

  const subAreaLabel = document.getElementById('subAreaLabel');
  const subAreaSelect = document.getElementById('subAreaSelect');
  const previousSubArea = subAreaSelect.value;
  if (area.subAreas && area.subAreas.length) {
    subAreaLabel.style.display = '';
    subAreaSelect.required = true;
    subAreaSelect.innerHTML = area.subAreas.map(s => `<option value="${s.id}">${s.name} — ${s.total} ${area.unitLabel}</option>`).join('');
    if (previousSubArea && area.subAreas.some(s => s.id === previousSubArea)) subAreaSelect.value = previousSubArea;
  } else {
    subAreaLabel.style.display = 'none';
    subAreaSelect.required = false;
    subAreaSelect.innerHTML = '';
  }
  renderCompletedLimit();
}

function renderCompletedLimit() {
  const area = trackerData.areas.find(a => a.id === document.getElementById('areaSelect').value) || trackerData.areas[0];
  const subAreaId = document.getElementById('subAreaSelect').value;
  const stage = document.getElementById('stageSelect').value;
  const sub = area.subAreas ? area.subAreas.find(s => s.id === subAreaId) : null;
  const max = sub ? sub.total : area.total;
  const current = getStageCompleted(area, stage, sub ? sub.id : null);
  const completedInput = document.getElementById('completedInput');
  const help = document.getElementById('completedHelp');
  completedInput.max = max;
  completedInput.placeholder = `${current} of ${max} already entered`;
  completedInput.value = current;
  completedInput.classList.toggle('prefilled-progress', current > 0);
  if (help) {
    const locationText = sub ? `${sub.name} — ` : '';
    help.textContent = `${locationText}${stage}: ${current} of ${max} ${area.unitLabel} already entered. Change the box only if the total to date is different.`;
  }
}

function renderChart() {
  const ctx = document.getElementById('areaChart');
  const labels = trackerData.areas.map(a => a.name);
  const stageNames = ['Power Tool Prep', 'Zinc Coat', 'Midcoat', 'Finish Coat'];
  const datasets = stageNames.map(stage => ({
    label: stage,
    data: trackerData.areas.map(area => area.stages.includes(stage) ? stagePercent(area, stage) : 0),
    backgroundColor: stageColor(stage),
    borderColor: stageColor(stage),
    borderWidth: 1
  }));

  if (areaChart) areaChart.destroy();
  areaChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: value => value + '%' },
          title: { display: true, text: 'Percent complete per stage' }
        },
        x: { stacked: false }
      },
      plugins: {
        legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}% complete` } }
      }
    }
  });
}

function renderSubAreas(area) {
  if (!area.subAreas || !area.subAreas.length) return '';
  return `
    <div class="log-list">
      ${area.subAreas.map(sub => `
        <div class="log-item">
          <strong>${sub.name}</strong>
          <span>${sub.total} ${area.unitLabel} · ${subAreaBillingPercent(area, sub)}% stage avg · ${subAreaPercent(area, sub)}% physical</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAreas() {
  const list = document.getElementById('areaList');
  list.innerHTML = trackerData.areas.map(area => `
    <article class="area-card" style="--area-color:${areaColor(area).color}; --area-soft:${areaColor(area).soft};">
      <div class="area-head">
        <div>
          <h3>${area.name}</h3>
          <p>${area.description}</p>
        </div>
        <span class="badge">${billingPercent(area)}% stage avg</span>
      </div>
      ${renderSubAreas(area)}
      ${area.stages.map(stage => {
        const done = getStageCompleted(area, stage);
        const percentage = pct(done, area.total);
        return `
          <div class="stage-row ${stageClass(stage)}">
            <div class="stage-top"><strong>${stage}</strong><span>${done.toLocaleString()} / ${area.total.toLocaleString()} ${area.unitLabel} · ${percentage}% of this stage</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, percentage)}%"></div></div>
          </div>
        `;
      }).join('')}
    </article>
  `).join('');
}

function renderLogs() {
  const daily = document.getElementById('dailyLog');
  daily.innerHTML = (trackerData.dailyLog || []).slice(0, 60).map(row => `
    <div class="log-item">
      <strong>${row.areaName} — ${row.stage}</strong>
      <span>${fmtDate(row.timestamp)}${row.enteredBy ? ` · ${row.enteredBy}` : ''}</span>
      <p>${Number(row.completed).toLocaleString()} / ${Number(row.total).toLocaleString()} complete for this stage${row.note ? ` — ${row.note}` : ''}</p>
    </div>
  `).join('') || '<p>No production entries yet.</p>';

  const notes = document.getElementById('notesList');
  notes.innerHTML = (trackerData.notes || []).slice(0, 40).map(row => `
    <div class="log-item">
      <strong>${row.areaName}</strong>
      <span>${fmtDate(row.timestamp)}${row.enteredBy ? ` · ${row.enteredBy}` : ''}</span>
      <p>${row.note}</p>
    </div>
  `).join('') || '<p>No notes yet.</p>';
}

async function saveProgress(event) {
  event.preventDefault();
  const area = trackerData.areas.find(a => a.id === document.getElementById('areaSelect').value);
  const payload = {
    areaId: document.getElementById('areaSelect').value,
    subAreaId: area && area.subAreas && area.subAreas.length ? document.getElementById('subAreaSelect').value : '',
    stage: document.getElementById('stageSelect').value,
    completed: document.getElementById('completedInput').value,
    enteredBy: document.getElementById('enteredByInput').value,
    note: document.getElementById('noteInput').value
  };
  const res = await fetch('/api/vn84b/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Could not save progress');
  trackerData = await res.json();
  storeBrowserBackup(trackerData);
  document.getElementById('saveMessage').textContent = 'Progress saved. Current total updated.';
  document.getElementById('noteInput').value = '';
  render();
  setTimeout(() => document.getElementById('saveMessage').textContent = '', 2500);
}

async function saveNote(event) {
  event.preventDefault();
  const payload = {
    areaId: document.getElementById('noteAreaSelect').value,
    enteredBy: document.getElementById('noteEnteredByInput').value,
    note: document.getElementById('fieldNoteInput').value
  };
  const res = await fetch('/api/vn84b/note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Could not save note');
  trackerData = await res.json();
  storeBrowserBackup(trackerData);
  document.getElementById('fieldNoteInput').value = '';
  render();
}


function exportBackup() {
  if (!trackerData) return;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const blob = new Blob([JSON.stringify(trackerData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vn84b-tracker-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function restoreBackupFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.areas)) throw new Error('That backup file does not look like VN84-B tracker data.');
  if (!confirm('Restore this VN84-B backup? This will replace the current tracker data.')) return;
  const res = await fetch('/api/vn84b/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Could not restore backup');
  trackerData = await res.json();
  storeBrowserBackup(trackerData);
  render();
  alert('VN84-B backup restored.');
}

async function restoreBrowserBackup() {
  const raw = localStorage.getItem('vn84bLastGoodBackup');
  if (!raw) return alert('No browser backup found on this device yet.');
  const data = JSON.parse(raw);
  if (!confirm('Restore the last VN84-B backup saved in this browser?')) return;
  const res = await fetch('/api/vn84b/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Could not restore browser backup');
  trackerData = await res.json();
  render();
  alert('Browser backup restored.');
}

document.getElementById('areaSelect').addEventListener('change', renderStageSelect);
document.getElementById('subAreaSelect').addEventListener('change', renderCompletedLimit);
document.getElementById('stageSelect').addEventListener('change', renderCompletedLimit);
document.getElementById('progressForm').addEventListener('submit', saveProgress);
document.getElementById('noteForm').addEventListener('submit', saveNote);
document.getElementById('refreshBtn').addEventListener('click', loadData);
document.getElementById('backupBtn').addEventListener('click', exportBackup);
document.getElementById('restoreBtn').addEventListener('click', () => document.getElementById('restoreFile').click());
document.getElementById('restoreFile').addEventListener('change', event => {
  const file = event.target.files && event.target.files[0];
  if (file) restoreBackupFile(file).catch(err => alert(err.message));
  event.target.value = '';
});
window.vn84bRestoreBrowserBackup = restoreBrowserBackup;
loadData().catch(err => alert(err.message));
