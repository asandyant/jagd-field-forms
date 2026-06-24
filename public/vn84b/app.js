let trackerData = null;
let areaChart = null;

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

async function loadData() {
  const res = await fetch('/api/vn84b', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load tracker data');
  trackerData = await res.json();
  render();
}

function render() {
  document.getElementById('overallPercent').textContent = `${overallPercent(trackerData)}%`;
  renderSummary();
  renderAreaSelects();
  renderChart();
  renderAreas();
  renderLogs();
}

function renderSummary() {
  const grid = document.getElementById('summaryGrid');
  grid.innerHTML = trackerData.areas.map(area => `
    <article class="summary-card">
      <h3>${area.name}</h3>
      <strong>${areaPercent(area)}%</strong>
      <p>${area.total.toLocaleString()} ${area.unitLabel}</p>
    </article>
  `).join('');
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
  document.getElementById('stageSelect').innerHTML = area.stages.map(s => `<option value="${s}">${s}</option>`).join('');

  const subAreaLabel = document.getElementById('subAreaLabel');
  const subAreaSelect = document.getElementById('subAreaSelect');
  if (area.subAreas && area.subAreas.length) {
    subAreaLabel.style.display = '';
    subAreaSelect.required = true;
    subAreaSelect.innerHTML = area.subAreas.map(s => `<option value="${s.id}">${s.name} — ${s.total} ${area.unitLabel}</option>`).join('');
    renderCompletedLimit();
  } else {
    subAreaLabel.style.display = 'none';
    subAreaSelect.required = false;
    subAreaSelect.innerHTML = '';
    document.getElementById('completedInput').max = area.total;
    document.getElementById('completedInput').placeholder = `0 to ${area.total}`;
  }
}

function renderCompletedLimit() {
  const area = trackerData.areas.find(a => a.id === document.getElementById('areaSelect').value) || trackerData.areas[0];
  const subAreaId = document.getElementById('subAreaSelect').value;
  const sub = area.subAreas ? area.subAreas.find(s => s.id === subAreaId) : null;
  const max = sub ? sub.total : area.total;
  document.getElementById('completedInput').max = max;
  document.getElementById('completedInput').placeholder = `0 to ${max}`;
}

function renderChart() {
  const ctx = document.getElementById('areaChart');
  const labels = trackerData.areas.map(a => a.name);
  const values = trackerData.areas.map(a => areaPercent(a));
  if (areaChart) areaChart.destroy();
  areaChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: '% Complete', data: values }] },
    options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }
  });
}

function renderSubAreas(area) {
  if (!area.subAreas || !area.subAreas.length) return '';
  return `
    <div class="log-list">
      ${area.subAreas.map(sub => `
        <div class="log-item">
          <strong>${sub.name}</strong>
          <span>${sub.total} ${area.unitLabel} · ${subAreaPercent(area, sub)}% complete</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAreas() {
  const list = document.getElementById('areaList');
  list.innerHTML = trackerData.areas.map(area => `
    <article class="area-card">
      <div class="area-head">
        <div>
          <h3>${area.name}</h3>
          <p>${area.description}</p>
        </div>
        <span class="badge">${areaPercent(area)}%</span>
      </div>
      ${renderSubAreas(area)}
      ${area.stages.map(stage => {
        const done = getStageCompleted(area, stage);
        const percentage = pct(done, area.total);
        return `
          <div class="stage-row">
            <div class="stage-top"><strong>${stage}</strong><span>${done.toLocaleString()} / ${area.total.toLocaleString()} ${area.unitLabel} · ${percentage}%</span></div>
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
      <p>${Number(row.completed).toLocaleString()} / ${Number(row.total).toLocaleString()} complete${row.note ? ` — ${row.note}` : ''}</p>
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
  document.getElementById('saveMessage').textContent = 'Progress saved.';
  document.getElementById('completedInput').value = '';
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
  document.getElementById('fieldNoteInput').value = '';
  render();
}

document.getElementById('areaSelect').addEventListener('change', renderStageSelect);
document.getElementById('subAreaSelect').addEventListener('change', renderCompletedLimit);
document.getElementById('progressForm').addEventListener('submit', saveProgress);
document.getElementById('noteForm').addEventListener('submit', saveNote);
document.getElementById('refreshBtn').addEventListener('click', loadData);
loadData().catch(err => alert(err.message));
