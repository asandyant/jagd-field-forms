const app = document.getElementById('app');
const logo = '/assets/jagd-logo.png';
let currentPrint = '';
let pirMixCount = 1;
const signatureStore = {};


const mewpQuestions = [
  'Is the machine’s exterior in safe condition?',
  'Are the engine, battery, fuel, and fluid systems in safe condition?',
  'Are the hydraulic and structural components in safe condition?',
  'Is the work platform safe and properly equipped?',
  'Does the unit start and run properly?',
  'Do all movement, function, and safety controls work properly?',
  'Is the worksite safe for operation?',
  'Were any issues found that need correction before use?'
];

const pirHoldPoints = [
  '1. Pre Surface Preparation / Condition and Cleanliness',
  '2. Surface Preparation Monitoring',
  '3. Post Surface Preparation / Cleanliness and Profile',
  '4. Pre Application Prep / Surface Cleanliness',
  '5. Application Monitoring / Ambient Conditions',
  '6. Post Application / Application Defects',
  '7. Post Cure / Dry Film Thickness',
  '8. Nonconformance / Corrective Actions Follow-up',
  '9. Final Inspection',
  '10. Piece Markings Per Contract Drawings'
];

function esc(v){return String(v ?? '').replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));}
function val(id){const el=document.getElementById(id); return el ? el.value.trim() : '';}
function checked(name){const el=document.querySelector(`[name="${name}"]:checked`); return el ? el.value : '';}
function setPrint(html){document.querySelectorAll('.printPage').forEach(x=>x.remove()); const div=document.createElement('div'); div.className='printPage'; div.innerHTML=html; document.body.appendChild(div); currentPrint=html;}
function field(id,label,type='text',extra=''){return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}></div>`;}
function textarea(id,label){return `<div><label for="${id}">${label}</label><textarea id="${id}"></textarea></div>`;}
function selectField(id,label,opts){return `<div><label for="${id}">${label}</label><select id="${id}">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;}
function radioBlock(name){return `<div class="choiceBtns"><label><input type="radio" name="${name}" value="YES">YES</label><label><input type="radio" name="${name}" value="NO">NO</label><label><input type="radio" name="${name}" value="N/A">N/A</label></div>`;}
function photoInput(id,label='Photos / attached pages'){return `<div><label for="${id}">${label}</label><input id="${id}" type="file" accept="image/*,.pdf" multiple><p class="tiny">Photos can be attached and will save with the submission. Image photos will also show in print preview.</p><div id="${id}Preview" class="photoGrid"></div></div>`;}
function setupPhotoPreview(inputId){const input=document.getElementById(inputId), preview=document.getElementById(inputId+'Preview'); if(!input||!preview)return; input.addEventListener('change',()=>{preview.innerHTML=''; [...input.files].forEach(f=>{ if(f.type.startsWith('image/')){ const img=document.createElement('img'); img.src=URL.createObjectURL(f); preview.appendChild(img);} else { const p=document.createElement('div'); p.className='notice'; p.textContent=f.name; preview.appendChild(p);} });});}

function mixBlockForm(i){
  return `<div class="panel innerPanel mixBlock" data-mix="${i}"><h3>Mix / Application Block ${i}</h3><div class="grid four">${field('pirMixLoc'+i,'Location')}${field('pirMixTime'+i,'Time','time')}${selectField('pirMixWitness'+i,'Mix Witnessed and Acceptable',['','YES','NO','N/A'])}${field('pirBatchA'+i,'Batch # A')}${field('pirMfgA'+i,'A Mfg Date')}${field('pirShelfA'+i,'A Shelf Life')}${field('pirBatchB'+i,'Batch # B')}${field('pirMfgB'+i,'B Mfg Date')}${field('pirShelfB'+i,'B Shelf Life')}${field('pirDust'+i,'Dust')}${field('pirThinner'+i,'Thinner Type')}${field('pirVolume'+i,'% By Volume')}${field('pirMfr'+i,'Mfr')}${field('pirProd'+i,'Prod. Name')}${field('pirColor'+i,'Color')}${field('pirKit'+i,'Kit Sz/Cond.')}${field('pirPot'+i,'Pot Life')}${field('pirShelf'+i,'Shelf Life')}${field('pirInduction'+i,'Induction Time')}${field('pirTemp'+i,'Temperature')}${field('pirQty'+i,'Quantity Mixed')}${field('pirStart'+i,'Start')}${field('pirFinish'+i,'Finish / Stop')}${field('pirGallons'+i,'Total Gallons')}${field('pirSystem'+i,'Coat / System')}${field('pirMethod'+i,'Application Method')}${field('pirGunTip'+i,'Gun/Tip Size')}${field('pirElapsed'+i,'Time elapsed between coats')}${field('pirDFTPrev'+i,'DFT Avg. Previous Coat')}</div></div>`;
}
function renderPirMixBlocks(){
  const box=document.getElementById('pirMixBlocks');
  if(!box) return;
  box.innerHTML=Array.from({length:pirMixCount},(_,idx)=>mixBlockForm(idx+1)).join('');
  const btn=document.getElementById('addPirMixBlock');
  if(btn) btn.style.display = pirMixCount >= 4 ? 'none' : 'inline-block';
}
function sigField(id,label){
  return `<div class="signatureWrap"><label>${label}</label><button type="button" class="btn light signatureBtn" data-sig="${id}" data-label="${esc(label)}">Sign with finger / mouse</button><input id="${id}" type="text" placeholder="Typed name, optional"><div id="${id}Preview" class="signaturePreview">No signature captured</div></div>`;
}
function initSignatureButtons(){
  document.querySelectorAll('.signatureBtn').forEach(btn=>btn.onclick=()=>openSignatureModal(btn.dataset.sig, btn.dataset.label || 'Signature'));
}
function openSignatureModal(targetId, title){
  const old=document.getElementById('sigModal'); if(old) old.remove();
  const div=document.createElement('div');
  div.id='sigModal'; div.className='sigModal';
  div.innerHTML=`<div class="sigBox"><h2>${esc(title)}</h2><p class="tiny">Use your finger on a phone/tablet, or your mouse on a computer.</p><canvas id="sigCanvas" width="720" height="260"></canvas><div class="actions"><button class="btn" id="sigSave">Use Signature</button><button class="btn light" id="sigClear">Clear</button><button class="btn danger" id="sigCancel">Cancel</button></div></div>`;
  document.body.appendChild(div);
  const canvas=document.getElementById('sigCanvas'); const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.lineCap='round';
  let drawing=false;
  const pos=(e)=>{const r=canvas.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:(t.clientX-r.left)*(canvas.width/r.width), y:(t.clientY-r.top)*(canvas.height/r.height)};};
  const start=e=>{e.preventDefault(); drawing=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);};
  const move=e=>{if(!drawing)return; e.preventDefault(); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke();};
  const end=e=>{if(e) e.preventDefault(); drawing=false;};
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end,{once:false});
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end,{passive:false});
  document.getElementById('sigClear').onclick=()=>{ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);};
  document.getElementById('sigCancel').onclick=()=>div.remove();
  document.getElementById('sigSave').onclick=()=>{signatureStore[targetId]=canvas.toDataURL('image/png'); const prev=document.getElementById(targetId+'Preview'); if(prev) prev.innerHTML=`<img src="${signatureStore[targetId]}" alt="Signature">`; div.remove();};
}
function sigPrint(dataUrl, typed){return dataUrl ? `<img class="sigPrint" src="${dataUrl}">` : esc(typed || '');}


function home(){
  app.innerHTML=`<div class="container printOnly"><section class="hero"><div><h1>JAGD Field Forms</h1><p>Web-based inspection forms for JAGD Construction. Built for field use on phones, tablets, and desktops with printable report output.</p><div class="actions"><a class="btn" href="#/pir">Open PIR Questionnaire</a><a class="btn" href="#/mewp">Open MEWP Inspection</a><a class="btn light" href="#/submissions">Saved Submissions</a></div></div><img src="${logo}" alt="JAGD logo"></section><div class="cards"><div class="card"><h2>PIR Questionnaire</h2><p>Guided sections for project data, hold points, surface prep, instruments, ambient readings, mixing/application, caulking, attachments, and signatures.</p></div><div class="card"><h2>MEWP Inspection</h2><p>Checklist form using the requested eight MEWP inspection questions with pass/fail/N/A, notes, corrective action, photos, signature, and print output.</p></div></div></div>`;
}

function pirForm(){
  app.innerHTML=`<div class="container printOnly"><h1>Paint Inspection Report Questionnaire</h1><div class="pirOnePage">
    <div id="pir-project" class="panel"><h2>Project Information</h2><div class="grid three">${field('pirProject','Project')} ${field('pirReportDate','Report Date','date')} ${field('pirDay','Day','text','readonly')} ${field('pirWeatherAM','Weather AM')} ${field('pirWeatherPM','Weather PM')} ${field('pirInspectionReport','Inspection Report #')}</div></div>
    <div id="pir-hold" class="panel"><h2>Hold Point Inspections Performed</h2><div class="grid two">${pirHoldPoints.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${q}</div>${radioBlock('pirHold'+i)}</div>`).join('')}</div></div>
    <div id="pir-surface" class="panel"><h2>Surface Cleanliness / Profile Measurement</h2><div class="grid three">${field('pirSurfacesPrepared','Surfaces Prepared Per Specification')} ${field('pirSSPC','SSPC/NACE SP')} ${field('pirSpecifiedProfile','Specified Profile')} ${field('pirProfileCheck','Profile Check')} ${selectField('pirAbrasiveTest','Abrasive Test Acceptable',['','YES','NO','N/A'])} ${selectField('pirBlotterTest','Blotter Test Acceptable',['','YES','NO','N/A'])} ${field('pirChloride1','Chloride ug/cm²')} ${field('pirChloride2','Chloride ug/cm²')} ${selectField('pirIllumination','Illumination Acceptable',['','YES','NO','N/A'])}</div></div>
    <div id="pir-testex" class="panel"><h2>Testex Tape Inserts</h2><div class="testexScreenGrid">${[1,2,3].map(i=>`<div class="testexCard"><div class="testexBox screen"><span>Insert Testex Tape Here</span></div>${field('pirTestexLoc'+i,'Tape '+i+' Location / Area')}${field('pirTestexReading'+i,'Tape '+i+' Profile Reading')}${field('pirTestexNotes'+i,'Tape '+i+' Notes')}</div>`).join('')}</div></div>
    <div id="pir-instruments" class="panel"><h2>Calibrated QC Equipment</h2><div class="grid three">${['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>`<div class="checkrow"><label>${n}</label>${selectField('pirInstYes'+i,'Status',['YES','NO','N/A'])}${field('pirInstSerial'+i,'Serial Number')}${i===4?field('pirPosiAdjust','PA-2 Adjustment made') : ''}</div>`).join('')}</div></div>
    <div id="pir-ambient" class="panel"><h2>Ambient Conditions</h2><div class="grid four">${[1,2,3,4].map(i=>`<div class="checkrow"><h3>Reading ${i}</h3>${field('pirAmbLoc'+i,'Location')}${field('pirAmbTime'+i,'Time','time')}${field('pirDry'+i,'Dry Bulb Temp')}${field('pirWet'+i,'Wet Bulb Temp')}${field('pirRH'+i,'% Relative Humidity')}${field('pirSurf'+i,'Surface Temp')}${field('pirDew'+i,'Dew Point')}${field('pirDiff'+i,'Surface Temp. - Dew Point')}</div>`).join('')}</div></div>
    <div id="pir-mixing" class="panel"><h2>Mixing / Application</h2><div id="pirMixBlocks"></div><div class="actions"><button type="button" class="btn light" id="addPirMixBlock">+ Add another Mix / Application Block</button></div></div>
    <div id="pir-caulk" class="panel"><h2>Caulking / Signatures</h2><div class="grid three">${field('pirCaulkLocation','Caulking Location')} ${field('pirCaulkNameBatch','Name / Batch')} ${field('pirTubeSize','Tube Size')} ${field('pirCaulkShelf','Shelf Life')} ${field('pirTotalUsed','Total Amount Used')} ${field('pirQCPrint','QC Print')} ${sigField('pirQCSignature','QC Signature')} ${sigField('pirQCSSignature','QCS Signature')}</div>${textarea('pirGeneralNotes','General Notes / Nonconformance / Corrective Actions')}<div class="actions"><button class="btn" id="pirPrintBtn">Preview / Print PIR</button><button class="btn warn" id="pirSaveBtn">Save Submission</button></div><div id="pirMsg"></div></div>
  </div></div>`;
  const dateEl=document.getElementById('pirReportDate');
  const dayEl=document.getElementById('pirDay');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value=''; return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); };
  dateEl.value=new Date().toISOString().slice(0,10);
  updateDay();
  dateEl.addEventListener('change', updateDay);
  pirMixCount=1; renderPirMixBlocks();
  document.getElementById('addPirMixBlock').onclick=()=>{pirMixCount=Math.min(4,pirMixCount+1); renderPirMixBlocks();};
  initSignatureButtons();
  document.getElementById('pirPrintBtn').onclick=(e)=>{e.preventDefault(); try{buildPirPrint(); requestAnimationFrame(()=>setTimeout(()=>window.print(),150));}catch(err){const msg=document.getElementById('pirMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);} };
  document.getElementById('pirSaveBtn').onclick=()=>saveForm('pir', collectPir(), 'pirPhotos', 'pirMsg');
}

function collectPir(){
 const data={project:val('pirProject'),reportDate:val('pirReportDate'),day:val('pirDay'),weatherAM:val('pirWeatherAM'),weatherPM:val('pirWeatherPM'),inspectionReport:val('pirInspectionReport'),attachedPages:'',page:'1',pageOf:'1',holdPoints:pirHoldPoints.map((q,i)=>({q,status:checked('pirHold'+i)})),surfacesPrepared:val('pirSurfacesPrepared'),sspc:val('pirSSPC'),specifiedProfile:val('pirSpecifiedProfile'),profileCheck:val('pirProfileCheck'),abrasiveTest:val('pirAbrasiveTest'),blotterTest:val('pirBlotterTest'),chloride1:val('pirChloride1'),chloride2:val('pirChloride2'),illumination:val('pirIllumination'),testex:[1,2,3].map(i=>({location:val('pirTestexLoc'+i),reading:val('pirTestexReading'+i),notes:val('pirTestexNotes'+i)})),posiAdjust:val('pirPosiAdjust'),generalNotes:val('pirGeneralNotes'),qcPrint:val('pirQCPrint'),qcSignature:val('pirQCSignature'),qcsSignature:val('pirQCSSignature'),caulking:{location:val('pirCaulkLocation'),nameBatch:val('pirCaulkNameBatch'),tubeSize:val('pirTubeSize'),shelf:val('pirCaulkShelf'),totalUsed:val('pirTotalUsed')}};
 data.instruments=['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>({name:n,status:val('pirInstYes'+i),serial:val('pirInstSerial'+i)}));
 data.ambient=[1,2,3,4].map(i=>({location:val('pirAmbLoc'+i),time:val('pirAmbTime'+i),dry:val('pirDry'+i),wet:val('pirWet'+i),rh:val('pirRH'+i),surface:val('pirSurf'+i),dew:val('pirDew'+i),diff:val('pirDiff'+i)}));
 data.mixing=Array.from({length:pirMixCount},(_,idx)=>idx+1).map(i=>({location:val('pirMixLoc'+i),time:val('pirMixTime'+i),witness:val('pirMixWitness'+i),batchA:val('pirBatchA'+i),mfgA:val('pirMfgA'+i),shelfA:val('pirShelfA'+i),batchB:val('pirBatchB'+i),mfgB:val('pirMfgB'+i),shelfB:val('pirShelfB'+i),dust:val('pirDust'+i),thinner:val('pirThinner'+i),volume:val('pirVolume'+i),mfr:val('pirMfr'+i),prod:val('pirProd'+i),color:val('pirColor'+i),kit:val('pirKit'+i),pot:val('pirPot'+i),shelf:val('pirShelf'+i),induction:val('pirInduction'+i),temp:val('pirTemp'+i),qty:val('pirQty'+i),start:val('pirStart'+i),finish:val('pirFinish'+i),gallons:val('pirGallons'+i),system:val('pirSystem'+i),method:val('pirMethod'+i),gunTip:val('pirGunTip'+i),elapsed:val('pirElapsed'+i),dftPrev:val('pirDFTPrev'+i)}));
 data.qcSignatureData=signatureStore.pirQCSignature || ''; data.qcsSignatureData=signatureStore.pirQCSSignature || ''; data.mixingCount=pirMixCount;
 return data;
}

function buildPirPrint(data=collectPir(), files=[]){
 const hp = data.holdPoints || [];
 const inst = data.instruments || [];
 const amb = data.ambient || [];
 const mix = data.mixing || [];
 const cell=(x)=>esc(x||'');
 const yes=(x)=> cell(x || 'YES');
 const mixBlock=(m)=>`<table class="pirTable"><tr><td colspan="6"><b>Location:</b> ${cell(m.location)}</td><td colspan="3"><b>Time:</b> ${cell(m.time)}</td></tr><tr><th colspan="3">Batch #'s</th><th colspan="6">Mix Witnessed and Acceptable ${cell(m.witness)}</th></tr><tr><td colspan="3">(A) ${cell(m.batchA)}</td><td colspan="3">Mfg Date ${cell(m.mfgA)}</td><td colspan="3">Shelf Life ${cell(m.shelfA)}</td></tr><tr><td colspan="3">(B) ${cell(m.batchB)}</td><td colspan="3">Mfg Date ${cell(m.mfgB)}</td><td colspan="3">Shelf Life ${cell(m.shelfB)}</td></tr><tr><td colspan="3">Dust ${cell(m.dust)}</td><td colspan="3">Thinner Type ${cell(m.thinner)}</td><td colspan="3">% By Volume ${cell(m.volume)}</td></tr><tr><td colspan="3">Mfr: ${cell(m.mfr)}</td><td colspan="3">Prod. Name: ${cell(m.prod)}</td><td colspan="3">Color: ${cell(m.color)}</td></tr><tr><td colspan="3">Kit Sz/Cond.: ${cell(m.kit)}</td><td colspan="3">Pot Life: ${cell(m.pot)}</td><td colspan="3">Shelf Life: ${cell(m.shelf)}</td></tr><tr><td colspan="3">Induction Time: ${cell(m.induction)}</td><td colspan="3">Temperature: ${cell(m.temp)}</td><td colspan="3">Quantity Mixed: ${cell(m.qty)}</td></tr><tr><th colspan="9" class="pirSection">Application</th></tr><tr><td colspan="3">Start: ${cell(m.start)}</td><td colspan="3">Finish/Stop: ${cell(m.finish)}</td><td colspan="3">Total Gallons: ${cell(m.gallons)}</td></tr><tr><td colspan="2">Coat: ${cell(m.system)}</td><td colspan="3">Method: ${cell(m.method)}</td><td colspan="2">Gun/Tip Size: ${cell(m.gunTip)}</td><td colspan="2">DFT Avg. Previous Coat: ${cell(m.dftPrev)}</td></tr><tr><td colspan="9">Time elapsed between coats: ${cell(m.elapsed)}</td></tr></table>`;
 const mixToPrint = (mix && mix.length ? mix : [{}]);
 const mixRowsHtml = [];
 for(let i=0;i<mixToPrint.length;i+=2){ mixRowsHtml.push(`<tr><th colspan="13" class="pirSection">Mixing / Application</th></tr><tr><td colspan="6">${mixBlock(mixToPrint[i]||{})}</td><td colspan="7">${mixToPrint[i+1]?mixBlock(mixToPrint[i+1]):''}</td></tr>`); }
 const html=`<div class="printSheet"><table class="pirTable"><tr><td colspan="4" rowspan="2"><b>Project:</b> ${cell(data.project)}<br><b>Report Date:</b> ${cell(data.reportDate)}<br><b>Attached Pages:</b> ${cell(data.attachedPages)}</td><td colspan="2" rowspan="2" class="pirCenter"><img class="pirLogo" src="${logo}"></td><td colspan="4" class="pirTitle">Paint Inspection Report</td><td colspan="3"><b>Weather:</b> AM ${cell(data.weatherAM)} &nbsp; PM ${cell(data.weatherPM)}</td></tr><tr><td colspan="2"><b>DAY:</b> ${cell(data.day)}</td><td colspan="2"><b>Inspection Report #:</b> ${cell(data.inspectionReport)}</td><td colspan="1"><b>Page:</b> ${cell(data.page)} of ${cell(data.pageOf)}</td></tr><tr><th colspan="4">Hold Point Inspections Performed</th><th colspan="4">Surface Cleanliness</th><th colspan="5">Profile Measurement</th></tr><tr><td colspan="4" rowspan="10">${pirHoldPoints.map((q,i)=>`${cell(q)} <b>${cell(hp[i]?.status)}</b>`).join('<br>')}</td><td colspan="4">Surfaces Prepared Per Specification: ${cell(data.surfacesPrepared)}<br>SSPC/NACE SP: ${cell(data.sspc)}<br>Profile Check: ${cell(data.profileCheck)}<br>Tape / Specified Profile: ${cell(data.specifiedProfile)}<br>Abrasive Test Acceptable: ${cell(data.abrasiveTest)}<br>Blotter Test Acceptable: ${cell(data.blotterTest)}<br>Chloride: ${cell(data.chloride1)} ug/cm²<br>Chloride: ${cell(data.chloride2)} ug/cm²<br>Illumination Acceptable: ${cell(data.illumination)}</td><td colspan="5" class="pirCenter"><div class="testexPrintStack">${[0,1,2].map(i=>`<div class="testexBox"><span>Insert Testex Tape Here</span></div><div class="testexMeta">${cell(data.testex?.[i]?.location)} ${cell(data.testex?.[i]?.reading)} ${cell(data.testex?.[i]?.notes)}</div>`).join('')}</div></td></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr></tr><tr><th colspan="13" class="pirSection">Instruments / Ambient Conditions</th></tr><tr><td colspan="5"><table class="pirTable">${inst.map(i=>`<tr><td>${yes(i.status)}</td><td>${cell(i.name)}</td><td>${cell(i.serial)}</td></tr>`).join('')}<tr><td>YES</td><td>Posi verified as per PA-2?</td><td>Adjustment made: ${cell(data.posiAdjust)}</td></tr></table></td><td colspan="8"><table class="pirTable"><tr><th>Location</th>${amb.map(a=>`<th>${cell(a.location)}</th>`).join('')}</tr><tr><td>Time</td>${amb.map(a=>`<td>${cell(a.time)}</td>`).join('')}</tr><tr><td>Dry Bulb Temp</td>${amb.map(a=>`<td>${cell(a.dry)}</td>`).join('')}</tr><tr><td>Wet Bulb Temp</td>${amb.map(a=>`<td>${cell(a.wet)}</td>`).join('')}</tr><tr><td>% Relative Humidity</td>${amb.map(a=>`<td>${cell(a.rh)}</td>`).join('')}</tr><tr><td>Surface Temp.</td>${amb.map(a=>`<td>${cell(a.surface)}</td>`).join('')}</tr><tr><td>Dew Point</td>${amb.map(a=>`<td>${cell(a.dew)}</td>`).join('')}</tr><tr><td>Surface Temp. - Dew Point</td>${amb.map(a=>`<td>${cell(a.diff)}</td>`).join('')}</tr></table></td></tr>${mixRowsHtml.join('')}<tr><th colspan="13" class="pirSection">Caulking</th></tr><tr><td colspan="3">Location: ${cell(data.caulking?.location)}</td><td colspan="3">Name/Batch: ${cell(data.caulking?.nameBatch)}</td><td colspan="2">Tube Size: ${cell(data.caulking?.tubeSize)}</td><td colspan="2">Shelf Life: ${cell(data.caulking?.shelf)}</td><td colspan="3">Total Amount Used: ${cell(data.caulking?.totalUsed)}</td></tr><tr><td colspan="4">QC Print: ${cell(data.qcPrint)}</td><td colspan="4">QC Signature: ${sigPrint(data.qcSignatureData,data.qcSignature)}</td><td colspan="5">QCS Signature: ${sigPrint(data.qcsSignatureData,data.qcsSignature)}</td></tr></table>${data.generalNotes?`<p><b>Notes / Nonconformance:</b> ${cell(data.generalNotes)}</p>`:''}<div class="pirSmall">PIR Revision 0</div></div>`;
 setPrint(html); return html;
}

function mewpForm(){
 app.innerHTML=`<div class="container printOnly"><h1>MEWP Daily Equipment Inspection</h1><div class="panel"><h2>Equipment / Job Information</h2><div class="grid three">${field('mewpJobName','Project / Job')} ${field('mewpLocation','Location / Work Area')} ${field('mewpDate','Inspection Date','date')} ${field('mewpTime','Inspection Time','time')} ${field('mewpInspector','Inspector Name')} ${field('mewpCompany','Company','text','value="JAGD Construction"')} ${field('mewpEquipmentId','Equipment ID / Unit #')} ${field('mewpMakeModel','Make / Model')} ${field('mewpSerial','Serial #')} ${field('mewpHours','Hour Meter')} ${field('mewpOperator','Operator')} ${selectField('mewpOverall','Overall Status',['Ready for Use','Do Not Use - Correction Required','N/A'])}</div></div><div class="panel"><h2>MEWP Checklist</h2>${mewpQuestions.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${i+1}. ${q}</div><div class="choiceBtns"><label><input type="radio" name="mewpQ${i}" value="PASS">PASS</label><label><input type="radio" name="mewpQ${i}" value="FAIL">FAIL</label><label><input type="radio" name="mewpQ${i}" value="N/A">N/A</label></div><label>Notes / corrective action</label><textarea id="mewpNote${i}"></textarea></div>`).join('')}</div><div class="panel"><h2>Pictures / Signature</h2>${photoInput('mewpPhotos','Pictures')}${textarea('mewpGeneralNotes','General Notes')}${sigField('mewpSignature','Inspector Signature')}<div class="actions"><button class="btn" id="mewpPrintBtn">Preview / Print MEWP</button><button class="btn warn" id="mewpSaveBtn">Save Submission</button></div><div id="mewpMsg"></div></div></div>`;
 setupPhotoPreview('mewpPhotos');
 document.getElementById('mewpDate').value=new Date().toISOString().slice(0,10);
 initSignatureButtons();
 document.getElementById('mewpPrintBtn').onclick=(e)=>{e.preventDefault(); try{buildMewpPrint(); requestAnimationFrame(()=>setTimeout(()=>window.print(),150));}catch(err){const msg=document.getElementById('mewpMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);} };
 document.getElementById('mewpSaveBtn').onclick=()=>saveForm('mewp', collectMewp(), 'mewpPhotos', 'mewpMsg');
}
function collectMewp(){return {jobName:val('mewpJobName'),location:val('mewpLocation'),inspectionDate:val('mewpDate'),time:val('mewpTime'),inspector:val('mewpInspector'),company:val('mewpCompany'),equipmentId:val('mewpEquipmentId'),makeModel:val('mewpMakeModel'),serial:val('mewpSerial'),hours:val('mewpHours'),operator:val('mewpOperator'),overall:val('mewpOverall'),generalNotes:val('mewpGeneralNotes'),signature:val('mewpSignature'),signatureData:signatureStore.mewpSignature||'',questions:mewpQuestions.map((q,i)=>({q,status:checked('mewpQ'+i),notes:val('mewpNote'+i)}))};}
function buildMewpPrint(data=collectMewp(), files=[]){const rows=(data.questions||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.q)}</td><td>${esc(x.status)}</td><td>${esc(x.notes)}</td></tr>`).join(''); const html=`<div class="mewpSheet"><div class="mewpHeader"><img src="${logo}"><div class="mewpTitle">MEWP Daily Equipment Inspection<br><span style="font-size:12px;font-weight:400">JAGD Construction</span></div></div><table class="printTable"><tr><td><b>Project / Job:</b> ${esc(data.jobName)}</td><td><b>Location:</b> ${esc(data.location)}</td><td><b>Date:</b> ${esc(data.inspectionDate)}</td></tr><tr><td><b>Inspector:</b> ${esc(data.inspector)}</td><td><b>Time:</b> ${esc(data.time)}</td><td><b>Overall Status:</b> ${esc(data.overall)}</td></tr><tr><td><b>Equipment ID:</b> ${esc(data.equipmentId)}</td><td><b>Make / Model:</b> ${esc(data.makeModel)}</td><td><b>Serial #:</b> ${esc(data.serial)}</td></tr><tr><td><b>Hour Meter:</b> ${esc(data.hours)}</td><td><b>Operator:</b> ${esc(data.operator)}</td><td><b>Company:</b> ${esc(data.company)}</td></tr></table><h3>Inspection Checklist</h3><table class="printTable"><tr><th>#</th><th>Inspection Item</th><th>Status</th><th>Notes / Corrective Action</th></tr>${rows}</table><p><b>General Notes:</b> ${esc(data.generalNotes)}</p><p><b>Inspector Signature:</b> ${data.signatureData?`<img class="sigPrint" src="${data.signatureData}">`:esc(data.signature)}</p>${files.length?`<h3>Pictures</h3><div class="photoPrint">${files.filter(f=>String(f.mimetype||'').startsWith('image/')).map(f=>`<img src="${f.url}">`).join('')}</div>`:''}</div>`; setPrint(html); return html;}
async function saveForm(type,data,photoInputId,msgId){const msg=document.getElementById(msgId); msg.innerHTML='<div class="notice">Saving...</div>'; const fd=new FormData(); fd.append('type',type); fd.append('data',JSON.stringify(data)); const inp=document.getElementById(photoInputId); if(inp){[...inp.files].forEach(f=>fd.append('photos',f));} try{const res=await fetch('/api/submissions',{method:'POST',body:fd}); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Save failed'); msg.innerHTML=`<div class="success">Saved for office records. ID: ${esc(json.id)}</div>`;}catch(e){msg.innerHTML=`<div class="notice">Could not save: ${esc(e.message)}. You can still print from this screen.</div>`;}}
async function submissions(){app.innerHTML=`<div class="container printOnly"><h1>Saved Submissions</h1><div class="actions"><button class="btn" onclick="loadSubmissions()">Refresh</button><a class="btn light" href="#/">Back</a></div><div id="savedList" class="panel">Loading...</div></div>`; await loadSubmissions();}
async function loadSubmissions(){const box=document.getElementById('savedList'); try{const rows=await (await fetch('/api/submissions')).json(); if(!rows.length){box.innerHTML='<p>No saved submissions yet.</p>';return;} box.innerHTML=`<table class="table"><tr><th>Date</th><th>Type</th><th>Title</th><th>Project</th><th>Open</th></tr>${rows.map(r=>`<tr><td>${new Date(r.createdAt).toLocaleString()}</td><td>${esc(r.type).toUpperCase()}</td><td>${esc(r.title)}</td><td>${esc(r.project)}</td><td><button class="btn small" onclick="openSubmission('${r.id}')">Open</button></td></tr>`).join('')}</table>`;}catch(e){box.innerHTML=`<div class="notice">Could not load saved submissions: ${esc(e.message)}</div>`;}}
async function openSubmission(id){const record=await (await fetch('/api/submissions/'+id)).json(); if(record.type==='pir') buildPirPrint(record.data, record.files||[]); else buildMewpPrint(record.data, record.files||[]); setTimeout(()=>window.print(), 100);}
function router(){const h=location.hash||'#/'; if(h.startsWith('#/pir')) pirForm(); else if(h.startsWith('#/mewp')) mewpForm(); else if(h.startsWith('#/submissions')) submissions(); else home();}

window.addEventListener('beforeprint',()=>{
  const h=location.hash||'#/';
  if(h.startsWith('#/pir') && document.getElementById('pirProject')) buildPirPrint();
  if(h.startsWith('#/mewp') && document.getElementById('mewpJobName')) buildMewpPrint();
});
window.addEventListener('hashchange',router); router();
