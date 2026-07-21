const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let paymentChart = null;
const PAYMENT_PASSWORD_KEY = 'vn84bPaymentPassword';

function sectionById(data, id) {
  return (data.sections || []).find(s => s.id === id) || { name: id, color: '#64748b' };
}

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10;
}

function getStageCompleted(area, stage) {
  return (area.items || [])
    .filter(i => i.stage === stage)
    .reduce((sum, i) => sum + Number(i.completed || 0), 0);
}

function areaPhysicalProgress(area) {
  const stages = area.stages || [];
  const totalSteps = Number(area.total || 0) * stages.length;
  const completedSteps = stages.reduce((sum, stage) => sum + getStageCompleted(area, stage), 0);
  return { completedSteps, totalSteps, percent: pct(completedSteps, totalSteps) };
}

function sectionProgress(section, trackerData) {
  const ids = section.progressAreaIds || [];
  if (!ids.length || !trackerData || !Array.isArray(trackerData.areas)) {
    return { linked: false, percent: 0, completedSteps: 0, totalSteps: 0, sourceNames: [] };
  }

  const linkedAreas = trackerData.areas.filter(area => ids.includes(area.id) && area.trackingActive !== false);
  const totals = linkedAreas.reduce((acc, area) => {
    const p = areaPhysicalProgress(area);
    acc.completedSteps += p.completedSteps;
    acc.totalSteps += p.totalSteps;
    acc.sourceNames.push(area.name);
    return acc;
  }, { completedSteps: 0, totalSteps: 0, sourceNames: [] });

  return {
    linked: linkedAreas.length > 0,
    percent: pct(totals.completedSteps, totals.totalSteps),
    completedSteps: totals.completedSteps,
    totalSteps: totals.totalSteps,
    sourceNames: totals.sourceNames
  };
}

async function loadTrackerForProgress() {
  const res = await fetch('/api/vn84b', { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function getSavedPaymentPassword() {
  return sessionStorage.getItem(PAYMENT_PASSWORD_KEY) || '';
}

function setPaymentLocked(isLocked) {
  document.body.classList.toggle('payment-locked', isLocked);
  const input = document.getElementById('paymentPasswordInput');
  if (isLocked && input) setTimeout(() => input.focus(), 50);
}

async function loadPaymentBreakdown(password) {
  const res = await fetch('/api/vn84b/payment-breakdown', {
    cache: 'no-store',
    headers: { 'x-vn84b-payment-password': password || getSavedPaymentPassword() }
  });
  if (res.status === 401) {
    sessionStorage.removeItem(PAYMENT_PASSWORD_KEY);
    setPaymentLocked(true);
    throw new Error('Payment breakdown is locked.');
  }
  if (!res.ok) throw new Error('Could not load payment breakdown data');
  return res.json();
}

function renderKpis(data, trackerData) {
  document.getElementById('contractTotal').textContent = money.format(data.contractTotal || 0);
  document.getElementById('paymentPeriod').textContent = data.period || '—';
  document.getElementById('officeNote').textContent = data.officeNote || '';

  const grid = document.getElementById('paymentKpis');
  grid.innerHTML = (data.sections || []).map(sec => {
    const contractPct = data.contractTotal ? ((sec.total || 0) / data.contractTotal * 100) : 0;
    const progress = sectionProgress(sec, trackerData);
    const earned = progress.linked ? (sec.total || 0) * (progress.percent / 100) : 0;
    const remaining = progress.linked ? Math.max((sec.total || 0) - earned, 0) : null;
    const progressLabel = progress.linked ? `${progress.percent.toFixed(1)}% field progress` : 'No field tracker tie-in yet';
    const earnedLabel = progress.linked ? `${money.format(earned)} earned · ${money.format(remaining)} remaining` : 'Office value only';

    return `
      <article class="payment-kpi" style="--pay-color:${sec.color};">
        <span>${sec.name}</span>
        <strong>${money.format(sec.total || 0)}</strong>
        <em>${contractPct.toFixed(1)}% of contract</em>
        <p><b>${progressLabel}</b></p>
        <small>${earnedLabel}</small>
      </article>
    `;
  }).join('');
}

function renderChart(data, trackerData) {
  const ctx = document.getElementById('paymentChart');
  if (paymentChart) paymentChart.destroy();
  paymentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: (data.sections || []).map(s => s.name),
      datasets: [
        {
          label: 'Contract value',
          data: (data.sections || []).map(s => s.total || 0),
          backgroundColor: (data.sections || []).map(s => s.color || '#64748b')
        },
        {
          label: 'Earned to date',
          data: (data.sections || []).map(s => {
            const progress = sectionProgress(s, trackerData);
            return progress.linked ? (s.total || 0) * (progress.percent / 100) : 0;
          }),
          backgroundColor: '#0f172a'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { callbacks: { label: ctx => money.format(ctx.parsed.y || 0) } }
      },
      scales: {
        y: { ticks: { callback: value => money.format(value) } },
        x: { ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 } }
      }
    }
  });
}

function renderEarnedProgress(data, trackerData) {
  const body = document.getElementById('earnedProgressBody');
  if (!body) return;

  body.innerHTML = (data.sections || []).map(sec => {
    const contractPct = data.contractTotal ? ((sec.total || 0) / data.contractTotal * 100) : 0;
    const progress = sectionProgress(sec, trackerData);
    const earned = progress.linked ? (sec.total || 0) * (progress.percent / 100) : 0;
    const remaining = progress.linked ? Math.max((sec.total || 0) - earned, 0) : null;
    const sourceText = progress.linked ? progress.sourceNames.join(', ') : 'Not tied to a field tracker yet';

    return `
      <tr>
        <td><span class="pay-color-pill" style="--pay-color:${sec.color};">${sec.name}</span></td>
        <td><strong>${money.format(sec.total || 0)}</strong></td>
        <td>${contractPct.toFixed(1)}%</td>
        <td>${progress.linked ? progress.percent.toFixed(1) + '%' : '—'}</td>
        <td>${progress.linked ? money.format(earned) : '—'}</td>
        <td>${progress.linked ? money.format(remaining) : '—'}</td>
        <td>${sourceText}</td>
      </tr>
    `;
  }).join('');
}


function renderBearingBreakdown(data) {
  const body = document.getElementById('bearingBreakdownBody');
  if (!body) return;
  body.innerHTML = (data.bearingBreakdown || []).map(row => {
    const area = (data.officialAreas || []).find(a => a.id === row.officialAreaId) || {};
    return `
      <tr>
        <td><span class="pay-color-pill" style="--pay-color:${area.color || '#64748b'};">${row.area}</span></td>
        <td>${row.trackerName || ''}</td>
        <td><strong>${Number(row.fieldQuantity || 0).toLocaleString()}</strong> ${row.unit || ''}</td>
        <td><strong>${Number(row.billingQuantity || 0).toLocaleString()}</strong> ${row.unit || ''}</td>
        <td>${row.source || ''}</td>
        <td>${row.note || ''}</td>
      </tr>
    `;
  }).join('');
}


function renderItems(data) {
  const body = document.getElementById('paymentItemsBody');
  body.innerHTML = (data.items || []).map(item => {
    const sec = sectionById(data, item.sectionId);
    return `
      <tr>
        <td><strong>${item.item}</strong></td>
        <td><span class="pay-color-pill" style="--pay-color:${sec.color};">${sec.name}</span></td>
        <td>${item.description || ''}</td>
        <td><strong>${money.format(item.amount || 0)}</strong></td>
        <td>${item.trackerLink || ''}</td>
      </tr>
    `;
  }).join('');

  const defoe = document.getElementById('defoeBody');
  defoe.innerHTML = (data.defoeComparison || []).map(row => `
    <tr>
      <td>${row.area || ''}</td>
      <td>${row.bidItem || ''}</td>
      <td>${row.description || ''}</td>
      <td>${Number(row.quantity || 0).toLocaleString()}</td>
      <td>${row.unit || ''}</td>
      <td>${row.note || ''}</td>
    </tr>
  `).join('');
}

async function unlockAndLoad(password) {
  const data = await loadPaymentBreakdown(password);
  const trackerData = await loadTrackerForProgress();
  if (password) sessionStorage.setItem(PAYMENT_PASSWORD_KEY, password);
  setPaymentLocked(false);
  renderKpis(data, trackerData);
  renderEarnedProgress(data, trackerData);
  renderChart(data, trackerData);
  renderBearingBreakdown(data);
  renderItems(data);
}

async function init() {
  const form = document.getElementById('paymentPasswordForm');
  const input = document.getElementById('paymentPasswordInput');
  const error = document.getElementById('paymentPasswordError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    try {
      await unlockAndLoad(input.value.trim());
      input.value = '';
    } catch (err) {
      error.hidden = false;
    }
  });

  document.getElementById('printPaymentBtn').addEventListener('click', () => window.print());

  const saved = getSavedPaymentPassword();
  if (!saved) {
    setPaymentLocked(true);
    return;
  }

  try {
    await unlockAndLoad(saved);
  } catch (err) {
    setPaymentLocked(true);
  }
}

init();
