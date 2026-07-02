let emergencyData = null;
let selectedRepairId = null;
let repairChart = null;

const STATUS_CLASS = {
  'Complete': 'status-complete',
  'Hold / Issue': 'status-hold',
  'Not Started': '',
  'Field Verified': 'status-progress',
  'Access Ready': 'status-progress',
  'Material Released': 'status-progress',
  'Prep / Removal': 'status-progress',
  'Installed': 'status-progress',
  'Bolt / Torque / QC': 'status-progress',
  'Coating Touch-Up': 'status-progress'
};

function money(n) {
  return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function num(n) { return Number(n || 0).toLocaleString(); }
function pct(done, total) { return total ? Math.round((done / total) * 1000) / 10 : 0; }

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

async function loadEmergency() {
  const res = await fetch('/api/vn84b/emergency-steel-repairs');
  if (!res.ok) throw new Error('Could not load Emergency Steel Repairs.');
  emergencyData = await res.json();
  if (!selectedRepairId && emergencyData.repairs && emergencyData.repairs.length) selectedRepairId = emergencyData.repairs[0].id;
  renderFilters();
  render();
}

function summary() {
  const repairs = emergencyData.repairs || [];
  const total = repairs.length;
  const complete = repairs.filter(r => r.status === 'Complete').length;
  const verified = repairs.filter(r => r.fieldVerified === 'Yes').length;
  const holds = repairs.filter(r => r.status === 'Hold / Issue').length;
  const inProgress = repairs.filter(r => r.status && r.status !== 'Not Started' && r.status !== 'Complete' && r.status !== 'Hold / Issue').length;
  const additional = repairs.filter(r => isAdditional(r));
  const original = repairs.filter(r => !isAdditional(r));
  return {
    total, complete, verified, holds, inProgress,
    members: repairs.reduce((s,r)=>s+Number(r.qtyMembers||0),0),
    sf: repairs.reduce((s,r)=>s+Number(r.estimatedSf||0),0),
    crewDays: repairs.reduce((s,r)=>s+Number(r.crewDays||0),0),
    labor: repairs.reduce((s,r)=>s+Number(r.laborCost||0),0),
    additionalLocations: additional.length,
    originalLocations: original.length,
    additionalMembers: additional.reduce((sum,r)=>sum+Number(r.qtyMembers||0),0),
    originalMembers: original.reduce((sum,r)=>sum+Number(r.qtyMembers||0),0),
    additionalComplete: additional.filter(r=>r.status === 'Complete').length,
    originalComplete: original.filter(r=>r.status === 'Complete').length
  };
}

function isAdditional(r) {
  return String(r.repairClass || '').toLowerCase().includes('additional') || Number(r.id) > 13;
}

function classLabel(r) {
  return isAdditional(r) ? 'Red / Additional' : 'Blue / Original';
}

function classPill(r) {
  return `<span class="class-pill ${isAdditional(r) ? 'class-additional' : 'class-original'}">${classLabel(r)}</span>`;
}

function renderFilters() {
  const repairs = emergencyData.repairs || [];
  const pier = document.getElementById('pierFilter');
  const span = document.getElementById('spanFilter');
  const status = document.getElementById('statusFilter');

  const oldPier = pier.value;
  const oldSpan = span.value;
  const oldStatus = status.value;

  pier.innerHTML = '<option value="">All Piers</option>' + unique(repairs.map(r=>r.pier)).map(v=>`<option value="${v}">${v}</option>`).join('');
  span.innerHTML = '<option value="">All Spans</option>' + unique(repairs.map(r=>r.span)).map(v=>`<option value="${v}">${v}</option>`).join('');
  status.innerHTML = '<option value="">All Statuses</option>' + (emergencyData.statuses || []).map(v=>`<option value="${v}">${v}</option>`).join('');

  pier.value = oldPier;
  span.value = oldSpan;
  status.value = oldStatus;
}

function getFilteredRepairs() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const pier = document.getElementById('pierFilter').value;
  const span = document.getElementById('spanFilter').value;
  const status = document.getElementById('statusFilter').value;
  return (emergencyData.repairs || []).filter(r => {
    const text = `${r.id} ${r.pier} ${r.span} ${r.betweenStringers} ${r.members} ${r.status} ${r.notes}`.toLowerCase();
    return (!q || text.includes(q)) &&
      (!pier || r.pier === pier) &&
      (!span || r.span === span) &&
      (!status || r.status === status);
  });
}

function renderKpis() {
  const s = summary();
  document.getElementById('completePercent').textContent = `${pct(s.complete, s.total)}%`;
  document.getElementById('completeCount').textContent = s.complete;
  document.getElementById('totalCount').textContent = s.total;
  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card"><span>Repair Locations</span><strong>${s.total}</strong></div>
    <div class="kpi-card red-kpi"><span>Red / Additional</span><strong>${s.additionalLocations}</strong><em>${s.additionalMembers} member pieces</em></div>
    <div class="kpi-card blue-kpi"><span>Blue / Original</span><strong>${s.originalLocations}</strong><em>${s.originalMembers} member pieces</em></div>
    <div class="kpi-card"><span>Complete</span><strong>${s.complete}</strong><em>${pct(s.complete, s.total)}%</em></div>
    <div class="kpi-card"><span>Field Verified</span><strong>${s.verified}</strong></div>
    <div class="kpi-card"><span>Est. Labor Backup</span><strong>${money(s.labor)}</strong></div>
  `;
}

function renderChart() {
  const ctx = document.getElementById('repairChart');
  const groups = {};
  (emergencyData.repairs || []).forEach(r => {
    const key = r.pier || 'Unknown';
    if (!groups[key]) groups[key] = { additional: 0, original: 0, complete: 0, issue: 0 };
    if (isAdditional(r)) groups[key].additional += 1;
    else groups[key].original += 1;
    if (r.status === 'Complete') groups[key].complete += 1;
    if (r.status === 'Hold / Issue') groups[key].issue += 1;
  });
  const labels = Object.keys(groups).sort((a,b)=>a.localeCompare(b, undefined, { numeric: true }));
  const datasets = [
    { label: 'Red / Additional', data: labels.map(l=>groups[l].additional), backgroundColor: '#dc2626' },
    { label: 'Blue / Original', data: labels.map(l=>groups[l].original), backgroundColor: '#2563eb' },
    { label: 'Complete', data: labels.map(l=>groups[l].complete), backgroundColor: '#16a34a' },
    { label: 'Hold / Issue', data: labels.map(l=>groups[l].issue), backgroundColor: '#f59e0b' }
  ];
  if (repairChart) repairChart.destroy();
  repairChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function repairBox(r) {
  const statusClass = STATUS_CLASS[r.status] || '';
  const members = String(r.members || '').replace(/\s+/g, ' ');
  return `
    <button class="repair-box ${isAdditional(r) ? 'box-additional' : 'box-original'} ${statusClass} ${Number(r.id) === Number(selectedRepairId) ? 'selected' : ''}" data-id="${r.id}" type="button">
      <span class="box-id">#${r.id}</span>
      <strong>${r.pier} / ${r.span}</strong>
      <em>${r.betweenStringers}</em>
      <small>${members}</small>
    </button>
  `;
}

function renderRepairMatrix() {
  const matrix = document.getElementById('repairMatrix');
  if (!matrix) return;
  const repairs = getFilteredRepairs();
  const byPier = {};
  repairs.forEach(r => {
    const key = r.pier || 'Unknown';
    if (!byPier[key]) byPier[key] = [];
    byPier[key].push(r);
  });
  const piers = Object.keys(byPier).sort((a,b)=>a.localeCompare(b, undefined, { numeric: true }));
  matrix.innerHTML = piers.map(pier => `
    <section class="pier-box-group">
      <h3>${pier}</h3>
      <div class="box-grid">${byPier[pier].sort((a,b)=>Number(a.id)-Number(b.id)).map(repairBox).join('')}</div>
    </section>
  `).join('') || '<p>No repairs match the current filter.</p>';
  matrix.querySelectorAll('.repair-box').forEach(box => {
    box.addEventListener('click', () => {
      selectedRepairId = Number(box.dataset.id);
      render();
      document.querySelector('.detail-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function repairCard(r) {
  const statusClass = STATUS_CLASS[r.status] || '';
  const members = String(r.members || '').split(',').map(m=>m.trim()).filter(Boolean);
  return `
    <article class="repair-card ${isAdditional(r) ? 'repair-additional' : 'repair-original'} ${Number(r.id) === Number(selectedRepairId) ? 'selected' : ''}" data-id="${r.id}">
      <div class="repair-top">
        <div>
          <div class="repair-title">#${r.id} · ${r.pier} / ${r.span} · ${r.betweenStringers}</div>
          <div class="repair-meta">${r.qtyMembers} member pieces · ${r.estimatedSf} est. SF · ${r.source}</div>
        </div>
        ${classPill(r)}<span class="status-pill ${statusClass}">${r.status}</span>
      </div>
      <div class="member-badges">${members.map(m=>`<span>${m}</span>`).join('')}</div>
      ${r.notes ? `<p class="repair-meta"><strong>Note:</strong> ${r.notes}</p>` : ''}
    </article>
  `;
}

function renderList() {
  const repairs = getFilteredRepairs();
  const list = document.getElementById('repairList');
  list.innerHTML = repairs.map(repairCard).join('') || '<p>No repairs match the current filter.</p>';
  list.querySelectorAll('.repair-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedRepairId = Number(card.dataset.id);
      render();
    });
  });
}

function renderDetail() {
  const r = (emergencyData.repairs || []).find(x => Number(x.id) === Number(selectedRepairId));
  const form = document.getElementById('repairForm');
  if (!r) {
    document.getElementById('detailTitle').textContent = 'Select a repair';
    document.getElementById('detailSub').textContent = 'Pick a row on the left to update status and notes.';
    document.getElementById('detailGrid').innerHTML = '';
    form.style.display = 'none';
    return;
  }
  document.getElementById('detailTitle').textContent = `Repair #${r.id}`;
  document.getElementById('detailSub').textContent = `${r.pier} / ${r.span} / Between ${r.betweenStringers}`;
  document.getElementById('detailGrid').innerHTML = `
    <div><span>Repair Class</span><strong>${classLabel(r)}</strong></div>
    <div><span>Members</span><strong>${r.members}</strong></div>
    <div><span>Qty Pieces</span><strong>${r.qtyMembers}</strong></div>
    <div><span>Est. SF</span><strong>${r.estimatedSf}</strong></div>
    <div><span>Crew Days</span><strong>${r.crewDays}</strong></div>
    <div><span>Labor Backup</span><strong>${money(r.laborCost)}</strong></div>
    <div><span>Field Verified</span><strong>${r.fieldVerified}</strong></div>
  `;
  form.style.display = 'grid';
  document.getElementById('repairId').value = r.id;
  document.getElementById('statusSelect').innerHTML = (emergencyData.statuses || []).map(s=>`<option value="${s}">${s}</option>`).join('');
  document.getElementById('statusSelect').value = r.status || 'Not Started';
  document.getElementById('verifiedSelect').value = r.fieldVerified || 'No';
  document.getElementById('completedDateInput').value = r.completedDate || '';
  document.getElementById('notesInput').value = r.notes || '';
}

function renderActivity() {
  const box = document.getElementById('activityList');
  const rows = emergencyData.activityLog || [];
  box.innerHTML = rows.slice(0, 40).map(r => `
    <div class="log-item">
      <strong>#${r.repairId} · ${r.location} · ${r.status}</strong>
      <span>${new Date(r.timestamp).toLocaleString()}${r.enteredBy ? ` · ${r.enteredBy}` : ''}</span>
      <p>${r.members}${r.notes ? ` — ${r.notes}` : ''}</p>
    </div>
  `).join('') || '<p>No emergency steel repair updates yet.</p>';
}

function renderOfficeTable() {
  const table = document.getElementById('officeTable');
  const headers = ['ID','Class','Status','Pier','Span','Between','Members','Qty','Est. SF','Crew Days','Labor','Verified','Done Date','Notes'];
  const rows = getFilteredRepairs();
  table.innerHTML = `
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`
      <tr>
        <td>${r.id}</td><td>${classLabel(r)}</td><td>${r.status}</td><td>${r.pier}</td><td>${r.span}</td><td>${r.betweenStringers}</td>
        <td>${r.members}</td><td>${r.qtyMembers}</td><td>${r.estimatedSf}</td><td>${r.crewDays}</td>
        <td>${money(r.laborCost)}</td><td>${r.fieldVerified}</td><td>${r.completedDate || ''}</td><td>${r.notes || ''}</td>
      </tr>
    `).join('')}</tbody>
  `;
}

function render() {
  renderKpis();
  renderChart();
  renderRepairMatrix();
  renderList();
  renderDetail();
  renderActivity();
  renderOfficeTable();
}

async function saveRepair(event) {
  event.preventDefault();
  const payload = {
    id: document.getElementById('repairId').value,
    status: document.getElementById('statusSelect').value,
    fieldVerified: document.getElementById('verifiedSelect').value,
    completedDate: document.getElementById('completedDateInput').value,
    enteredBy: document.getElementById('enteredByInput').value,
    notes: document.getElementById('notesInput').value
  };
  const res = await fetch('/api/vn84b/emergency-steel-repairs/repair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Could not save repair'}));
    throw new Error(err.error || 'Could not save repair');
  }
  emergencyData = await res.json();
  document.getElementById('saveMessage').textContent = 'Emergency steel repair saved.';
  renderFilters();
  render();
  setTimeout(()=>document.getElementById('saveMessage').textContent='', 2500);
}

['searchInput','pierFilter','spanFilter','statusFilter'].forEach(id => {
  document.getElementById(id).addEventListener('input', render);
  document.getElementById(id).addEventListener('change', render);
});
document.getElementById('repairForm').addEventListener('submit', event => saveRepair(event).catch(err => alert(err.message)));
document.getElementById('refreshBtn').addEventListener('click', loadEmergency);
document.getElementById('printBtn').addEventListener('click', () => window.print());

loadEmergency().catch(err => alert(err.message));
