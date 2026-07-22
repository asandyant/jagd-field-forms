let trackerData = null;
let areaChart = null;

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (done, total) => total > 0 ? Math.min(100, Math.round((done / total) * 1000) / 10) : 0;
const activeAreas = data => (data.areas || []).filter(a => a.trackingActive !== false && !a.archived);

function completed(area, stage, subAreaId = null) {
  return (area.items || []).filter(i => i.stage === stage && (!subAreaId || i.subAreaId === subAreaId))
    .reduce((sum, i) => sum + Number(i.completed || 0), 0);
}
function stagePercent(area, stage, subAreaId = null) {
  const sub = subAreaId && (area.subAreas || []).find(s => s.id === subAreaId);
  return pct(completed(area, stage, subAreaId), Number(sub ? sub.total : area.total));
}
function areaPercent(area) {
  const weights = Array.isArray(area.stageWeights) && area.stageWeights.length === area.stages.length
    ? area.stageWeights : area.stages.map(() => 100 / Math.max(area.stages.length, 1));
  return Math.min(100, Math.round(area.stages.reduce((sum, stage, i) => sum + stagePercent(area, stage) * weights[i] / 100, 0) * 10) / 10);
}
function overallPercent(data) {
  const areas = activeAreas(data);
  if (!areas.length) return 0;
  const weighted = areas.reduce((a, area) => { a.done += areaPercent(area) * Number(area.total || 0); a.total += Number(area.total || 0); return a; }, {done:0,total:0});
  return pct(weighted.done, weighted.total * 100);
}
function areaMeta(id) { return (trackerData.officialAreas || []).find(a => a.id === id) || {}; }
function fmtDate(v) { return v ? new Date(v).toLocaleString() : ''; }

async function loadData() {
  const res = await fetch('/api/vn84b', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load tracker data');
  trackerData = await res.json();
  render();
}
function render() {
  document.getElementById('overallPercent').textContent = `${overallPercent(trackerData)}%`;
  renderAreaNav(); renderChart(); renderAreas(); renderSelects(); renderLogs();
}
function renderAreaNav() {
  const grid = document.getElementById('officialAreaGrid');
  grid.innerHTML = (trackerData.officialAreas || []).filter(a => a.id !== 'general').map(meta => {
    const scopes = (trackerData.areas || []).filter(a => a.officialAreaId === meta.id && !a.archived);
    const active = scopes.filter(a => a.trackingActive !== false);
    const avg = active.length ? Math.round(active.reduce((s,a)=>s+areaPercent(a),0)/active.length*10)/10 : 0;
    return `<a class="official-area-card" href="#${esc(meta.id)}" style="--area-color:${esc(meta.color)};--area-soft:${esc(meta.soft)}"><strong>${esc(meta.shortName)}</strong><span>${scopes.length} contract items</span><b>${avg}% active progress</b></a>`;
  }).join('');
}
function renderChart() {
  const metas = (trackerData.officialAreas || []).filter(a => a.id !== 'general');
  const values = metas.map(meta => {
    const scopes = activeAreas(trackerData).filter(a => a.officialAreaId === meta.id);
    return scopes.length ? Math.round(scopes.reduce((s,a)=>s+areaPercent(a),0)/scopes.length*10)/10 : 0;
  });
  if (areaChart) areaChart.destroy();
  areaChart = new Chart(document.getElementById('areaChart'), {type:'bar',data:{labels:metas.map(m=>`Area ${m.letter}`),datasets:[{label:'Production progress',data:values,backgroundColor:metas.map(m=>m.color)}]},options:{responsive:true,indexAxis:'y',scales:{x:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw}% complete`}}}}});
}
function stageBars(area) {
  return area.stages.map(stage => { const p=stagePercent(area,stage); return `<div class="stage-row"><span>${esc(stage)}</span><div class="bar"><i style="width:${p}%"></i></div><b>${p}%</b></div>`; }).join('');
}
function renderAreas() {
  const list=document.getElementById('areaList');
  list.innerHTML=(trackerData.officialAreas || []).map(meta=>{
    const scopes=(trackerData.areas||[]).filter(a=>a.officialAreaId===meta.id&&!a.archived);
    if(!scopes.length)return '';
    return `<section id="${esc(meta.id)}" class="official-area-section" style="--area-color:${esc(meta.color)};--area-soft:${esc(meta.soft)}"><header><div><span>${esc(meta.shortName)}</span><h2>${esc(meta.name)}</h2></div></header><div class="contract-grid">${scopes.map(area=>`<details class="contract-card" ${area.trackingActive!==false?'open':''}><summary><div><small>Contract Item ${esc(area.contractItem)}</small><h3>${esc(area.name.replace(/^Item \d+ — /,''))}</h3><p>${esc(area.description)}</p></div><strong>${areaPercent(area)}%</strong></summary><div class="contract-body">${stageBars(area)}<p class="quantity-line">Field quantity: <b>${Number(area.fieldQuantity??area.total).toLocaleString()} ${esc(area.unitLabel)}</b>${area.billingQuantity!=null&&area.billingQuantity!==area.fieldQuantity?' · Separate office billing quantity maintained':''}</p>${area.subAreas?`<div class="subarea-grid">${area.subAreas.map(s=>`<span>${esc(s.name)} <b>${s.total}</b></span>`).join('')}</div>`:''}<span class="status-pill">${esc(area.trackingStatus||'Not Started')}</span></div></details>`).join('')}</div></section>`;
  }).join('');
}
function renderSelects(){
  const area=document.getElementById('areaSelect'), current=area.value;
  area.innerHTML=(trackerData.areas||[]).filter(a=>!a.archived).map(a=>`<option value="${esc(a.id)}">Item ${esc(a.contractItem)} — ${esc(a.name.replace(/^Item \d+ — /,''))}</option>`).join('');
  if(current&&(trackerData.areas||[]).some(a=>a.id===current))area.value=current;
  updateStageSelect();
  const notes=document.getElementById('noteAreaSelect'); notes.innerHTML='<option value="">General</option>'+area.innerHTML;
}
function updateStageSelect(){
  const area=(trackerData.areas||[]).find(a=>a.id===document.getElementById('areaSelect').value)||(trackerData.areas||[])[0]; if(!area)return;
  const stage=document.getElementById('stageSelect'); stage.innerHTML=area.stages.map(s=>`<option>${esc(s)}</option>`).join('');
  const subLabel=document.getElementById('subAreaLabel'), sub=document.getElementById('subAreaSelect');
  if(area.subAreas?.length){subLabel.style.display='';sub.required=true;sub.innerHTML=area.subAreas.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${s.total}</option>`).join('');}else{subLabel.style.display='none';sub.required=false;sub.innerHTML='';}
  updateLimit();
}
function updateLimit(){
  const area=(trackerData.areas||[]).find(a=>a.id===document.getElementById('areaSelect').value); if(!area)return;
  const sub=(area.subAreas||[]).find(s=>s.id===document.getElementById('subAreaSelect').value), stage=document.getElementById('stageSelect').value;
  const max=Number(sub?sub.total:area.total), now=completed(area,stage,sub?.id||null), input=document.getElementById('completedInput'); input.max=max;input.value=now;
  document.getElementById('completedHelp').textContent=`${stage}: ${now} of ${max} ${area.unitLabel}. Enter the total completed to date.`;
}
function renderLogs(){
  document.getElementById('dailyLog').innerHTML=(trackerData.dailyLog||[]).slice(0,25).map(x=>`<div class="log-item"><strong>${esc(x.areaName)} — ${esc(x.stage)}</strong><span>${x.completed} of ${x.total} · ${esc(x.enteredBy||'Unknown')} · ${fmtDate(x.timestamp)}</span>${x.note?`<p>${esc(x.note)}</p>`:''}</div>`).join('')||'<p>No production entries yet.</p>';
  document.getElementById('notesList').innerHTML=(trackerData.notes||[]).slice(0,20).map(x=>`<div class="log-item"><strong>${esc(x.areaName||'General')}</strong><span>${esc(x.enteredBy||'Unknown')} · ${fmtDate(x.timestamp)}</span><p>${esc(x.note)}</p></div>`).join('')||'<p>No notes yet.</p>';
}

document.getElementById('areaSelect').addEventListener('change',updateStageSelect);document.getElementById('stageSelect').addEventListener('change',updateLimit);document.getElementById('subAreaSelect').addEventListener('change',updateLimit);
document.getElementById('refreshBtn').addEventListener('click',loadData);
document.getElementById('backupBtn').addEventListener('click',()=>location.href='/api/vn84b/backup');
document.getElementById('restoreBtn').addEventListener('click',()=>document.getElementById('restoreFile').click());
document.getElementById('restoreFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const body=JSON.parse(await f.text());const r=await fetch('/api/vn84b/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('Restore failed');await loadData();});
document.getElementById('progressForm').addEventListener('submit',async e=>{e.preventDefault();const body={areaId:areaSelect.value,subAreaId:subAreaSelect.value,stage:stageSelect.value,completed:Number(completedInput.value),enteredBy:enteredByInput.value.trim(),note:noteInput.value.trim()};const r=await fetch('/api/vn84b/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const out=await r.json();if(!r.ok)throw new Error(out.error||'Save failed');trackerData=out;document.getElementById('saveMessage').textContent='Progress saved.';render();});
document.getElementById('noteForm').addEventListener('submit',async e=>{e.preventDefault();const r=await fetch('/api/vn84b/note',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({areaId:noteAreaSelect.value,enteredBy:noteEnteredByInput.value.trim(),note:fieldNoteInput.value.trim()})});const out=await r.json();if(!r.ok)throw new Error(out.error||'Note failed');trackerData=out;fieldNoteInput.value='';render();});
loadData().catch(err=>{document.body.innerHTML=`<main class="panel"><h1>VN84-B could not load</h1><p>${esc(err.message)}</p></main>`});
