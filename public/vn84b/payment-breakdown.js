const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let paymentChart = null;
const PAYMENT_PASSWORD_KEY = 'vn84bPaymentPassword';

function sectionById(data, id) {
  return (data.sections || []).find(s => s.id === id) || { name: id, color: '#64748b' };
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

function renderKpis(data) {
  document.getElementById('contractTotal').textContent = money.format(data.contractTotal || 0);
  document.getElementById('paymentPeriod').textContent = data.period || '—';
  document.getElementById('officeNote').textContent = data.officeNote || '';

  const grid = document.getElementById('paymentKpis');
  grid.innerHTML = (data.sections || []).map(sec => {
    const pct = data.contractTotal ? ((sec.total || 0) / data.contractTotal * 100) : 0;
    return `
      <article class="payment-kpi" style="--pay-color:${sec.color};">
        <span>${sec.name}</span>
        <strong>${money.format(sec.total || 0)}</strong>
        <em>${pct.toFixed(1)}% of contract</em>
        <p>${sec.description || ''}</p>
      </article>
    `;
  }).join('');
}

function renderChart(data) {
  const ctx = document.getElementById('paymentChart');
  if (paymentChart) paymentChart.destroy();
  paymentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: (data.sections || []).map(s => s.name),
      datasets: [{
        label: 'Billing value',
        data: (data.sections || []).map(s => s.total || 0),
        backgroundColor: (data.sections || []).map(s => s.color || '#64748b')
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => money.format(ctx.parsed.y || 0) } }
      },
      scales: {
        y: { ticks: { callback: value => money.format(value) } },
        x: { ticks: { autoSkip: false, maxRotation: 0, minRotation: 0 } }
      }
    }
  });
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
  if (password) sessionStorage.setItem(PAYMENT_PASSWORD_KEY, password);
  setPaymentLocked(false);
  renderKpis(data);
  renderChart(data);
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
