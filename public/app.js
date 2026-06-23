const app = document.getElementById('app');
const logo = '/assets/jagd-logo.png';
let currentPrint = '';
let pirMixCount = 1;
const PIR_MIX_MAX_BLOCKS = 8;
const PIR_MIX_FIELD_SUFFIXES = ['MixLoc','MixTime','MixWitness','BatchA','MfgA','ShelfA','BatchB','MfgB','ShelfB','Dust','Thinner','Volume','Mfr','Prod','Color','Kit','Pot','Shelf','Induction','Temp','Qty','Start','Finish','Gallons','System','Method','GunTip','Elapsed','DFTPrev'];
let pirAmbientCount = 1;
let pirAdditionalNotesOpen = false;
const signatureStore = {};

const PROJECT_OPTIONS = [
  '',
  '69th St. Transfer Bridge',
  'BA-2024-RE-102-CM Mid-Hudson Bridge',
  'BRX9579 - Boston Road Bridge',
  'BW96 & VN12 - Whitestone Hellman Platforms',
  'C35311 - Dyre Ave. Line',
  'D214898 - TANE22-29 Restani T&M',
  'D264324 - Westchester County Field Metalizing',
  'D264965 - Highway bridge repair W&W',
  'D265046 - Highway bridge repair W&W',
  'D265307 - WO03',
  'D265343 - Bove W&W 2',
  'Devon Bridge',
  'DMB-25-01',
  'FCC 2056',
  'Gold Star Memorial Bridge',
  'Governors Island',
  'Grand Concourse',
  'GW 244.289 Lemoine Ave',
  'GWB Cables',
  'HB1070MD - Macombs Dam Bridge',
  'HBKBQE - NYCDOT Bove',
  'K7279 & K6176 Gordie Howe',
  'Park Avenue',
  'Pulaski 8B',
  'QBB-2017',
  'RK19A',
  'RK90',
  'Sandy Relief',
  'VN81X',
  'VN-84B - Verrazzano Bridge Ramps Brooklyn',
  'Warehouse',
  'Other'
];
const DAILY_EQUIPMENT_URL = 'https://jagdconstruction.github.io/daily_equipment_inspection/';
let activeWorkers = [];
let serverMaterials = [];
let serverMaterialsLoaded = false;

function slug(text){
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || ('item-' + Date.now());
}
function cleanLocalValue(v){
  let s = String(v || '').trim();
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  return s;
}

function builtInWorkerRows(){
  return (Array.isArray(EMBEDDED_ACTIVE_WORKERS) ? EMBEDDED_ACTIVE_WORKERS : []).map((w, idx)=>({
    id: w.id || w.employeeId || slug(`${w.fullName||''}-${idx}`),
    firstName: w.firstName || '',
    lastName: w.lastName || '',
    fullName: w.fullName || `${w.firstName||''} ${w.lastName||''}`.trim(),
    class: w.class || '',
    local: cleanLocalValue(w.local),
    currentJob: w.currentJob || '',
    status: w.status || 'Active',
    employeeId: w.employeeId || '',
    trade: w.trade || '',
    crew: w.crew || '',
    disabled: !!w.disabled
  })).filter(w=>w.fullName);
}
function builtInMaterialRows(){
  const rows=[];
  if(Array.isArray(GWB_PIR_MATERIALS)) rows.push(...GWB_PIR_MATERIALS.map(m=>({...m, builtIn:true})));
  if(Array.isArray(DYRE_PIR_MATERIALS)) rows.push(...DYRE_PIR_MATERIALS.map(m=>({...m, builtIn:true})));
  return rows;
}
function dedupeMaterials(rows){
  const seen=new Set();
  return rows.filter(m=>{
    const key=String(m.id||`${m.project||''}|${m.prodName||m.description||''}|${m.batch||''}|${m.fileName||''}`).toLowerCase();
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const GWB_PIR_MATERIALS = [{"id":"carbothane-133-lh-grey-urethane-converter-8800-0909-22kd3966b-carbothane-s021730","label":"Hardener / Converter — Carbothane 133 LH Grey - Urethane Converter 8800 0909 — Batch 22KD3966B — Exp 10/2026","project":"GWB","mfr":"Carboline","prodName":"Carbothane 133 LH Grey - Urethane Converter 8800 0909","color":"Grey","component":"Hardener / Converter","itemNo":"","batch":"22KD3966B","mfgDate":"10-2022","expDate":"10/2026","shelfLife":"24 Months","fileName":"Carbothane s02173064 whs602121 exp 10.02.26.pdf"},{"id":"carbothane-133-lh-part-a-white-24er8542l-carbothane-s02173064-whs602121-exp-10-0","label":"Base / Paint — Carbothane 133 LH Part A White — Batch 24ER8542L — Exp 05/2026","project":"GWB","mfr":"Carboline","prodName":"Carbothane 133 LH Part A White","color":"White","component":"Base / Paint","itemNo":"","batch":"24ER8542L","mfgDate":"05-2024","expDate":"05/2026","shelfLife":"24 Months","fileName":"Carbothane s02173064 whs602121 exp 10.02.26.pdf"},{"id":"carbothane-converter-25ad0566b-25ad0566b-carbothane-converter-25ad0566b-exp-01-2","label":"Hardener / Converter — Carbothane converter 25AD0566B — Batch 25AD0566B — Exp 01/2027","project":"GWB","mfr":"Carboline","prodName":"Carbothane converter 25AD0566B","color":"","component":"Hardener / Converter","itemNo":"","batch":"25AD0566B","mfgDate":"","expDate":"01/2027","shelfLife":"","fileName":"Carbothane converter 25AD0566B exp 01.2027.pdf"},{"id":"carbothane-converter-25ed3778b-25ed3778b-carbothane-converter-25ed3778b-exp-05-2","label":"Hardener / Converter — Carbothane converter 25ED3778B — Batch 25ED3778B — Exp 05/2027","project":"GWB","mfr":"Carboline","prodName":"Carbothane converter 25ED3778B","color":"","component":"Hardener / Converter","itemNo":"","batch":"25ED3778B","mfgDate":"","expDate":"05/2027","shelfLife":"","fileName":"Carbothane converter 25ED3778B exp 05.2027.pdf"},{"id":"carbothane-part-a-white-24mr9663l-24mr9663l-carbothane-part-a-white-24mr9663l-ex","label":"Base / Paint — Carbothane part A white 24MR9663L — Batch 24MR9663L — Exp 12/2026","project":"GWB","mfr":"Carboline","prodName":"Carbothane part A white 24MR9663L","color":"White","component":"Base / Paint","itemNo":"","batch":"24MR9663L","mfgDate":"","expDate":"12/2026","shelfLife":"","fileName":"Carbothane part A white 24MR9663L exp 12.2026.pdf"},{"id":"861-epoxy-acceltor-a-coat-861-16-a060-mz0701je-1-accelerator-861-exp-06-30-30-mz","label":"Accelerator — 861 EPOXY ACCELTOR/A'COAT 861 16 A060 — Batch MZ0701JE-1 — Exp 06/30/2030","project":"GWB","mfr":"PPG","prodName":"861 EPOXY ACCELTOR/A'COAT 861 16 A060","color":"","component":"Accelerator","itemNo":"00334857(AT861/16)","batch":"MZ0701JE-1","mfgDate":"07/01/2025","expDate":"06/30/2030","shelfLife":"","fileName":"Accelerator 861 exp 06.30.30 MZ0701JE-1.pdf"},{"id":"a-coat-399-bas-buff-brown-01-b100-9344594163-a-coat-399-bas-buff-exp-11-08-26-93","label":"Base / Paint — A'COAT 399 BAS BUFF BROWN 01 B100 — Batch 9344594163 — Exp 11/08/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 399 BAS BUFF BROWN 01 B100","color":"Buff Brown","component":"Base / Paint","itemNo":"00334405(AT399-1/01)","batch":"9344594163","mfgDate":"11/09/2023","expDate":"11/08/2026","shelfLife":"","fileName":"A'COAT 399 bas buff exp 11.08.26 -9344594163.pdf"},{"id":"a-coat-399-bas-pearl-gray-01-b100-9337570903-a-coat-399-bas-pearl-gray-exp-11-06","label":"Base / Paint — A'COAT 399 BAS PEARL GRAY 01 B100 — Batch 9337570903 — Exp 11/06/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 399 BAS PEARL GRAY 01 B100","color":"Pearl Gray","component":"Base / Paint","itemNo":"00358728(AT399-23/01)","batch":"9337570903","mfgDate":"11/07/2023","expDate":"11/06/2026","shelfLife":"","fileName":"A'COAT 399 bas pearl gray exp 11.06.26 - 9337570903.pdf"},{"id":"a-coat-450h-sg-bas-pewter-cup-gr-01-a800-9331551139-a-coat-450hsg-bas-exp-08-22-","label":"Base / Paint — A'COAT 450H SG BAS PEWTER CUP GR 01 A800 — Batch 9331551139 — Exp 08/22/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 450H SG BAS PEWTER CUP GR 01 A800","color":"Pewter Cup Gray","component":"Base / Paint","itemNo":"00383985(AT45SG229/01)","batch":"9331551139","mfgDate":"08/23/2023","expDate":"08/22/2026","shelfLife":"","fileName":"A'COAT 450HSG bas exp 08.22.26 - 9331551139.pdf"},{"id":"a-coat-450hsa-hsg-hrd-04-a200-wb308710-a-coat-450hsg-hrd-exp-07-21-26-wb308710-p","label":"Hardener / Converter — A'COAT 450HSA/HSG HRD 04 A200 — Batch WB308710 — Exp 07/21/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 450HSA/HSG HRD 04 A200","color":"","component":"Hardener / Converter","itemNo":"00334660(AT45SS-B/04)","batch":"WB308710","mfgDate":"08/09/2023","expDate":"07/21/2026","shelfLife":"","fileName":"A'COAT 450HSG hrd exp 07.21.26 WB308710.pdf"},{"id":"a-coat-68hs-bas-01-a454-9425711009-a-coat-68hs-bas-exp-08-23-26-9425711009-pdf","label":"Base / Paint — A'COAT 68HS BAS 01 A454 — Batch 9425711009 — Exp 08/23/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS BAS 01 A454","color":"","component":"Base / Paint","itemNo":"00334801(AT68HS-A/01)","batch":"9425711009","mfgDate":"08/23/2024","expDate":"08/23/2026","shelfLife":"","fileName":"A'COAT 68HS bas exp 08.23.26 - 9425711009.pdf"},{"id":"a-coat-68hs-bas-01-a454-9440761640-a-coat-68hs-bas-exp-11-06-26-9440761640-pdf","label":"Base / Paint — A'COAT 68HS BAS 01 A454 — Batch 9440761640 — Exp 11/06/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS BAS 01 A454","color":"","component":"Base / Paint","itemNo":"00334801(AT68HS-A/01)","batch":"9440761640","mfgDate":"11/06/2024","expDate":"11/06/2026","shelfLife":"","fileName":"A'COAT 68HS bas exp 11.06.26 - 9440761640.pdf"},{"id":"a-coat-68hs-bas-01-a454-9440761641-a-coat-68hs-bas-exp-11-20-26-9440761641-pdf","label":"Base / Paint — A'COAT 68HS BAS 01 A454 — Batch 9440761641 — Exp 11/20/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS BAS 01 A454","color":"","component":"Base / Paint","itemNo":"00334801(AT68HS-A/01)","batch":"9440761641","mfgDate":"11/20/2024","expDate":"11/20/2026","shelfLife":"","fileName":"A'COAT 68HS bas exp 11.20.26 - 9440761641.pdf"},{"id":"a-coat-68hs-bas-01-a454-9450793244-a-coat-68hs-bas-exp-01-16-27-9450793244-pdf","label":"Base / Paint — A'COAT 68HS BAS 01 A454 — Batch 9450793244 — Exp 01/16/2027","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS BAS 01 A454","color":"","component":"Base / Paint","itemNo":"00334801(AT68HS-A/01)","batch":"9450793244","mfgDate":"01/16/2025","expDate":"01/16/2027","shelfLife":"","fileName":"A'COAT 68HS bas exp 01.16.27 -9450793244.pdf"},{"id":"a-coat-68hs-hrd-04-a200-9434739864-a-coat-68hs-hrd-exp-09-07-26-9434739864-pdf","label":"Hardener / Converter — A'COAT 68HS HRD 04 A200 — Batch 9434739864 — Exp 09/07/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS HRD 04 A200","color":"","component":"Hardener / Converter","itemNo":"00334805(AT68HS-B/04)","batch":"9434739864","mfgDate":"09/07/2024","expDate":"09/07/2026","shelfLife":"","fileName":"A'COAT 68HS hrd exp 09.07.26 - 9434739864.pdf"},{"id":"a-coat-68hs-hrd-04-a200-9447785363-a-coat-68hs-hrd-exp-11-23-26-9447785363-pdf","label":"Hardener / Converter — A'COAT 68HS HRD 04 A200 — Batch 9447785363 — Exp 11/23/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS HRD 04 A200","color":"","component":"Hardener / Converter","itemNo":"00334805(AT68HS-B/04)","batch":"9447785363","mfgDate":"11/23/2024","expDate":"11/23/2026","shelfLife":"","fileName":"A'COAT 68HS HRD exp 11.23.26 -9447785363.pdf"},{"id":"a-coat-68hs-hrd-04-a200-9524880263-a-coat-68hs-hrd-exp-07-02-27-9524880263-pdf","label":"Hardener / Converter — A'COAT 68HS HRD 04 A200 — Batch 9524880263 — Exp 07/02/2027","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS HRD 04 A200","color":"","component":"Hardener / Converter","itemNo":"00334805(AT68HS-B/04)","batch":"9524880263","mfgDate":"07/02/2025","expDate":"07/02/2027","shelfLife":"","fileName":"A'COAT 68HS hrd exp 07.02.27 - 9524880263.pdf"},{"id":"a-coat-68hs-powder-01-a330-z408014-a-coat-68hs-powder-exp-08-12-26-z408014-pdf","label":"Dust / Powder — A'COAT 68HS POWDER 01 A330 — Batch Z408014 — Exp 08/12/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS POWDER 01 A330","color":"","component":"Dust / Powder","itemNo":"00334808(AT68HS-P/01)","batch":"Z408014","mfgDate":"08/12/2024","expDate":"08/12/2026","shelfLife":"","fileName":"A'COAT 68HS powder exp 08.12.26 Z408014.pdf"},{"id":"a-coat-68hs-powder-01-a330-z411003-a-coat-68hs-powder-exp-10-28-26-z411003-pdf","label":"Dust / Powder — A'COAT 68HS POWDER 01 A330 — Batch Z411003 — Exp 10/28/2026","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS POWDER 01 A330","color":"","component":"Dust / Powder","itemNo":"00334808(AT68HS-P/01)","batch":"Z411003","mfgDate":"10/28/2024","expDate":"10/28/2026","shelfLife":"","fileName":"A'COAT 68HS powder exp 10.28.26 Z411003.pdf"},{"id":"a-coat-68hs-powder-01-a330-z501008-a-coat-68hs-powder-exp-01-15-27-z501008-pdf","label":"Dust / Powder — A'COAT 68HS POWDER 01 A330 — Batch Z501008 — Exp 01/15/2027","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS POWDER 01 A330","color":"","component":"Dust / Powder","itemNo":"00334808(AT68HS-P/01)","batch":"Z501008","mfgDate":"01/15/2025","expDate":"01/15/2027","shelfLife":"","fileName":"A'COAT 68HS powder exp 01.15.27 Z501008.pdf"},{"id":"a-coat-68hs-powder-01-a330-z506012-a-coat-68hs-powder-exp-06-13-27-z506012-pdf","label":"Dust / Powder — A'COAT 68HS POWDER 01 A330 — Batch Z506012 — Exp 06/13/2027","project":"GWB","mfr":"PPG","prodName":"A'COAT 68HS POWDER 01 A330","color":"","component":"Dust / Powder","itemNo":"00334808(AT68HS-P/01)","batch":"Z506012","mfgDate":"06/13/2025","expDate":"06/13/2027","shelfLife":"","fileName":"A'COAT 68HS powder exp 06.13.27 - Z506012.pdf"},{"id":"a-lock-2-400al-bas-aluminum-01-b100-9404633300-a-lock-2-bas-alum-9404633300-exp-","label":"Base / Paint — A'LOCK 2/400AL BAS ALUMINUM 01 B100 — Batch 9404633300 — Exp 03/09/2027","project":"GWB","mfr":"PPG","prodName":"A'LOCK 2/400AL BAS ALUMINUM 01 B100","color":"Aluminum","component":"Base / Paint","itemNo":"00333524(AK2-01A/01)","batch":"9404633300","mfgDate":"03/09/2024","expDate":"03/09/2027","shelfLife":"","fileName":"A'LOCK 2 bas alum 9404633300 exp 03.09.27.pdf"},{"id":"a-lock-2-400al-bas-aluminum-01-b100-9417681720-a-lock-2-bas-alum-9417681720-exp-","label":"Base / Paint — A'LOCK 2/400AL BAS ALUMINUM 01 B100 — Batch 9417681720 — Exp 06/27/2027","project":"GWB","mfr":"PPG","prodName":"A'LOCK 2/400AL BAS ALUMINUM 01 B100","color":"Aluminum","component":"Base / Paint","itemNo":"00333524(AK2-01A/01)","batch":"9417681720","mfgDate":"06/27/2024","expDate":"06/27/2027","shelfLife":"","fileName":"A'LOCK 2 bas alum 9417681720 exp 06.27.27.pdf"},{"id":"a-lock-2-400al-bas-aluminum-01-b100-9525883114-a-lock-2-bas-alum-9525883114-exp-","label":"Base / Paint — A'LOCK 2/400AL BAS ALUMINUM 01 B100 — Batch 9525883114 — Exp 06/30/2028","project":"GWB","mfr":"PPG","prodName":"A'LOCK 2/400AL BAS ALUMINUM 01 B100","color":"Aluminum","component":"Base / Paint","itemNo":"00333524(AK2-01A/01)","batch":"9525883114","mfgDate":"07/01/2025","expDate":"06/30/2028","shelfLife":"","fileName":"A'LOCK 2 bas alum 9525883114 exp 06.30.28.pdf"},{"id":"a-lock-2al-hrd-aluminum-01-b100-9516857154-a-lock-2-hrd-alum-9516857154-exp-04-2","label":"Hardener / Converter — A'LOCK 2AL HRD ALUMINUM 01 B100 — Batch 9516857154 — Exp 04/23/2027","project":"GWB","mfr":"PPG","prodName":"A'LOCK 2AL HRD ALUMINUM 01 B100","color":"Aluminum","component":"Hardener / Converter","itemNo":"00333526(AK2-01B/01)","batch":"9516857154","mfgDate":"04/23/2025","expDate":"04/23/2027","shelfLife":"","fileName":"A'LOCK 2 hrd alum 9516857154 exp 04.23.27.pdf"},{"id":"pitthane-ultra-dot-hrd-01-a833-356317-pitthane-hrd-356317-exp-05-04-28-pdf","label":"Hardener / Converter — PITTHANE ULTRA DOT HRD 01 A833 — Batch 356317 — Exp 05/04/2028","project":"GWB","mfr":"PPG","prodName":"PITTHANE ULTRA DOT HRD 01 A833","color":"","component":"Hardener / Converter","itemNo":"00463246(95D-819/01)","batch":"356317","mfgDate":"05/05/2025","expDate":"05/04/2028","shelfLife":"","fileName":"Pitthane hrd 356317 exp 05.04.28.pdf"},{"id":"pitthane-ultra-dot-hrd-04-a167-354933-pitthane-hrd-354933-exp-06-27-27-pdf","label":"Hardener / Converter — PITTHANE ULTRA DOT HRD 04 A167 — Batch 354933 — Exp 06/27/2027","project":"GWB","mfr":"PPG","prodName":"PITTHANE ULTRA DOT HRD 04 A167","color":"","component":"Hardener / Converter","itemNo":"00463245(95D-819/04)","batch":"354933","mfgDate":"06/27/2024","expDate":"06/27/2027","shelfLife":"","fileName":"Pitthane hrd 354933 exp 06.27.27.pdf"},{"id":"pitthane-ultra-dot-wh-tint-base-01-a771-9447785370-pitthane-tint-base-9447785370","label":"Base / Paint — PITTHANE ULTRA DOT WH TINT BASE 01 A771 — Batch 9447785370 — Exp 01/07/2028","project":"GWB","mfr":"PPG","prodName":"PITTHANE ULTRA DOT WH TINT BASE 01 A771","color":"","component":"Base / Paint","itemNo":"00454519(95D-8001/01)","batch":"9447785370","mfgDate":"01/07/2025","expDate":"01/07/2028","shelfLife":"","fileName":"Pitthane tint base 9447785370 exp 01.07.28.pdf"},{"id":"pitthane-ultra-dot-wh-tint-base-05-b386-9522875952-pitthane-tint-base-9522875952","label":"Base / Paint — PITTHANE ULTRA DOT WH TINT BASE 05 B386 — Batch 9522875952 — Exp 06/22/2028","project":"GWB","mfr":"PPG","prodName":"PITTHANE ULTRA DOT WH TINT BASE 05 B386","color":"","component":"Base / Paint","itemNo":"00454520(95D-8001/05)","batch":"9522875952","mfgDate":"06/23/2025","expDate":"06/22/2028","shelfLife":"","fileName":"Pitthane tint base 9522875952 exp 06.22.28.pdf"},{"id":"ppg-dtm-epoxy-202-dot-hrd-01-b100-9427717198-dtm-202-hrd-01-exp-07-17-26-9427717","label":"Hardener / Converter — PPG DTM EPOXY 202 DOT HRD 01 B100 — Batch 9427717198 — Exp 07/17/2026","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPOXY 202 DOT HRD 01 B100","color":"","component":"Hardener / Converter","itemNo":"00463241(E202D-B/01)","batch":"9427717198","mfgDate":"07/17/2024","expDate":"07/17/2026","shelfLife":"","fileName":"DTM 202 hrd 01 exp 07.17.26 - 9427717198.PDF"},{"id":"ppg-dtm-epoxy-202-dot-hrd-03-b250-9425711539-dtm-202-hrd-03-exp-06-27-26-9425711","label":"Hardener / Converter — PPG DTM EPOXY 202 DOT HRD 03 B250 — Batch 9425711539 — Exp 06/27/2026","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPOXY 202 DOT HRD 03 B250","color":"","component":"Hardener / Converter","itemNo":"00463242(E202D-B/03)","batch":"9425711539","mfgDate":"06/27/2024","expDate":"06/27/2026","shelfLife":"","fileName":"DTM 202 hrd 03 exp 06.27.26 - 9425711539.PDF"},{"id":"ppg-dtm-epoxy-202-dot-hrd-03-b250-9514849395-dtm-202-epoxy-hrd-exp-04-30-27-9514","label":"Hardener / Converter — PPG DTM EPOXY 202 DOT HRD 03 B250 — Batch 9514849395 — Exp 04/30/2027","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPOXY 202 DOT HRD 03 B250","color":"","component":"Hardener / Converter","itemNo":"00463242(E202D-B/03)","batch":"9514849395","mfgDate":"04/30/2025","expDate":"04/30/2027","shelfLife":"","fileName":"DTM 202 epoxy hrd exp 04.30.27 - 9514749395.pdf"},{"id":"ppg-dtm-epxy-202-dot-bas-buff-bn-01-b100-9431730412-dtm-202-bas-buff-01-exp-09-1","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS BUFF BN 01 B100 — Batch 9431730412 — Exp 09/18/2027","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS BUFF BN 01 B100","color":"Buff Brown","component":"Base / Paint","itemNo":"00476001(E202D-1/01)","batch":"9431730412","mfgDate":"09/18/2024","expDate":"09/18/2027","shelfLife":"","fileName":"DTM 202 bas buff 01 exp 09.18.27 - 9431730412.PDF"},{"id":"ppg-dtm-epxy-202-dot-bas-buff-bn-01-b100-9432734941-dtm-202-bas-buff-exp-08-24-2","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS BUFF BN 01 B100 — Batch 9432734941 — Exp 08-24-2027","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS BUFF BN 01 B100","color":"Buff Brown","component":"Base / Paint","itemNo":"00476001(E202D-1/01)","batch":"9432734941","mfgDate":"08-24-2024","expDate":"08-24-2027","shelfLife":"","fileName":"DTM 202 bas buff exp 08.24.27 - 9432734941.pdf"},{"id":"ppg-dtm-epxy-202-dot-bas-buff-bn-05-b250-9510833344-dtm-202-bas-buff-05-exp-04-1","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS BUFF BN 05 B250 — Batch 9510833344 — Exp 04/17/2028","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS BUFF BN 05 B250","color":"Buff Brown","component":"Base / Paint","itemNo":"00476002(E202D-1/05)","batch":"9510833344","mfgDate":"04/18/2025","expDate":"04/17/2028","shelfLife":"","fileName":"DTM 202 bas buff 05 exp 04.17.28 - 9510833344.PDF"},{"id":"ppg-dtm-epxy-202-dot-bas-buff-bn-05-b250-9605964519-dtm-202-bas-buff-exp-02-04-2","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS BUFF BN 05 B250 — Batch 9605964519 — Exp 02/04/2029","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS BUFF BN 05 B250","color":"Buff Brown","component":"Base / Paint","itemNo":"00476002(E202D-1/05)","batch":"9605964519","mfgDate":"02/05/2026","expDate":"02/04/2029","shelfLife":"","fileName":"DTM 202 bas buff exp 02.04.29 - 9605964519.pdf"},{"id":"ppg-dtm-epxy-202-dot-bas-prl-gr-01-b100-9427717557-dtm-202-bas-pearl-gray-01-exp","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS PRL GR 01 B100 — Batch 9427717557 — Exp 07/17/2027","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS PRL GR 01 B100","color":"Pearl Gray","component":"Base / Paint","itemNo":"00475999(E202D-23/01)","batch":"9427717557","mfgDate":"07/17/2024","expDate":"07/17/2027","shelfLife":"","fileName":"DTM 202 bas pearl gray 01 exp 07.17.27 - 9427717557.PDF"},{"id":"ppg-dtm-epxy-202-dot-bas-prl-gr-05-b250-9427717197-dtm-202-bas-pearl-gray-05-exp","label":"Base / Paint — PPG DTM EPXY 202 DOT BAS PRL GR 05 B250 — Batch 9427717197 — Exp 07/19/2027","project":"GWB","mfr":"PPG","prodName":"PPG DTM EPXY 202 DOT BAS PRL GR 05 B250","color":"Pearl Gray","component":"Base / Paint","itemNo":"00476000(E202D-23/05)","batch":"9427717197","mfgDate":"07/19/2024","expDate":"07/19/2027","shelfLife":"","fileName":"DTM 202 bas pearl gray 05 exp 07.19.27 - 9427717197.PDF"},{"id":"sp-4888-brush-brown-packing-slip-sp-4888-brush-brown-packing-slip-pdf","label":"Base / Paint — SP-4888 Brush Brown packing slip","project":"GWB","mfr":"Rust-Oleum","prodName":"SP-4888 Brush Brown packing slip","color":"Brown","component":"Base / Paint","itemNo":"","batch":"","mfgDate":"","expDate":"","shelfLife":"","fileName":"SP-4888 Brush Brown packing slip.pdf"},{"id":"indhp-5-gl-noxyde-beige-gray-520336-w35161-noxyde-beige-gray-exp-06-14-27-pdf","label":"Base / Paint — INDHP 5-GL NOXYDE BEIGE GRAY — Batch 520336 — Exp 06/14/27","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE BEIGE GRAY","color":"Beige Gray","component":"Base / Paint","itemNo":"283088","batch":"520336","mfgDate":"05/16/2023","expDate":"06/14/27","shelfLife":"4 Years","fileName":"W35161 Noxyde beige gray exp 06.14.27.pdf"},{"id":"indhp-5-gl-noxyde-beige-gray-525593-w37171-noxyde-beige-gray-exp-07-17-27-pdf","label":"Base / Paint — INDHP 5-GL NOXYDE BEIGE GRAY — Batch 525593 — Exp 07/17/27","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE BEIGE GRAY","color":"Beige Gray","component":"Base / Paint","itemNo":"283088","batch":"525593","mfgDate":"07/17/2023","expDate":"07/17/27","shelfLife":"4 Years","fileName":"w37171 Noxyde beige gray exp 07.17.27.pdf"},{"id":"indhp-5-gl-noxyde-blue-gray-605745-w58181-batch-605745-blue-gray-exp-08-15-29-pd","label":"Base / Paint — INDHP 5-GL NOXYDE BLUE GRAY — Batch 605745 — Exp 08/15/29","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE BLUE GRAY","color":"Blue Gray","component":"Base / Paint","itemNo":"283086","batch":"605745","mfgDate":"08/15/2025","expDate":"08/15/29","shelfLife":"4 Years","fileName":"w58181 batch 605745 blue gray exp 08.15.29.pdf"},{"id":"indhp-5-gl-noxyde-blue-gray-w58181-w58181-noxyde-blue-gray-exp-08-18-29-coc-pdf","label":"Base / Paint — INDHP 5-GL NOXYDE BLUE GRAY — Batch W58181 — Exp 08/18/29","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE BLUE GRAY","color":"Blue Gray","component":"Base / Paint","itemNo":"283086","batch":"W58181","mfgDate":"08/18/2025","expDate":"08/18/29","shelfLife":"4 Years","fileName":"W58181 Noxyde blue gray exp 08.18.29 COC.pdf"},{"id":"indhp-5-gl-noxyde-gravel-gray-516000-w35051-noxyde-gravel-gray-exp-05-05-27-pdf","label":"Base / Paint — INDHP 5-GL NOXYDE GRAVEL GRAY — Batch 516000 — Exp 05/05/27","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE GRAVEL GRAY","color":"Gravel Gray","component":"Base / Paint","itemNo":"283095","batch":"516000","mfgDate":"05/05/2023","expDate":"05/05/27","shelfLife":"4 Years","fileName":"w35051 Noxyde gravel gray exp 05.05.27.pdf"},{"id":"indhp-5-gl-noxyde-gravel-gray-600636-w57241-batch-600636-gravel-gray-exp-07-23-2","label":"Base / Paint — INDHP 5-GL NOXYDE GRAVEL GRAY — Batch 600636 — Exp 07/23/29","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE GRAVEL GRAY","color":"Gravel Gray","component":"Base / Paint","itemNo":"283095","batch":"600636","mfgDate":"07/23/2025","expDate":"07/23/29","shelfLife":"4 Years","fileName":"w57241 batch 600636 gravel gray exp 07.23.29.pdf"},{"id":"indhp-5-gl-noxyde-gravel-gray-w57241-w57241-noxyde-gravel-gray-exp-07-24-29-coc-","label":"Base / Paint — INDHP 5-GL NOXYDE GRAVEL GRAY — Batch W57241 — Exp 07/24/29","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"INDHP 5-GL NOXYDE GRAVEL GRAY","color":"Gravel Gray","component":"Base / Paint","itemNo":"283095","batch":"W57241","mfgDate":"07/24/2025","expDate":"07/24/29","shelfLife":"4 Years","fileName":"W57241 Noxyde gravel gray exp 07.24.29 COC.pdf"},{"id":"mathys-5-gl-noxyde-gravel-gray-501424-w2n301-noxyde-gravel-gray-exp-11-30-26-pdf","label":"Base / Paint — MATHYS 5-GL NOXYDE GRAVEL GRAY — Batch 501424 — Exp 11/30/26","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"MATHYS 5-GL NOXYDE GRAVEL GRAY","color":"Gravel Gray","component":"Base / Paint","itemNo":"283095","batch":"501424","mfgDate":"11/30/2022","expDate":"11/30/26","shelfLife":"4 Years","fileName":"w2N301 Noxyde gravel gray exp 11.30.26.pdf"},{"id":"mathys-5-gl-noxyde-pewter-cup-gray-520337-w36021-noxyde-pewter-cup-gray-exp-06-1","label":"Base / Paint — MATHYS 5-GL NOXYDE PEWTER CUP GRAY — Batch 520337 — Exp 06/14/27","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"MATHYS 5-GL NOXYDE PEWTER CUP GRAY","color":"Pewter Cup Gray","component":"Base / Paint","itemNo":"352016","batch":"520337","mfgDate":"06/05/2023","expDate":"06/14/27","shelfLife":"4 Years","fileName":"W36021 Noxyde pewter cup gray exp 06.14.27.pdf"},{"id":"mathys-5-gl-noxyde-pewter-cup-gray-561229-w46271-noxyde-pewter-cup-gray-exp-06-2","label":"Base / Paint — MATHYS 5-GL NOXYDE PEWTER CUP GRAY — Batch 561229 — Exp 06/24/28","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"MATHYS 5-GL NOXYDE PEWTER CUP GRAY","color":"Pewter Cup Gray","component":"Base / Paint","itemNo":"352016","batch":"561229","mfgDate":"06/24/2024","expDate":"06/24/28","shelfLife":"4 Years","fileName":"w46271 Noxyde pewter cup gray exp 06.24.28.pdf"},{"id":"mathys-5-gl-noxyde-pewter-cup-gray-568122-w49201-noxyde-pewter-cup-gray-exp-09-1","label":"Base / Paint — MATHYS 5-GL NOXYDE PEWTER CUP GRAY — Batch 568122 — Exp 09/18/28","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"MATHYS 5-GL NOXYDE PEWTER CUP GRAY","color":"Pewter Cup Gray","component":"Base / Paint","itemNo":"352016","batch":"568122","mfgDate":"09/18/2024","expDate":"09/18/28","shelfLife":"4 Years","fileName":"w49201 Noxyde pewter cup gray exp 09.18.28.pdf"},{"id":"w33311-noxyde-off-white-w33311-w33311-noxyde-off-white-exp-03-22-2027-pdf","label":"Base / Paint — W33311 Noxyde off-white — Batch W33311 — Exp 03/22/2027","project":"GWB","mfr":"Rust-Oleum / Mathys","prodName":"W33311 Noxyde off-white","color":"Off-White","component":"Base / Paint","itemNo":"","batch":"W33311","mfgDate":"","expDate":"03/22/2027","shelfLife":"","fileName":"W33311 Noxyde off-white exp 03.22.2027.pdf"}];
const DYRE_PIR_MATERIALS = [{"id":"a-coat-68hs-bas-for-4-gal-kit-05-b184-9511837177-20260605-at68hs-a-9511837177-pd","label":"Base / Paint \u2014 A'COAT 68HS BAS -FOR 4 GAL KIT 05 B184 \u2014 Batch 9511837177 \u2014 Exp 04/02/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS BAS -FOR 4 GAL KIT 05 B184","color":"","component":"Base / Paint","itemNo":"00348484(AT68HS-A4G/05)","batch":"9511837177","mfgDate":"04/02/2025","expDate":"04/02/2027","shelfLife":"","quantity":"15 PC","certDate":"June 05, 2026","fileName":"20260605/AT68HS-A_9511837177.pdf"},{"id":"a-coat-68hs-bas-cbi-grn-4-gl-kt-05-b184-9515852696-20260605-lr20140101-951585269","label":"Base / Paint \u2014 A'COAT 68HS BAS CBI GRN -4 GL KT 05 B184 \u2014 Batch 9515852696 \u2014 Exp 04/30/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS BAS CBI GRN -4 GL KT 05 B184","color":"CBI Green","component":"Base / Paint","itemNo":"00353380(LR20140101/05)","batch":"9515852696","mfgDate":"04/30/2025","expDate":"04/30/2027","shelfLife":"","quantity":"25 PC","certDate":"June 05, 2026","fileName":"20260605/LR20140101_9515852696_00.pdf"},{"id":"a-lock-600-bas-buff-brown-05-b250-9414669805-20260605-ak600-1-9414669805-00-pdf","label":"Base / Paint \u2014 A'LOCK 600 BAS BUFF BROWN 05 B250 \u2014 Batch 9414669805 \u2014 Exp 04/20/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'LOCK 600 BAS BUFF BROWN 05 B250","color":"Buff Brown","component":"Base / Paint","itemNo":"00471075(AK600-1/05)","batch":"9414669805","mfgDate":"05/07/2024","expDate":"04/20/2027","shelfLife":"","quantity":"18 PC","certDate":"June 05, 2026","fileName":"20260605/AK600-1_9414669805_00.pdf"},{"id":"a-lock-600-bas-pearl-gray-05-b250-9345598922-20260605-ak600-23-9345598922-pdf","label":"Base / Paint \u2014 A'LOCK 600 BAS PEARL GRAY 05 B250 \u2014 Batch 9345598922 \u2014 Exp 12/01/2026","project":"Dyre Ave","mfr":"PPG","prodName":"A'LOCK 600 BAS PEARL GRAY 05 B250","color":"Pearl Gray","component":"Base / Paint","itemNo":"00444100(AK600-23/05)","batch":"9345598922","mfgDate":"11/27/2023","expDate":"12/01/2026","shelfLife":"","quantity":"19 PC","certDate":"June 05, 2026","fileName":"20260605/AK600-23_9345598922.pdf"},{"id":"a-lock-600-bas-pearl-gray-05-b250-9505812312-20260605-ak600-23-9505812312-pdf","label":"Base / Paint \u2014 A'LOCK 600 BAS PEARL GRAY 05 B250 \u2014 Batch 9505812312 \u2014 Exp 03/03/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'LOCK 600 BAS PEARL GRAY 05 B250","color":"Pearl Gray","component":"Base / Paint","itemNo":"00444100(AK600-23/05)","batch":"9505812312","mfgDate":"03/03/2025","expDate":"03/03/2027","shelfLife":"","quantity":"16 PC","certDate":"June 05, 2026","fileName":"20260605/AK600-23_9505812312.pdf"},{"id":"p-thane-ultra-woodlnd-night-a-05-b417-9509827904-20260605-lr20210802-9509827904-","label":"Base / Paint \u2014 P'THANE ULTRA WOODLND NIGHT - A 05 B417 \u2014 Batch 9509827904 \u2014 Exp 03/18/2028","project":"Dyre Ave","mfr":"PPG","prodName":"P'THANE ULTRA WOODLND NIGHT - A 05 B417","color":"Woodland Night","component":"Base / Paint","itemNo":"00470454(LR20210802/05)","batch":"9509827904","mfgDate":"03/19/2025","expDate":"03/18/2028","shelfLife":"","quantity":"25 PC","certDate":"June 05, 2026","fileName":"20260605/LR20210802_9509827904.pdf"},{"id":"a-coat-68hs-powder-for-4-gal-kit-05-b135-z504009-68hs-powder-z504009-pdf","label":"Dust / Powder \u2014 A'COAT 68HS POWDER-FOR 4 GAL KIT 05 B135 \u2014 Batch Z504009 \u2014 Exp 04/07/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS POWDER-FOR 4 GAL KIT 05 B135","color":"","component":"Dust / Powder","itemNo":"00348486(AT68HS-P4G/05)","batch":"Z504009","mfgDate":"04/07/2025","expDate":"04/07/2027","shelfLife":"","quantity":"38 PC","certDate":"March 06, 2026","fileName":"68HS Powder Z504009.pdf"},{"id":"a-coat-68hs-powder-for-4-gal-kit-05-b135-z508011-20260605-at68hs-p-z508011-00-pd","label":"Dust / Powder \u2014 A'COAT 68HS POWDER-FOR 4 GAL KIT 05 B135 \u2014 Batch Z508011 \u2014 Exp 08/12/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS POWDER-FOR 4 GAL KIT 05 B135","color":"","component":"Dust / Powder","itemNo":"00348486(AT68HS-P4G/05)","batch":"Z508011","mfgDate":"08/12/2025","expDate":"08/12/2027","shelfLife":"","quantity":"40 PC","certDate":"June 05, 2026","fileName":"20260605/AT68HS-P_Z508011_00.pdf"},{"id":"a-coat-68hs-hrd-for-4gal-kit-9515854666-68hs-cure-9515854666-pdf","label":"Hardener / Converter \u2014 A'COAT 68HS HRD-FOR 4GAL KIT \u2014 Batch 9515854666 \u2014 Exp 05/01/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS HRD-FOR 4GAL KIT","color":"","component":"Hardener / Converter","itemNo":"00348485(AT68HS-B4G/01)","batch":"9515854666","mfgDate":"05/01/2025","expDate":"05/01/2027","shelfLife":"","quantity":"38 PC","certDate":"March 06, 2026","fileName":"68HS Cure 9515854666.pdf"},{"id":"a-coat-68hs-hrd-for-4gal-kit-9525884917-20260605-at68hs-b-9525884917-00-pdf","label":"Hardener / Converter \u2014 A'COAT 68HS HRD-FOR 4GAL KIT \u2014 Batch 9525884917 \u2014 Exp 07/16/2027","project":"Dyre Ave","mfr":"PPG","prodName":"A'COAT 68HS HRD-FOR 4GAL KIT","color":"","component":"Hardener / Converter","itemNo":"00348485(AT68HS-B4G/01)","batch":"9525884917","mfgDate":"07/16/2025","expDate":"07/16/2027","shelfLife":"","quantity":"40 PC","certDate":"June 05, 2026","fileName":"20260605/AT68HS-B_9525884917_00.pdf"},{"id":"a-lock-600-hrd-03-b250-9509829841-20260605-ak600-b-9508929841-pdf","label":"Hardener / Converter \u2014 A'LOCK 600 HRD 03 B250 \u2014 Batch 9509829841 \u2014 Exp 03/05/2028","project":"Dyre Ave","mfr":"PPG","prodName":"A'LOCK 600 HRD 03 B250","color":"","component":"Hardener / Converter","itemNo":"00436678(AK600-B/03)","batch":"9509829841","mfgDate":"03/06/2025","expDate":"03/05/2028","shelfLife":"","quantity":"35 PC","certDate":"June 05, 2026","fileName":"20260605/AK600-B_9508929841.pdf"},{"id":"a-lock-600-hrd-03-b250-9521873866-20260605-ak600-b-9521873866-pdf","label":"Hardener / Converter \u2014 A'LOCK 600 HRD 03 B250 \u2014 Batch 9521873866 \u2014 Exp 05/29/2028","project":"Dyre Ave","mfr":"PPG","prodName":"A'LOCK 600 HRD 03 B250","color":"","component":"Hardener / Converter","itemNo":"00436678(AK600-B/03)","batch":"9521873866","mfgDate":"05/30/2025","expDate":"05/29/2028","shelfLife":"","quantity":"18 PC","certDate":"June 05, 2026","fileName":"20260605/AK600-B_9521873866.pdf"},{"id":"pitthane-ultra-component-b-354594-20260605-95-819-354594-pdf","label":"Hardener / Converter \u2014 PITTHANE ULTRA COMPONENT B \u2014 Batch 354594 \u2014 Exp 03/13/2027","project":"Dyre Ave","mfr":"PPG","prodName":"PITTHANE ULTRA COMPONENT B","color":"","component":"Hardener / Converter","itemNo":"00338155(95-819/01)","batch":"354594","mfgDate":"03/13/2024","expDate":"03/13/2027","shelfLife":"","quantity":"25 PC","certDate":"June 05, 2026","fileName":"20260605/95-819_354594.pdf"}];

const EMBEDDED_ACTIVE_WORKERS = [{"firstName":"Alberto","lastName":"Duron Hernandez","fullName":"Alberto Duron Hernandez","class":"Journeyman","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Albin","lastName":"Reyes","fullName":"Albin Reyes","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Alejandro","lastName":"Cruz","fullName":"Alejandro Cruz","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Alex","lastName":"Huezo","fullName":"Alex Huezo","class":"Apprentice 1st","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Alex","lastName":"Miketon Miranda","fullName":"Alex Miketon Miranda","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Alfredo","lastName":"Manno","fullName":"Alfredo Manno","class":"Journeyman","local":"361","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Amaury","lastName":"Calhau","fullName":"Amaury Calhau","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Anderson","lastName":"Ceranto","fullName":"Anderson Ceranto","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Angelino","lastName":"Antunes","fullName":"Angelino Antunes","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Anthony","lastName":"Goris","fullName":"Anthony Goris","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Anthony","lastName":"Lovich","fullName":"Anthony Lovich","class":"Journeyman","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Anthony","lastName":"Pankowitz","fullName":"Anthony Pankowitz","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Anthymos","lastName":"Mytikas","fullName":"Anthymos Mytikas","class":"Journeyman","local":"806","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Antonio","lastName":"Sluzala","fullName":"Antonio Sluzala","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Apostolos","lastName":"Dovas","fullName":"Apostolos Dovas","class":"","local":"","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Beau","lastName":"Forget","fullName":"Beau Forget","class":"Journeyman","local":"806","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Berisford","lastName":"Lewis","fullName":"Berisford Lewis","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Brandon","lastName":"Pratt","fullName":"Brandon Pratt","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Carlos","lastName":"Canales","fullName":"Carlos Canales","class":"Journeyman","local":"476","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Carlos","lastName":"Lopez Rodriguez","fullName":"Carlos Lopez Rodriguez","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Christopher","lastName":"Calderon","fullName":"Christopher Calderon","class":"Apprentice 2nd","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Christopher","lastName":"Stephans","fullName":"Christopher Stephans","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Cliver","lastName":"Pereira","fullName":"Cliver Pereira","class":"Journeyman","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Cortney","lastName":"King","fullName":"Cortney King","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Craig","lastName":"Harper","fullName":"Craig Harper","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Daniel","lastName":"Amorim","fullName":"Daniel Amorim","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Daniel","lastName":"Ribeiro","fullName":"Daniel Ribeiro","class":"Journeyman","local":"1331","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Daniel","lastName":"Stucky","fullName":"Daniel Stucky","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Devyd","lastName":"De Oliveira","fullName":"Devyd De Oliveira","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Dicesar","lastName":"Miranda","fullName":"Dicesar Miranda","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Dimitri","lastName":"Pizanias","fullName":"Dimitri Pizanias","class":"Journeyman","local":"806","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Dimitrios","lastName":"Billiris","fullName":"Dimitrios Billiris","class":"Journeyman","local":"476","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Dylan","lastName":"Alexander","fullName":"Dylan Alexander","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Edwin","lastName":"Oliva","fullName":"Edwin Oliva","class":"Journeyman","local":"1","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Efrain","lastName":"Morales III","fullName":"Efrain Morales III","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Elber","lastName":"Cruz Flores","fullName":"Elber Cruz Flores","class":"Journeyman","local":"1331","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Elcio","lastName":"Antoneli","fullName":"Elcio Antoneli","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Elias","lastName":"Douropoulos","fullName":"Elias Douropoulos","class":"Journeyman","local":"476","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Emanuel","lastName":"Tiliakos","fullName":"Emanuel Tiliakos","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Emerson","lastName":"Haile","fullName":"Emerson Haile","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Emerson","lastName":"Heil","fullName":"Emerson Heil","class":"Journeyman","local":"806","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Eric","lastName":"Delgado","fullName":"Eric Delgado","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Estefano","lastName":"Hornung","fullName":"Estefano Hornung","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Eugene","lastName":"Wegner","fullName":"Eugene Wegner","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Fabiano","lastName":"Rodrigues","fullName":"Fabiano Rodrigues","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Felix","lastName":"Diaz","fullName":"Felix Diaz","class":"Apprentice 1st","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Felix","lastName":"Lopez Gonzalez","fullName":"Felix Lopez Gonzalez","class":"Apprentice 1st","local":"806","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Fernando","lastName":"Silverio","fullName":"Fernando Silverio","class":"Journeyman","local":"476","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Francisco","lastName":"Martinez","fullName":"Francisco Martinez","class":"","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Francisco","lastName":"Medina","fullName":"Francisco Medina","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Franklin","lastName":"Pankowitz","fullName":"Franklin Pankowitz","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Frehyli","lastName":"Calbral De Jesus","fullName":"Frehyli Calbral De Jesus","class":"Apprentice 1st","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Gabriel","lastName":"Andre de almeida","fullName":"Gabriel Andre de almeida","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Geanderson","lastName":"Campos","fullName":"Geanderson Campos","class":"Apprentice 2nd","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"George","lastName":"Grillis","fullName":"George Grillis","class":"Journeyman","local":"476","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"George K","lastName":"Lyras","fullName":"George K Lyras","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Gregory","lastName":"Coulter","fullName":"Gregory Coulter","class":"Apprentice 3rd","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Gregory","lastName":"Harper","fullName":"Gregory Harper","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Guillermo","lastName":"Sahagun","fullName":"Guillermo Sahagun","class":"","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Gustavo","lastName":"Pereira","fullName":"Gustavo Pereira","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Helen","lastName":"Betances","fullName":"Helen Betances","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Henry","lastName":"Melara","fullName":"Henry Melara","class":"Apprentice 2nd","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Hugo","lastName":"Diaz Rodas","fullName":"Hugo Diaz Rodas","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ioannis","lastName":"Mytikas","fullName":"Ioannis Mytikas","class":"Journeyman","local":"806","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Ismael","lastName":"Brandino","fullName":"Ismael Brandino","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ismael","lastName":"Martinez","fullName":"Ismael Martinez","class":"Journeyman","local":"476","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jacob","lastName":"Monteiro","fullName":"Jacob Monteiro","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Jahcinto","lastName":"Estrela","fullName":"Jahcinto Estrela","class":"Journeyman","local":"806","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Jared","lastName":"Arista Martinez","fullName":"Jared Arista Martinez","class":"Apprentice 1st","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jefferson","lastName":"Domaleski","fullName":"Jefferson Domaleski","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jerry","lastName":"Seaborn","fullName":"Jerry Seaborn","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Joao","lastName":"Lopes","fullName":"Joao Lopes","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Joao Victor","lastName":"Hornung","fullName":"Joao Victor Hornung","class":"Apprentice 1st","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Joel","lastName":"Monterroso","fullName":"Joel Monterroso","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"John","lastName":"Brown","fullName":"John Brown","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"John","lastName":"Manglis","fullName":"John Manglis","class":"","local":"","currentJob":"BRC231F/Queensboro Bridge","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Jorge","lastName":"Alvarez","fullName":"Jorge Alvarez","class":"Journeyman","local":"1","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jorge","lastName":"Santiago","fullName":"Jorge Santiago","class":"Journeyman","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Jose","lastName":"Lineiro","fullName":"Jose Lineiro","class":"Journeyman","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Joseph","lastName":"Tewes","fullName":"Joseph Tewes","class":"Journeyman","local":"2011","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Joshua","lastName":"Quinones","fullName":"Joshua Quinones","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Joshua","lastName":"Williams","fullName":"Joshua Williams","class":"Journeyman","local":"40","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Aguilar Villeda","fullName":"Juan Aguilar Villeda","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Juan","lastName":"Castellanos","fullName":"Juan Castellanos","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Kevin","lastName":"Canales Torres","fullName":"Kevin Canales Torres","class":"Journeyman","local":"476","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Kevin","lastName":"Gibbons","fullName":"Kevin Gibbons","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Kevin","lastName":"Perez Velasquez","fullName":"Kevin Perez Velasquez","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Kinn","lastName":"Estrela","fullName":"Kinn Estrela","class":"Journeyman","local":"806","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Kyle","lastName":"Rowsey","fullName":"Kyle Rowsey","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Lorenzo","lastName":"Rodriguez Pena","fullName":"Lorenzo Rodriguez Pena","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Luis","lastName":"Tzapin Ajiataz","fullName":"Luis Tzapin Ajiataz","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Marcelo","lastName":"De Souza","fullName":"Marcelo De Souza","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Marcos","lastName":"Da Costa","fullName":"Marcos Da Costa","class":"Journeyman","local":"1331","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Marcos","lastName":"Dias","fullName":"Marcos Dias","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Mario","lastName":"Prachum","fullName":"Mario Prachum","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Mark","lastName":"Sabbagh","fullName":"Mark Sabbagh","class":"Journeyman","local":"40","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Marquette","lastName":"Hofler","fullName":"Marquette Hofler","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Matthew","lastName":"Gardner","fullName":"Matthew Gardner","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Mayron","lastName":"Sales","fullName":"Mayron Sales","class":"Journeyman","local":"1331","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Michael","lastName":"Dunigan","fullName":"Michael Dunigan","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Haffner","fullName":"Michael Haffner","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Kavouras","fullName":"Michael Kavouras","class":"Journeyman","local":"6","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Maillis","fullName":"Michael Maillis","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Michael","lastName":"Ranger","fullName":"Michael Ranger","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Michael","lastName":"Valenti","fullName":"Michael Valenti","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Miguel","lastName":"Drosda","fullName":"Miguel Drosda","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Miltiadis","lastName":"Dovas","fullName":"Miltiadis Dovas","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Moacir","lastName":"Poleti Junior","fullName":"Moacir Poleti Junior","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Moises","lastName":"Sotta Jr","fullName":"Moises Sotta Jr","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Munashwar","lastName":"Gopaul","fullName":"Munashwar Gopaul","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Nicholas","lastName":"Florence","fullName":"Nicholas Florence","class":"Apprentice 3rd","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Nicholas","lastName":"Lyras","fullName":"Nicholas Lyras","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Nicholis","lastName":"Camacho","fullName":"Nicholis Camacho","class":"Apprentice 3rd","local":"361","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Nikitas","lastName":"Grillis","fullName":"Nikitas Grillis","class":"","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"","crew":"Bridge Painting"},{"firstName":"Oscar","lastName":"Monge","fullName":"Oscar Monge","class":"Journeyman","local":"","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Osman","lastName":"Gonzalez","fullName":"Osman Gonzalez","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Pantelis","lastName":"Poullas","fullName":"Pantelis Poullas","class":"Journeyman","local":"806","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Phil","lastName":"Dawson","fullName":"Phil Dawson","class":"Journeyman","local":"476","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Rafael","lastName":"De Castro","fullName":"Rafael De Castro","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Ramon","lastName":"Amparo","fullName":"Ramon Amparo","class":"Apprentice 2nd","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Raymond","lastName":"Roach","fullName":"Raymond Roach","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Renato","lastName":"Martinez","fullName":"Renato Martinez","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ricardo","lastName":"Chineider","fullName":"Ricardo Chineider","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Richard","lastName":"Montero","fullName":"Richard Montero","class":"","local":"806","currentJob":"VN Ramps","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Rivaldo","lastName":"Dos Santos","fullName":"Rivaldo Dos Santos","class":"Apprentice 3rd","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Robert","lastName":"Young","fullName":"Robert Young","class":"Journeyman","local":"1331","currentJob":"Bridge Painting","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Romel","lastName":"Guzhnay","fullName":"Romel Guzhnay","class":"Apprentice 3rd","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Ruben","lastName":"Vasquez","fullName":"Ruben Vasquez","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Scott","lastName":"Lee","fullName":"Scott Lee","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Sebastian","lastName":"Papadopoulos","fullName":"Sebastian Papadopoulos","class":"Journeyman","local":"476","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Sergio","lastName":"Manzano","fullName":"Sergio Manzano","class":"Journeyman","local":"","currentJob":"Gold Star Memorial","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Shane","lastName":"Young, Jr.","fullName":"Shane Young, Jr.","class":"Journeyman","local":"40","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Iron Worker","crew":"Bridge Painting"},{"firstName":"Smolenski (Moe)","lastName":"Xenikis","fullName":"Smolenski (Moe) Xenikis","class":"Journeyman","local":"476","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Stephen","lastName":"Tillman","fullName":"Stephen Tillman","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Terrence","lastName":"Chillious","fullName":"Terrence Chillious","class":"Journeyman","local":"806","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Theophilos","lastName":"Mixis","fullName":"Theophilos Mixis","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Thomas","lastName":"Gavinovich","fullName":"Thomas Gavinovich","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Timothy","lastName":"Ladd","fullName":"Timothy Ladd","class":"Journeyman","local":"806","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tony","lastName":"Murphy","fullName":"Tony Murphy","class":"Journeyman","local":"806","currentJob":"RK-19","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tyler","lastName":"Saracena","fullName":"Tyler Saracena","class":"Journeyman","local":"1331","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Tyrone","lastName":"Brown","fullName":"Tyrone Brown","class":"Journeyman","local":"806","currentJob":"D265343 Bove W&W2","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Valerio","lastName":"Bauermann","fullName":"Valerio Bauermann","class":"Journeyman","local":"1331","currentJob":"GWB-244.048/GWB Cables","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Victoria","lastName":"Veloso","fullName":"Victoria Veloso","class":"Apprentice 1st","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Wagner","lastName":"De Souza Amorim","fullName":"Wagner De Souza Amorim","class":"","local":"","currentJob":"","status":"Active","employeeId":"","trade":"","crew":""},{"firstName":"Wayne","lastName":"Woolum","fullName":"Wayne Woolum","class":"Journeyman","local":"2353","currentJob":"K7279 & K6176 / Gordie Howe","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Wilmer","lastName":"Burgos Calderon","fullName":"Wilmer Burgos Calderon","class":"Journeyman","local":"","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""},{"firstName":"Wilson","lastName":"Monteiro","fullName":"Wilson Monteiro","class":"Journeyman","local":"806","currentJob":"C-35311 Dyer Ave","status":"Active","employeeId":"","trade":"Painter","crew":"Bridge Painting"},{"firstName":"Yonis","lastName":"Cruz","fullName":"Yonis Cruz","class":"Journeyman","local":"806","currentJob":"","status":"Active","employeeId":"","trade":"Painter","crew":""}];
const CREW_OPTIONS = ['', 'Crew 1', 'Crew 2', 'Crew 3', 'Crew 4', 'Crew 5', 'Crew 6', 'Crew 7', 'Other'];
const DWL_ACTIVITIES = ['01 - Setup','02 - Rigging','03 - Build Containment','04 - Washing','05 - Blast & Prime','06 - Additional Coat','07 - Power Tool','08 - Intermediate','09 - Finish','10 - Remove Containment','11 - Remove Rigging','12 - Caulking'];
const DWL_CLASS_OPTIONS = ['JM','FM','QC','Steward','1st','2nd','3rd','4th'];
const DWL_LOCAL_OPTIONS = ['1','6','40','155','361','476','806','1331','2011','2353'];
const DWL_ACTIVITY_NUMBERS = Array.from({length:12},(_,i)=>String(i+1));
const DWL_OVER_OPTIONS = Array.from({length:24},(_,i)=>String(i+1));
const DWL_SMALL_HOUR_OPTIONS = Array.from({length:10},(_,i)=>String(i+1));

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

function parsePirTemp(value){
  if(value===undefined || value===null) return NaN;
  const cleaned=String(value).replace(/[^0-9.\-]/g,'').trim();
  if(!cleaned) return NaN;
  return Number(cleaned);
}
function pirRoundNum(n){return Number.isFinite(n) ? String(Math.round(n)) : '';}
function calcPirAmbientFromDryWet(dryF, wetF){
  const dryC=(dryF-32)*5/9;
  const wetC=(wetF-32)*5/9;
  if(!Number.isFinite(dryC) || !Number.isFinite(wetC) || wetC>dryC) return null;
  const pressure=1013.25; // standard sea-level pressure in hPa, good field approximation for this PIR.
  const sat=(c)=>6.112*Math.exp((17.62*c)/(243.12+c));
  const gamma=0.00066*(1+0.00115*wetC)*pressure;
  const vapor=sat(wetC)-gamma*(dryC-wetC);
  if(!Number.isFinite(vapor) || vapor<=0) return null;
  const rh=Math.max(0,Math.min(100,(vapor/sat(dryC))*100));
  const ln=Math.log(vapor/6.112);
  const dewC=(243.12*ln)/(17.62-ln);
  const dewF=dewC*9/5+32;
  return {rh, dewF};
}
function updatePirAmbientRow(i){
  const dryEl=document.getElementById('pirDry'+i);
  const wetEl=document.getElementById('pirWet'+i);
  const rhEl=document.getElementById('pirRH'+i);
  const surfEl=document.getElementById('pirSurf'+i);
  const dewEl=document.getElementById('pirDew'+i);
  const diffEl=document.getElementById('pirDiff'+i);
  if(!dryEl || !wetEl || !rhEl || !surfEl || !dewEl || !diffEl) return;
  const dry=parsePirTemp(dryEl.value);
  const wet=parsePirTemp(wetEl.value);
  const surface=parsePirTemp(surfEl.value);
  const calc=calcPirAmbientFromDryWet(dry, wet);
  if(calc){
    rhEl.value=pirRoundNum(calc.rh);
    dewEl.value=pirRoundNum(calc.dewF);
  } else if(!dryEl.value.trim() && !wetEl.value.trim()){
    rhEl.value='';
    dewEl.value='';
  }
  const dew=parsePirTemp(dewEl.value);
  if(Number.isFinite(surface) && Number.isFinite(dew)){
    diffEl.value=pirRoundNum(surface-dew);
  } else if(!surfEl.value.trim()){
    diffEl.value='';
  }
}
function setupPirAmbientCalcs(){
  [1,2,3,4].forEach(i=>{
    ['pirDry','pirWet','pirSurf','pirDew'].forEach(prefix=>{
      const el=document.getElementById(prefix+i);
      if(el){
        el.setAttribute('inputmode','decimal');
        el.addEventListener('input',()=>updatePirAmbientRow(i));
        el.addEventListener('change',()=>updatePirAmbientRow(i));
      }
    });
    ['pirRH','pirDew','pirDiff'].forEach(prefix=>{
      const el=document.getElementById(prefix+i);
      if(el) el.classList.add('pirAutoCalcField');
    });
    updatePirAmbientRow(i);
  });
}

function renderPirAmbientBlocks(){
  const holder=document.getElementById('pirAmbientBlocks');
  if(!holder) return;
  const existing={};
  [1,2,3,4].forEach(i=>{
    ['pirAmbLoc','pirAmbTime','pirDry','pirWet','pirRH','pirSurf','pirDew','pirDiff'].forEach(prefix=>{
      const el=document.getElementById(prefix+i);
      if(el) existing[prefix+i]=el.value;
    });
  });
  holder.innerHTML=`<div class="grid two">${Array.from({length:pirAmbientCount},(_,idx)=>idx+1).map(i=>`<div class="checkrow pirAmbientReading"><h3>Ambient Reading ${i}</h3>${field('pirAmbLoc'+i,'Location')}${field('pirAmbTime'+i,'Time','time')}${field('pirDry'+i,'Dry Bulb Temp')}${field('pirWet'+i,'Wet Bulb Temp')}${field('pirRH'+i,'% Relative Humidity')}${field('pirSurf'+i,'Surface Temp')}${field('pirDew'+i,'Dew Point')}${field('pirDiff'+i,'Surface Temp. - Dew Point Spread')}</div>`).join('')}</div>`;
  Object.entries(existing).forEach(([id,value])=>{const el=document.getElementById(id); if(el) el.value=value;});
  setupPirAmbientCalcs();
}

function checked(name){const el=document.querySelector(`[name="${name}"]:checked`); return el ? el.value : '';}
function setPrint(html){document.querySelectorAll('.printPage').forEach(x=>x.remove()); const div=document.createElement('div'); div.className='printPage'; div.innerHTML=html; document.body.appendChild(div); currentPrint=html;}
function field(id,label,type='text',extra=''){return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}></div>`;}
function textarea(id,label){return `<div><label for="${id}">${label}</label><textarea id="${id}"></textarea></div>`;}
function selectField(id,label,opts){return `<div><label for="${id}">${label}</label><select id="${id}">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;}
function checkboxField(id,label){return `<label class="checkPill"><input id="${id}" type="checkbox"> <span>${label}</span></label>`;}
function isChecked(id){return !!document.getElementById(id)?.checked;}
function projectField(id,label='Project / Job'){return `<div><label for="${id}">${label}</label><select id="${id}" class="projectSelect">${PROJECT_OPTIONS.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select><input id="${id}Other" class="projectOther" type="text" placeholder="Enter project name" style="display:none;margin-top:8px"></div>`;}
function setupOtherProject(id){const sel=document.getElementById(id), other=document.getElementById(id+'Other'); if(!sel||!other)return; const sync=()=>{other.style.display = sel.value==='Other' ? 'block' : 'none'; if(sel.value==='Other') other.focus();}; sel.addEventListener('change',sync); sync();}
function projectValue(id){const sel=document.getElementById(id); if(!sel)return ''; return sel.value==='Other' ? val(id+'Other') : sel.value;}
function crewField(id,label='Crew'){return `<div><label for="${id}">${label}</label><select id="${id}" class="crewSelect">${CREW_OPTIONS.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select><input id="${id}Other" class="projectOther" type="text" placeholder="Enter crew" style="display:none;margin-top:8px"></div>`;}
function setupOtherCrew(id){const sel=document.getElementById(id), other=document.getElementById(id+'Other'); if(!sel||!other)return; const sync=()=>{other.style.display = sel.value==='Other' ? 'block' : 'none'; if(sel.value==='Other') other.focus();}; sel.addEventListener('change',sync); sync();}
function crewValue(id){const sel=document.getElementById(id); if(!sel)return ''; return sel.value==='Other' ? val(id+'Other') : sel.value;}
function dateToMMDDYY(dateValue){ const d = String(dateValue||''); const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ''; return `${m[2]}${m[3]}${m[1].slice(2)}`; }
function dateToDisplay(dateValue){ const d = String(dateValue||''); const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return d; return `${m[2]}-${m[3]}-${m[1].slice(2)}`; }
function cleanFilePart(v){ return String(v||'').trim().replace(/[\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,80); }
function formSaveTitle(type, dateValue, projectName='', crewName=''){
  if(type === 'dsif') return dsifSaveTitle(dateValue, projectName);
  if(type === 'dwl') return dwlSaveTitle(dateValue, projectName, crewName);
  const prefix = type === 'pir' ? 'PIR' : (type === 'mewp' ? 'MEWP' : 'Daily Equipment Inspection');
  const datePart = dateToDisplay(dateValue) || 'No Date';
  const projectPart = cleanFilePart(projectName);
  return projectPart ? `${prefix} - ${datePart} - ${projectPart}` : `${prefix} - ${datePart}`;
}
function dateToDotMMDDYY(dateValue){ const d=String(dateValue||''); const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return ''; return `${m[2]}.${m[3]}.${m[1].slice(2)}`; }
function dateToSlashYYYY(dateValue){ const d=String(dateValue||''); const m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return d; return `${m[2]}/${m[3]}/${m[1]}`; }
function fileProjectName(projectName){ return String(projectName||'').trim().replace(/[\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').replace(/_+/g,'_').slice(0,120); }
function cleanDwlFilePart(value){
  return String(value||'')
    .trim()
    .replace(/[\/:*?"<>|]+/g,'-')
    .replace(/\s+/g,' ')
    .replace(/\s+-\s+/g,' - ')
    .slice(0,120);
}
function normalizeDwlCrewForFile(crewName=''){
  const crew = cleanDwlFilePart(crewName);
  if(!crew) return '';
  return /^day\s+/i.test(crew) ? crew : `Day ${crew}`;
}
function dsifSaveTitle(dateValue, projectName=''){ const datePart=dateToDotMMDDYY(dateValue)||'No.Date'; const projectPart=fileProjectName(projectName); return projectPart ? `DSIF_${datePart}_${projectPart}` : `DSIF_${datePart}`; }
function dwlSaveTitle(dateValue, projectName='', crewName=''){
  const datePart = dateToDotMMDDYY(dateValue) || 'No.Date';
  const projectPart = cleanDwlFilePart(projectName);
  const crewPart = normalizeDwlCrewForFile(crewName);
  return ['DWL', projectPart, datePart, crewPart].filter(Boolean).join(' ');
}

function cleanDwlRevision(value){
  const rev = String(value || '').trim().replace(/^rev(?:ision)?\s*/i,'').replace(/[^0-9A-Za-z.-]/g,'').slice(0,10);
  return rev;
}
function dwlFileTitleWithRevision(baseTitle, revision){
  const rev = cleanDwlRevision(revision);
  if(!rev || rev === '0') return baseTitle;
  return `${baseTitle} Rev ${rev}`;
}
function dwlSubmitStorageKey(data){
  const project = String(data && data.project || '').trim().toLowerCase().replace(/\s+/g,' ');
  const reportDate = String(data && data.reportDate || '').trim();
  const crew = String(data && data.crew || '').trim().toLowerCase().replace(/\s+/g,' ');
  const rev = cleanDwlRevision(data && data.revision || '0') || '0';
  return `jagdDwlSubmitted:${reportDate}:${project}:${crew}:rev${rev}`;
}
function markDwlSubmittedLocally(data, title){
  try{ localStorage.setItem(dwlSubmitStorageKey(data), JSON.stringify({title, savedAt:new Date().toISOString()})); }catch(e){}
}
function getDwlSubmittedLocally(data){
  try{ const raw=localStorage.getItem(dwlSubmitStorageKey(data)); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
}
function confirmDwlSaveAndSend(data, title){
  const duplicate = getDwlSubmittedLocally(data);
  const project = data.project || 'this job';
  const date = dateToSlashYYYY(data.reportDate) || data.reportDate || 'this date';
  const crew = data.crew || 'this crew';
  const rev = cleanDwlRevision(data.revision || '0') || '0';
  let message = `This will save the DWL PDF and automatically send it to the office portal.

Job: ${project}
Date: ${date}
Crew: ${crew}
Revision: ${rev}

After saving, do not edit and save the same DWL again. If a correction is needed, redo the DWL and increase the Revision number before saving.

Continue saving/sending this DWL?`;
  if(duplicate){
    message = `WARNING: This phone/browser already saved a DWL for this same Job, Date, Crew, and Revision.

If this is a correction, cancel and change the Revision number first.

${message}`;
  }
  return window.confirm(message);
}

let nextPdfFileTitle = '';
function setNextPdfFileTitle(title){
  nextPdfFileTitle = String(title || '').trim();
  if(nextPdfFileTitle) document.title = nextPdfFileTitle;
}
function safePdfFileName(){
  const title = nextPdfFileTitle || document.title || 'JAGD Field Form';
  return (String(title).replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').trim() || 'JAGD Field Form') + '.pdf';
}
function base64FromDataUrl(dataUrl){
  return String(dataUrl||'').replace(/^data:application\/pdf;?base64,/i,'');
}
async function downloadPdfDocThroughServer(pdfDoc, filename, msgId){
  const msg = msgId ? document.getElementById(msgId) : null;
  const safeName = String(filename || safePdfFileName()).replace(/[\\/:*?"<>|]/g,'').replace(/\s+/g,' ').trim() || 'JAGD Field Form.pdf';
  try{
    if(msg) msg.innerHTML = '<div class="notice">Preparing named PDF download...</div>';
    const dataUrl = pdfDoc.output('datauristring');
    const pdfBase64 = base64FromDataUrl(dataUrl);
    const res = await fetch('/api/dwl/generated-pdf', {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      body: JSON.stringify({ fileName: safeName, pdfBase64 })
    });
    const json = await res.json().catch(()=>({}));
    if(!res.ok || !json.ok || !json.downloadUrl) throw new Error(json.error || 'Server PDF download was not ready.');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if(isIOS){
      window.location.href = json.downloadUrl;
    } else {
      const a=document.createElement('a');
      a.href=json.downloadUrl;
      a.download=json.fileName || safeName;
      a.rel='noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ try{ a.remove(); }catch(e){} }, 1000);
    }
    if(msg) msg.innerHTML = '<div class="success">DWL PDF saved with the correct file name. If the download screen opens, use Share to send/save it.</div>';
    return true;
  }catch(err){
    console.warn('Server named PDF download failed, falling back to browser save:', err);
    try{ pdfDoc.save(safeName); if(msg) msg.innerHTML='<div class="success">DWL PDF saved. If iPhone changes the file name, office can rename it from the PDF contents.</div>'; return true; }
    catch(e){ if(msg) msg.innerHTML=`<div class="notice">PDF save failed: ${esc(e.message || err.message || '')}</div>`; return false; }
  }
}

function collectPrintCssForCleanPdf(){
  let css='';
  for(const sheet of Array.from(document.styleSheets)){
    try{
      for(const rule of Array.from(sheet.cssRules || [])){
        if(rule.type === CSSRule.MEDIA_RULE && String(rule.conditionText||'').toLowerCase().includes('print')){
          for(const inner of Array.from(rule.cssRules || [])) css += inner.cssText + '\n';
        } else if(rule.type !== CSSRule.MEDIA_RULE) {
          css += rule.cssText + '\n';
        }
      }
    }catch(e){}
  }
  // In the capture iframe, these print rules must not hide the generated print pages.
  css = css.replace(/\.topbar\s*,\s*#app\s*,\s*\.no-print\s*\{[^}]*\}/g, '.topbar,#app,.no-print{display:none!important}');
  css += '\nhtml,body{margin:0!important;padding:0!important;background:#fff!important;}\n';
  css += '.printPage{display:block!important;margin:0!important;padding:0!important;background:#fff!important;}\n';
  css += '.pdfCaptureBody{background:#fff!important;margin:0!important;padding:0!important;}\n';
  css += '.pdfCaptureBody .printPage{display:block!important;position:relative!important;left:auto!important;top:auto!important;}\n';
  css += '.pdfCaptureBody .printPage + .printPage{margin-top:0!important;}\n';
  return css;
}
function waitForImagesIn(node){
  const imgs = Array.from(node.querySelectorAll('img'));
  return Promise.all(imgs.map(img=>{
    if(img.complete) return Promise.resolve();
    return new Promise(res=>{img.onload=res; img.onerror=res; setTimeout(res,1200);});
  }));
}
async function saveCleanPdfFromPrintPage(msgId){
  if(!window.jspdf || !window.jspdf.jsPDF || !window.html2canvas) return false;
  const sourcePages = Array.from(document.querySelectorAll('.printPage'));
  if(!sourcePages.length) return false;
  const msg = msgId ? document.getElementById(msgId) : null;
  if(msg) msg.innerHTML = '<div class="notice">Building clean PDF...</div>';
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden','true');
  iframe.style.position='fixed';
  iframe.style.left='-10000px';
  iframe.style.top='0';
  iframe.style.width='900px';
  iframe.style.height='1200px';
  iframe.style.border='0';
  document.body.appendChild(iframe);
  try{
    const css = collectPrintCssForCleanPdf();
    const pagesHtml = sourcePages.map(p=>p.outerHTML).join('');
    const docEl = iframe.contentDocument;
    docEl.open();
    docEl.write(`<!doctype html><html><head><base href="${location.origin}/"><meta charset="utf-8"><style>${css}</style></head><body class="pdfCaptureBody">${pagesHtml}</body></html>`);
    docEl.close();
    await new Promise(res=>setTimeout(res,120));
    await waitForImagesIn(docEl.body);
    const pages = Array.from(docEl.querySelectorAll('.printPage'));
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation:'portrait', unit:'pt', format:'letter', compress:true});
    const pageW = 612, pageH = 792;
    for(let i=0;i<pages.length;i++){
      const page = pages[i];
      page.style.display='block';
      page.style.background='#fff';
      const canvas = await window.html2canvas(page, {scale:2, backgroundColor:'#ffffff', useCORS:true, allowTaint:true, logging:false, windowWidth:900, windowHeight:1200});
      if(i>0) pdf.addPage('letter','portrait');
      const imgData = canvas.toDataURL('image/jpeg', 0.94);
      let imgW = pageW;
      let imgH = canvas.height * imgW / canvas.width;
      if(imgH > pageH){ imgH = pageH; imgW = canvas.width * imgH / canvas.height; }
      const x = (pageW-imgW)/2;
      const y = 0;
      pdf.addImage(imgData, 'JPEG', x, y, imgW, imgH);
    }
    pdf.save(safePdfFileName());
    if(msg) msg.innerHTML = '<div class="success">Clean PDF created. Use Share/Files/Dropbox to send it.</div>';
    return true;
  } finally {
    setTimeout(()=>{try{iframe.remove();}catch(e){}}, 500);
  }
}
async function openPrintNow(msgId){
  const msg = msgId ? document.getElementById(msgId) : null;
  if (msg) msg.innerHTML = '';
  try {
    // Field fix: generate a clean PDF from the app print page first.
    // This avoids iPhone/Safari adding URL/date/page headers and blank second pages.
    const saved = await saveCleanPdfFromPrintPage(msgId);
    if(saved) return;
    if (typeof window.print !== 'function') throw new Error('Print is not available in this browser');
    const printEl = document.querySelector('.printPage');
    if (printEl) void printEl.offsetHeight;
    window.focus();
    window.print();
  } catch (err) {
    if (msg) msg.innerHTML = `<div class="notice">PDF could not open: ${esc(err.message)}. Refresh once and try again. If needed, use the browser Share button and choose Print / Save as PDF.</div>`;
    console.error(err);
  }
}

function printPdfHelp(type){
  const label = type === 'pir' ? 'PIR' : (type === 'dsif' ? 'DSIF' : 'MEWP');
  return `<p class="tiny saveHelp"><b>Save / send:</b> Use this button, then choose Save as PDF / Print. On iPhone, use Share from the print/PDF screen to text it, email it, or save/send to Dropbox. On Android, use Share or the browser menu, choose Print, select Save as PDF, then share/email/upload the saved PDF.</p>`;
}

const FORM_TYPE_META = {
  dwl:{label:'DWL', bucket:'daily'},
  pir:{label:'PIR', bucket:'daily'},
  mewp:{label:'MEWP', bucket:'daily'},
  daily:{label:'Daily Equipment', bucket:'daily'},
  dsif:{label:'DSIF', bucket:'daily'},
  bol:{label:'Bill of Lading', bucket:'daily'},
  ir:{label:'Incident Report', bucket:'daily'},
  har:{label:'Accident Report', bucket:'daily'},
  dr:{label:'Disciplinary Report', bucket:'daily'},
  'weekly-safety':{label:'Weekly Safety', bucket:'weekly'}
};
function adminPin(){ return localStorage.getItem('jagdAdminPin') || ''; }
function logGeneratedForm(type, project, dateValue, title){
  const body={type, project:project||'No Project', date:dateValue||new Date().toISOString().slice(0,10), title:title||''};
  try{
    const payload=JSON.stringify(body);
    if(navigator.sendBeacon){
      const blob=new Blob([payload],{type:'application/json'});
      navigator.sendBeacon('/api/form-logs', blob);
      return;
    }
    fetch('/api/form-logs',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});
  }catch(e){ console.warn('Could not log generated form', e); }
}
function weekStart(dateStr){
  const d=dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(dateStr+'T00:00:00') : new Date();
  const day=d.getDay();
  const diff=(day+6)%7; // Monday start
  d.setDate(d.getDate()-diff);
  return d;
}
function ymd(d){ return d.toISOString().slice(0,10); }
function weekLabel(dateStr){
  const start=weekStart(dateStr); const end=new Date(start); end.setDate(start.getDate()+6);
  return `${dateToDisplay(ymd(start))} to ${dateToDisplay(ymd(end))}`;
}
function formLabel(type){ return FORM_TYPE_META[type]?.label || String(type||'Form').toUpperCase(); }
function formBucket(type){ return FORM_TYPE_META[type]?.bucket || 'daily'; }
function localPhotoFiles(inputId){ const inp=document.getElementById(inputId); if(!inp) return []; return [...inp.files].filter(f=>f.type.startsWith('image/')).map(f=>({originalName:f.name, mimetype:f.type, url:URL.createObjectURL(f)})); }
function radioBlock(name){return `<div class="choiceBtns"><label><input type="radio" name="${name}" value="YES">YES</label><label><input type="radio" name="${name}" value="NO">NO</label><label><input type="radio" name="${name}" value="N/A">N/A</label></div>`;}
function photoInput(id,label='Photos / attached pages'){return `<div><label for="${id}">${label}</label><input id="${id}" type="file" accept="image/*,.pdf" multiple><p class="tiny">Photos can be attached to the printed/PDF report. Image photos will show in print preview.</p><div id="${id}Preview" class="photoGrid"></div></div>`;}
function setupPhotoPreview(inputId){const input=document.getElementById(inputId), preview=document.getElementById(inputId+'Preview'); if(!input||!preview)return; input.addEventListener('change',()=>{preview.innerHTML=''; [...input.files].forEach(f=>{ if(f.type.startsWith('image/')){ const img=document.createElement('img'); img.src=URL.createObjectURL(f); preview.appendChild(img);} else { const p=document.createElement('div'); p.className='notice'; p.textContent=f.name; preview.appendChild(p);} });});}


function pirMaterialProjectKey(){
  const p=projectValue('pirProject').toUpperCase();
  if(p.includes('GWB') || p.includes('GEORGE WASHINGTON') || p.includes('GW ')) return 'GWB';
  if(p.includes('DYRE') || p.includes('DYER') || p.includes('C35311') || p.includes('C-35311')) return 'DYRE';
  const match = PROJECT_OPTIONS.find(opt => opt && p && opt.toUpperCase() === p);
  return match || p;
}
function materialProjectMatches(m, key){
  const project=String(m.project||'').toUpperCase();
  if(!key) return false;
  if(key==='GWB') return project.includes('GWB') || project.includes('GEORGE WASHINGTON') || project.includes('GW ');
  if(key==='DYRE') return project.includes('DYRE') || project.includes('C35311') || project.includes('C-35311');
  return project===String(key||'').toUpperCase();
}
function adminProjectKeyFromName(projectName){
  const p=String(projectName||'').toUpperCase();
  if(p.includes('GWB') || p.includes('GEORGE WASHINGTON') || p.includes('GW ')) return 'GWB';
  if(p.includes('DYRE') || p.includes('DYER') || p.includes('C35311') || p.includes('C-35311')) return 'DYRE';
  return projectName;
}
function pirMaterialProjectLabel(key){
  if(key==='GWB') return 'GWB';
  if(key==='DYRE') return 'Dyre Ave';
  return key || 'Job';
}
async function loadServerMaterials(){
  if(serverMaterialsLoaded) return serverMaterials;
  try{const res=await fetch('/api/materials',{cache:'no-store'}); const json=await res.json(); if(res.ok && Array.isArray(json.rows)) serverMaterials=json.rows;}
  catch(e){console.warn('Using built-in material helpers only',e);}
  serverMaterialsLoaded=true;
  return serverMaterials;
}
function uniqueMaterials(rows){
  const map=new Map();
  rows.forEach(m=>{ if(m && m.id && !m.disabled) map.set(String(m.id), m); });
  return [...map.values()];
}
function pirMaterialLibrary(key){
  const base = [];
  if(key==='GWB') base.push(...GWB_PIR_MATERIALS);
  if(key==='DYRE') base.push(...DYRE_PIR_MATERIALS);
  base.push(...serverMaterials.filter(m=>materialProjectMatches(m,key)));
  return uniqueMaterials(base);
}
function pirMaterialOptions(componentFilter='', key=''){
  const mats=pirMaterialLibrary(key || pirMaterialProjectKey()).filter(m=>{
    if(!componentFilter) return true;
    const c=String(m.component||'').toLowerCase();
    if(componentFilter==='main') return c.includes('base') || c.includes('paint');
    if(componentFilter==='component') return !c.includes('base') || c.includes('hardener') || c.includes('dust') || c.includes('powder') || c.includes('accelerator') || c.includes('converter');
    return true;
  });
  const groups={};
  mats.forEach(m=>{const g=m.mfr||'Materials'; if(!groups[g]) groups[g]=[]; groups[g].push(m);});
  return '<option value=""></option>' + Object.keys(groups).sort().map(g=>`<optgroup label="${esc(g)}">${groups[g].map(m=>`<option value="${esc(m.id)}">${esc(m.label||m.prodName||m.description||m.batch||'Material')}</option>`).join('')}</optgroup>`).join('');
}
function pirMaterialSelect(i, slot, label, filter){
  return `<div class="pirMaterialControl"><label for="pirMaterial${slot}${i}">${label}</label><select id="pirMaterial${slot}${i}" class="pirMaterialSelect" data-mix="${i}" data-slot="${slot}" data-filter="${filter}">${pirMaterialOptions(filter)}</select></div>`;
}
function pirShelfText(mat){
  if(!mat) return '';
  if(mat.expDate) return `Exp ${mat.expDate}`;
  return mat.shelfLife || '';
}
function findPirMaterial(matId){
  return uniqueMaterials([...GWB_PIR_MATERIALS, ...DYRE_PIR_MATERIALS, ...serverMaterials]).find(m=>m.id===matId);
}
function applyPirMaterialToMix(i, slot, matId){
  const mat=findPirMaterial(matId);
  if(!mat) return;
  const set=(id,val,overwrite=true)=>{const el=document.getElementById(id); if(el && (overwrite || !el.value)) el.value=val||'';};
  const shelf=pirShelfText(mat);
  if(slot==='A'){
    set('pirBatchA'+i, mat.batch);
    set('pirMfgA'+i, mat.mfgDate);
    set('pirShelfA'+i, shelf);
    set('pirMfr'+i, mat.mfr, false);
    set('pirProd'+i, mat.prodName, false);
    set('pirColor'+i, mat.color, false);
    set('pirShelf'+i, shelf, false);
  } else {
    set('pirBatchB'+i, mat.batch);
    set('pirMfgB'+i, mat.mfgDate);
    set('pirShelfB'+i, shelf);
    const comp=String(mat.component||'').toLowerCase();
    if(comp.includes('dust') || comp.includes('powder') || comp.includes('accelerator')){
      set('pirDust'+i, mat.batch || mat.prodName);
    }
  }
}
function updatePirMaterialVisibility(){
  const key=pirMaterialProjectKey();
  const show=!!key;
  const projectLabel=pirMaterialProjectLabel(key);
  document.querySelectorAll('.pirMaterialNotice').forEach(el=>{
    el.style.display=show?'block':'none';
    if(show) el.innerHTML=`<b>${esc(projectLabel)} COA helper:</b> Pick a material/batch below to auto-fill Batch, Mfg Date, Shelf Life/Exp, Mfr, Product, and Color. All fields remain editable.`;
  });
  document.querySelectorAll('.pirMaterialControl').forEach(el=>{el.style.display=show?'block':'none';});
  document.querySelectorAll('.pirMaterialSelect').forEach(sel=>{
    const old=sel.value;
    const filter=sel.dataset.filter || '';
    sel.innerHTML=pirMaterialOptions(filter, key);
    if(old && [...sel.options].some(o=>o.value===old)) sel.value=old;
  });
}
function setupPirMaterialLibrary(){
  document.querySelectorAll('.pirMaterialSelect').forEach(sel=>{
    sel.addEventListener('change',()=>applyPirMaterialToMix(sel.dataset.mix, sel.dataset.slot, sel.value));
  });
  const project=document.getElementById('pirProject');
  if(project){ project.addEventListener('change', updatePirMaterialVisibility); }
  const other=document.getElementById('pirProjectOther');
  if(other){ other.addEventListener('input', updatePirMaterialVisibility); }
  updatePirMaterialVisibility();
}

function mixBlockForm(i){
  const deleteBtn = i > 1 ? `<button type="button" class="btn danger small pirDeleteMixBlock" data-delete-pir-mix="${i}">Delete this block</button>` : '';
  return `<div class="panel innerPanel mixBlock" data-mix="${i}"><div class="mixBlockTitleRow"><h3>Mix / Application Block ${i}</h3>${deleteBtn}</div><div class="notice pirMaterialNotice"><b>COA helper:</b> Pick a material/batch below to auto-fill Batch, Mfg Date, Shelf Life/Exp, Mfr, Product, and Color. All fields remain editable.</div><div class="grid two pirMaterialControls">${pirMaterialSelect(i,'A','COA Product / Part A','main')}${pirMaterialSelect(i,'B','COA Hardener / Dust / Component','component')}</div><div class="grid four">${field('pirMixLoc'+i,'Location')}${field('pirMixTime'+i,'Time','time')}${selectField('pirMixWitness'+i,'Mix Witnessed and Acceptable',['','YES','NO','N/A'])}${field('pirBatchA'+i,'Batch # A')}${field('pirMfgA'+i,'A Mfg Date')}${field('pirShelfA'+i,'A Shelf Life')}${field('pirBatchB'+i,'Batch # B')}${field('pirMfgB'+i,'B Mfg Date')}${field('pirShelfB'+i,'B Shelf Life')}${field('pirDust'+i,'Dust')}${field('pirThinner'+i,'Thinner Type')}${field('pirVolume'+i,'% By Volume')}${field('pirMfr'+i,'Mfr')}${field('pirProd'+i,'Prod. Name')}${field('pirColor'+i,'Color')}${field('pirKit'+i,'Kit Sz/Cond.')}${field('pirPot'+i,'Pot Life')}${field('pirShelf'+i,'Shelf Life')}${field('pirInduction'+i,'Induction Time')}${field('pirTemp'+i,'Temperature')}${field('pirQty'+i,'Quantity Mixed')}${field('pirStart'+i,'Start')}${field('pirFinish'+i,'Finish / Stop')}${field('pirGallons'+i,'Total Gallons')}${field('pirSystem'+i,'Coat / System')}${field('pirMethod'+i,'Application Method')}${field('pirGunTip'+i,'Gun/Tip Size')}${field('pirElapsed'+i,'Time elapsed between coats')}${field('pirDFTPrev'+i,'DFT Avg. Previous Coat')}</div></div>`;
}
function pirMixSnapshot(){
  return Array.from({length:pirMixCount},(_,idx)=>{
    const i=idx+1; const row={};
    PIR_MIX_FIELD_SUFFIXES.forEach(suffix=>{
      const id='pir'+suffix+i; const el=document.getElementById(id);
      row[suffix]=el ? (el.type==='checkbox' ? el.checked : el.value) : '';
    });
    return row;
  });
}
function restorePirMixSnapshot(rows){
  (rows||[]).forEach((row,idx)=>{
    const i=idx+1;
    PIR_MIX_FIELD_SUFFIXES.forEach(suffix=>{
      const el=document.getElementById('pir'+suffix+i);
      if(!el) return;
      const value=row?.[suffix] ?? '';
      if(el.type==='checkbox') el.checked=!!value; else el.value=value;
    });
  });
}
function showPirMixDeleteNotice(message){
  const box=document.getElementById('pirMixDeleteNotice');
  if(!box) return;
  box.textContent=message;
  box.style.display='block';
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function deletePirMixBlock(removeIndex){
  const blockNo=Number(removeIndex);
  if(!Number.isFinite(blockNo) || blockNo < 2) return;
  const ok=window.confirm(`Delete Mix / Application Block ${blockNo}?\n\nAfter deleting, the blocks below it will move up one number. Example: Block ${blockNo+1} becomes Block ${blockNo}.`);
  if(!ok) return;
  const rows=pirMixSnapshot().filter((_,idx)=>idx+1!==blockNo);
  pirMixCount=Math.max(1, rows.length);
  renderPirMixBlocks();
  restorePirMixSnapshot(rows);
  updatePirMaterialVisibility();
  showPirMixDeleteNotice(`Mix / Application Block ${blockNo} was deleted. Remaining blocks were renumbered. Please review the block numbers before saving.`);
}
function renderPirMixBlocks(){
  const box=document.getElementById('pirMixBlocks');
  if(!box) return;

  // Preserve all existing mix-block entries before rebuilding the blocks.
  // Without this, adding/opening Mix Block 2 redraws the entire section and wipes Mix Block 1.
  const previousValues = {};
  box.querySelectorAll('input, select, textarea').forEach(el=>{
    if(!el.id) return;
    previousValues[el.id] = el.type === 'checkbox' ? el.checked : el.value;
  });

  const deleteNoticeHtml='<div id="pirMixDeleteNotice" class="notice" style="display:none;margin-bottom:12px;font-weight:700;"></div>';
  box.innerHTML=deleteNoticeHtml + Array.from({length:pirMixCount},(_,idx)=>mixBlockForm(idx+1)).join('');

  Object.entries(previousValues).forEach(([id, value])=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(el.type === 'checkbox') el.checked = !!value;
    else el.value = value;
  });

  setupPirMaterialLibrary();
  updatePirMaterialVisibility();
  const btn=document.getElementById('addPirMixBlock');
  document.querySelectorAll('[data-delete-pir-mix]').forEach(b=>{ b.onclick=()=>deletePirMixBlock(b.dataset.deletePirMix); });
  if(btn) btn.style.display = pirMixCount >= PIR_MIX_MAX_BLOCKS ? 'none' : 'inline-block';
}
function sigField(id,label){
  return `<div class="signatureWrap"><label>${label}</label><div id="${id}Preview" class="signaturePreview signatureBtn" role="button" tabindex="0" data-sig="${id}" data-label="${esc(label)}">Tap here to sign</div></div>`;
}
function initSignatureButtons(){
  document.querySelectorAll('.signatureBtn').forEach(btn=>{
    const open=()=>openSignatureModal(btn.dataset.sig, btn.dataset.label || 'Signature');
    btn.onclick=open;
    btn.onkeydown=(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(); } };
  });
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

function freshRoute(hash){
  // iPhone Safari can keep stale route/print state in a single-page hash app.
  // Loading the selected form through a normal page request gives every form a fresh print context.
  return `/?r=${Date.now()}${hash}`;
}

function home(){
  app.innerHTML=`<div class="container printOnly homeContainer">
    <section class="homeIntro">
      <h1>JAGD Field Forms</h1>
      <p>Choose a form below. Each form is field-friendly for phones and can be saved as a PDF, then texted, emailed, or sent to Dropbox.</p>
    </section>
    <section class="formLibrary" aria-label="Form Library">
      <a class="formCard" href="${freshRoute('#/dwl')}">
        <div>
          <span class="formTag">Daily Log</span>
          <h2>Daily Work Log</h2>
          <p>DWL 4.0 field log with employee autocomplete, no-lunch tracking, crews, weather, and one-page PDF output.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/pir')}">
        <div>
          <span class="formTag">Paint / QC</span>
          <h2>Paint Inspection Report</h2>
          <p>Questionnaire-style field form that prints to the one-page PIR layout.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/mewp')}">
        <div>
          <span class="formTag">Equipment</span>
          <h2>MEWP Daily Inspection</h2>
          <p>Separate MEWP checklist with pass/fail/N/A, notes, pictures, and finger signature.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/daily-equipment')}">
        <div>
          <span class="formTag">Original Equipment</span>
          <h2>Daily Equipment Inspection</h2>
          <p>The existing JAGD web-based form, kept with the same source/format the PM already built.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/dsif')}">
        <div>
          <span class="formTag">Safety</span>
          <h2>Daily Safety Inspection Form</h2>
          <p>DSIF questionnaire that prints to the two-page safety inspection layout.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/weekly-safety')}">
        <div>
          <span class="formTag">Safety Meeting</span>
          <h2>Weekly Safety Meeting</h2>
          <p>Foreman starts a meeting, displays a QR code, and workers sign in from their phones.</p>
        </div>
        <strong>Open</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/bill-of-lading')}">
        <div>
          <span class="formTag">Material</span>
          <h2>Bill of Lading</h2>
          <p>Blank JAGD bill of lading PDF for material delivery/shipping paperwork.</p>
        </div>
        <strong>Open Form</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/incident-report')}">
        <div>
          <span class="formTag">Safety</span>
          <h2>Incident Report</h2>
          <p>Short incident report PDF for non-truck incidents, OSHA/police reporting, cause, and corrective action.</p>
        </div>
        <strong>Open Form</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/heavy-accident-report')}">
        <div>
          <span class="formTag">Safety</span>
          <h2>Accident Report</h2>
          <p>Accident/incident investigation packet with witness, property, root cause, and code pages.</p>
        </div>
        <strong>Open Form</strong>
      </a>
      <a class="formCard" href="${freshRoute('#/disciplinary-report')}">
        <div>
          <span class="formTag">Employee</span>
          <h2>Disciplinary Report</h2>
          <p>Blank disciplinary action PDF for employee violations, corrective action, and signatures.</p>
        </div>
        <strong>Open Form</strong>
      </a>
      <a class="formCard adminCard" href="${freshRoute('#/admin')}">
        <div>
          <span class="formTag">Office / Admin</span>
          <h2>Admin Dashboard</h2>
          <p>Job tracker, daily/weekly folders, worker list manager, and COA material manager foundation.</p>
        </div>
        <strong>Open Admin</strong>
      </a>
    </section>
  </div>`;
}

function pirForm(){
  app.innerHTML=`<div class="container printOnly"><h1>Paint Inspection Report Questionnaire</h1><div class="pirOnePage">
    <div id="pir-project" class="panel"><h2>Project Information</h2><div class="grid three">${projectField('pirProject','Project')} ${field('pirReportDate','Report Date','date')} ${field('pirDay','Day','text','readonly')} ${field('pirWeatherAM','Weather AM')} ${field('pirWeatherPM','Weather PM')} ${field('pirInspectionReport','Inspection Report #')}</div></div>
    <div id="pir-attached" class="panel"><h2>Attached / Generated Today</h2><p class="tiny">Check any extra JAGD form that was created for this report day. This prints in the PIR header; the blank PDFs are available on the home page.</p><div class="checkGrid">${checkboxField('pirAttachSafety','Safety Report')}${checkboxField('pirAttachPaint','Paint Inspection')}${checkboxField('pirAttachAccident','Accident Report')}${checkboxField('pirAttachIncident','Incident Report')}${checkboxField('pirAttachDisciplinary','Disciplinary Report')}${checkboxField('pirAttachBol','Bill of Lading')}</div></div>
    <div id="pir-hold" class="panel"><h2>Hold Point Inspections Performed</h2><div class="grid two">${pirHoldPoints.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${q}</div>${radioBlock('pirHold'+i)}</div>`).join('')}</div></div>
    <div id="pir-surface" class="panel"><h2>Surface Cleanliness / Profile Measurement</h2><div class="grid three">${field('pirSSPC','SSPC/NACE SP')} ${field('pirSpecifiedProfile','Specified Profile')} ${field('pirProfileCheck','Profile Check')} ${selectField('pirAbrasiveTest','Abrasive Test Acceptable',['','YES','NO','N/A'])} ${selectField('pirBlotterTest','Blotter Test Acceptable',['','YES','NO','N/A'])} ${field('pirChloride1','Chloride ug/cm²')} ${field('pirChloride2','Chloride ug/cm²')} ${selectField('pirIllumination','Illumination Acceptable',['','YES','NO','N/A'])}</div></div>
    <div id="pir-testex" class="panel"><h2>Testex Tape Inserts</h2><div class="testexScreenGrid">${[1,2,3].map(i=>`<div class="testexCard"><div class="testexBox screen"><span>Insert Testex Tape Here</span></div>${field('pirTestexLoc'+i,'Tape '+i+' Location / Area')}${field('pirTestexReading'+i,'Tape '+i+' Profile Reading')}${field('pirTestexNotes'+i,'Tape '+i+' Notes')}</div>`).join('')}</div></div>
    <div id="pir-instruments" class="panel"><h2>Calibrated QC Equipment</h2><div class="grid three">${['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>`<div class="checkrow"><label>${n}</label>${selectField('pirInstYes'+i,'Status',['YES','NO','N/A'])}${field('pirInstSerial'+i,'Serial Number')}${i===4?field('pirPosiAdjust','PA-2 Adjustment made') : ''}</div>`).join('')}</div></div>
    <div id="pir-ambient" class="panel"><h2>Ambient Conditions</h2><p class="tiny"><b>Auto-calc:</b> Enter Dry Bulb + Wet Bulb to calculate % Relative Humidity and Dew Point. Enter Surface Temp to calculate Surface Temp. - Dew Point Spread.</p><p class="tiny noticeInline"><b>Note:</b> Typical field practice is four ambient readings. Add readings as needed; blank readings still print as empty columns.</p><div id="pirAmbientBlocks"></div><div class="actions"><button type="button" class="btn light" id="addPirAmbientBlock">+ Add another Ambient Reading</button></div></div>
    <div id="pir-mixing" class="panel"><h2>Mixing / Application</h2><div id="pirMixBlocks"></div><div class="actions"><button type="button" class="btn light" id="addPirMixBlock">+ Add another Mix / Application Block</button></div></div>
    <div id="pir-caulk" class="panel"><h2>Caulking / Signatures</h2><div class="grid three">${field('pirCaulkLocation','Caulking Location')} ${field('pirCaulkNameBatch','Name / Batch')} ${field('pirTubeSize','Tube Size')} ${field('pirCaulkShelf','Shelf Life')} ${field('pirTotalUsed','Total Amount Used')} ${field('pirQCPrint','QC Print')} ${sigField('pirQCSignature','QC Signature')} ${sigField('pirQCSSignature','QCS Signature')}</div>${textarea('pirGeneralNotes','General Notes / Nonconformance / Corrective Actions')}<div class="actions"><button class="btn light" id="pirAddNotesPageBtn" type="button">+ Add Additional QC Notes Page</button></div><div id="pirAdditionalNotesPanel" class="panel innerPanel" style="display:none"><h2>Additional QC Notes Page</h2><p class="tiny">Optional second page for side notes, cleaned/completed areas, activity times, or anything QC wants to track. This only prints when opened.</p><div class="grid three">${field('pirNotesLocation','Notes Location / Area')} ${field('pirNotesDate','Notes Date','date')} ${field('pirNotesQC','QC Print Name')}</div><div class="extraTableWrap"><table class="table extraEntryTable"><thead><tr><th>Time</th><th>Location / Area</th><th>Activity / What Happened</th><th>Notes</th></tr></thead><tbody>${Array.from({length:8},(_,idx)=>{const i=idx+1;return `<tr><td><input id="pirNoteTime${i}" type="time"></td><td><input id="pirNoteLoc${i}"></td><td><input id="pirNoteAct${i}"></td><td><input id="pirNoteText${i}"></td></tr>`}).join('')}</tbody></table></div>${textarea('pirNotesSummary','Additional Summary / QC Comments')}<div class="grid two">${field('pirNotesPrint','QC Print')} ${sigField('pirNotesSignature','QC Signature')}</div></div><div class="actions"><button class="btn" id="pirPrintBtn">Save PDF / Print PIR</button></div>${printPdfHelp('pir')}<div id="pirMsg"></div></div>
  </div></div>`;
  const dateEl=document.getElementById('pirReportDate');
  const dayEl=document.getElementById('pirDay');
  const reportEl=document.getElementById('pirInspectionReport');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value=''; return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); };
  const updateReportNumber=()=>{ if(reportEl) reportEl.value = dateToMMDDYY(dateEl.value); };
  setupOtherProject('pirProject');
  loadServerMaterials().then(()=>updatePirMaterialVisibility());
  dateEl.value=new Date().toISOString().slice(0,10);
  updateDay();
  updateReportNumber();
  dateEl.addEventListener('change', ()=>{ updateDay(); updateReportNumber(); });
  pirMixCount=1; renderPirMixBlocks();
  pirAmbientCount=1; renderPirAmbientBlocks();
  pirAdditionalNotesOpen=false;
  const pirNotesBtn=document.getElementById('pirAddNotesPageBtn');
  if(pirNotesBtn){pirNotesBtn.onclick=()=>{pirAdditionalNotesOpen=true; const panel=document.getElementById('pirAdditionalNotesPanel'); if(panel) panel.style.display='block'; pirNotesBtn.textContent='Additional QC Notes Page Added'; pirNotesBtn.disabled=true; const d=document.getElementById('pirNotesDate'); if(d && !d.value) d.value=val('pirReportDate'); const qc=document.getElementById('pirNotesQC'); if(qc && !qc.value) qc.value=val('pirQCPrint'); panel&&panel.scrollIntoView({behavior:'smooth',block:'start'});};}
  document.getElementById('addPirMixBlock').onclick=()=>{pirMixCount=Math.min(PIR_MIX_MAX_BLOCKS,pirMixCount+1); renderPirMixBlocks();};
  document.getElementById('addPirAmbientBlock').onclick=()=>{pirAmbientCount=Math.min(4,pirAmbientCount+1); renderPirAmbientBlocks(); if(pirAmbientCount>=4) document.getElementById('addPirAmbientBlock').disabled=true;};
  initSignatureButtons();
  document.getElementById('pirPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectPir(); document.title = formSaveTitle('pir', data.reportDate, data.project); logGeneratedForm('pir', data.project, data.reportDate, document.title); buildPirPrint(data); openPrintNow('pirMsg');}catch(err){const msg=document.getElementById('pirMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);} };
}

function collectPir(){
 const attachedPages=[
   isChecked('pirAttachSafety')?'Safety Report':'',
   isChecked('pirAttachPaint')?'Paint Inspection':'',
   isChecked('pirAttachAccident')?'Accident Report':'',
   isChecked('pirAttachIncident')?'Incident Report':'',
   isChecked('pirAttachDisciplinary')?'Disciplinary Report':'',
   isChecked('pirAttachBol')?'Bill of Lading':''
 ].filter(Boolean).join(', ');
 const data={project:projectValue('pirProject'),reportDate:val('pirReportDate'),day:val('pirDay'),weatherAM:val('pirWeatherAM'),weatherPM:val('pirWeatherPM'),inspectionReport:val('pirInspectionReport'),attachedPages,page:'1',pageOf:'1',holdPoints:pirHoldPoints.map((q,i)=>({q,status:checked('pirHold'+i)})),sspc:val('pirSSPC'),specifiedProfile:val('pirSpecifiedProfile'),profileCheck:val('pirProfileCheck'),abrasiveTest:val('pirAbrasiveTest'),blotterTest:val('pirBlotterTest'),chloride1:val('pirChloride1'),chloride2:val('pirChloride2'),illumination:val('pirIllumination'),testex:[1,2,3].map(i=>({location:val('pirTestexLoc'+i),reading:val('pirTestexReading'+i),notes:val('pirTestexNotes'+i)})),posiAdjust:val('pirPosiAdjust'),generalNotes:val('pirGeneralNotes'),qcPrint:val('pirQCPrint'),qcSignature:val('pirQCSignature'),qcsSignature:val('pirQCSSignature'),caulking:{location:val('pirCaulkLocation'),nameBatch:val('pirCaulkNameBatch'),tubeSize:val('pirTubeSize'),shelf:val('pirCaulkShelf'),totalUsed:val('pirTotalUsed')}};
 data.instruments=['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>({name:n,status:val('pirInstYes'+i),serial:val('pirInstSerial'+i)}));
 data.ambient=[1,2,3,4].map(i=>({location:val('pirAmbLoc'+i),time:val('pirAmbTime'+i),dry:val('pirDry'+i),wet:val('pirWet'+i),rh:val('pirRH'+i),surface:val('pirSurf'+i),dew:val('pirDew'+i),diff:val('pirDiff'+i)}));
 data.mixing=Array.from({length:pirMixCount},(_,idx)=>idx+1).map(i=>({location:val('pirMixLoc'+i),time:val('pirMixTime'+i),witness:val('pirMixWitness'+i),batchA:val('pirBatchA'+i),mfgA:val('pirMfgA'+i),shelfA:val('pirShelfA'+i),batchB:val('pirBatchB'+i),mfgB:val('pirMfgB'+i),shelfB:val('pirShelfB'+i),dust:val('pirDust'+i),thinner:val('pirThinner'+i),volume:val('pirVolume'+i),mfr:val('pirMfr'+i),prod:val('pirProd'+i),color:val('pirColor'+i),kit:val('pirKit'+i),pot:val('pirPot'+i),shelf:val('pirShelf'+i),induction:val('pirInduction'+i),temp:val('pirTemp'+i),qty:val('pirQty'+i),start:val('pirStart'+i),finish:val('pirFinish'+i),gallons:val('pirGallons'+i),system:val('pirSystem'+i),method:val('pirMethod'+i),gunTip:val('pirGunTip'+i),elapsed:val('pirElapsed'+i),dftPrev:val('pirDFTPrev'+i)}));
 data.qcSignatureData=signatureStore.pirQCSignature || ''; data.qcsSignatureData=signatureStore.pirQCSSignature || ''; data.mixingCount=pirMixCount;
 data.additionalNotesOpen=pirAdditionalNotesOpen || !!document.getElementById('pirAdditionalNotesPanel')?.offsetParent;
 data.additionalNotes={location:val('pirNotesLocation'),date:val('pirNotesDate'),qc:val('pirNotesQC'),summary:val('pirNotesSummary'),print:val('pirNotesPrint'),signature:val('pirNotesSignature'),signatureData:signatureStore.pirNotesSignature||'',rows:Array.from({length:8},(_,idx)=>{const i=idx+1; return {time:val('pirNoteTime'+i),location:val('pirNoteLoc'+i),activity:val('pirNoteAct'+i),notes:val('pirNoteText'+i)};})};
 return data;
}

function buildPirPrint(data=collectPir(), files=[]){
 const hp = data.holdPoints || [];
 const inst = data.instruments || [];
 const amb = data.ambient || [];
 const mix = data.mixing || [];
 const cell=(x)=>esc(x||'');
 const instRows=['Sling Psychrometer','Surface Temperature Gage','Calibration Plates','Micrometer','Positector','Wet Film Thickness Gage','Inspection Equip inspected in last 12 Months?'].map((n,i)=>{
   const row=inst[i]||{}; return `<div class="pirCell tinyCell">${cell(row.status||'YES')}</div><div class="pirCell tinyCell">${cell(n)}</div><div class="pirCell tinyCell">${cell(row.serial)}</div>`;
 }).join('') + `<div class="pirCell tinyCell">YES</div><div class="pirCell tinyCell">Posi verified as per PA-2?</div><div class="pirCell tinyCell">Adjustment made: ${cell(data.posiAdjust)}</div>`;
 const ambHead=`<div class="pirCell tinyCell"></div>${amb.map(a=>`<div class="pirCell tinyCell center">${cell(a.location)}</div>`).join('')}`;
 const ambRows=[['Time','time'],['Dry Bulb Temp','dry'],['Wet Bulb Temp','wet'],['% Relative Humidity','rh'],['Surface Temp.','surface'],['Dew Point','dew'],['Surface Temp. - Dew Point Spread','diff']].map(([label,key])=>`<div class="pirCell tinyCell">${label}</div>${amb.map(a=>`<div class="pirCell tinyCell center">${cell(a[key])}</div>`).join('')}`).join('');
 const mixBlock=(m={})=>`<div class="mixPrintBlock"><div class="mixRow"><span><b>Location:</b> ${cell(m.location)}</span><span><b>Time:</b> ${cell(m.time)}</span></div><div class="mixHead">Batch #'s <span>Mix Witnessed and Acceptable ${cell(m.witness)}</span></div><div class="mixGrid"><span>(A) ${cell(m.batchA)}</span><span>Mfg Date ${cell(m.mfgA)}</span><span>Shelf Life ${cell(m.shelfA)}</span><span>(B) ${cell(m.batchB)}</span><span>Mfg Date ${cell(m.mfgB)}</span><span>Shelf Life ${cell(m.shelfB)}</span><span>Dust ${cell(m.dust)}</span><span>Thinner Type ${cell(m.thinner)}</span><span>% By Volume ${cell(m.volume)}</span><span>Mfr: ${cell(m.mfr)}</span><span>Prod. Name: ${cell(m.prod)}</span><span>Color: ${cell(m.color)}</span><span>Kit Sz/Cond.: ${cell(m.kit)}</span><span>Pot Life: ${cell(m.pot)}</span><span>Shelf Life: ${cell(m.shelf)}</span><span>Induction Time: ${cell(m.induction)}</span><span>Temperature: ${cell(m.temp)}</span><span>Quantity Mixed: ${cell(m.qty)}</span></div><div class="mixHead">Application</div><div class="mixGrid app"><span>Start: ${cell(m.start)}</span><span>Finish/Stop: ${cell(m.finish)}</span><span>Total Gallons: ${cell(m.gallons)}</span><span>Coat: ${cell(m.system)}</span><span>Method: ${cell(m.method)}</span><span>Gun/Tip Size: ${cell(m.gunTip)}</span><span>DFT Avg. Previous Coat: ${cell(m.dftPrev)}</span><span>Time elapsed between coats: ${cell(m.elapsed)}</span></div></div>`;
 const firstMix=[0,1,2,3].map(i=>mixBlock(mix[i]||{})).join('');
 const extraMixRows=mix.slice(4).filter(m=>Object.values(m||{}).some(v=>String(v||'').trim()));
 const extraMixPage=extraMixRows.length?`<div class="pirMixExtraSheet"><div class="pirNotesHeader"><img src="${logo}"><div><h1>Paint Inspection Report - Additional Mix / Application Blocks</h1><p>Project: ${cell(data.project)} &nbsp; | &nbsp; Report Date: ${cell(data.reportDate)} &nbsp; | &nbsp; Inspection Report #: ${cell(data.inspectionReport)}</p></div></div><div class="pirExtraMixGrid">${extraMixRows.map(mixBlock).join('')}</div></div>`:'';
 const testex=[0,1,2].map(i=>`<div class="testexBox pirTestexPrint"><span>Insert Testex Tape Here</span></div><div class="testexMeta">${cell(data.testex?.[i]?.location)} ${cell(data.testex?.[i]?.reading)} ${cell(data.testex?.[i]?.notes)}</div>`).join('');
 const holdText=pirHoldPoints.map((q,i)=>`${cell(q)} ${cell(hp[i]?.status)}`).join('<br>');
 const html=`<div class="pirSheetV7">
   <div class="pirHeaderV7">
     <div class="pirHLeft"><b>Project:</b> ${cell(data.project)}<br><b>Report Date:</b> ${cell(data.reportDate)}<br><b>Attached Pages:</b> ${cell(data.attachedPages)}</div>
     <div class="pirHLogo"><img src="${logo}"></div>
     <div class="pirHTitle"><b>Paint Inspection Report</b></div>
     <div class="pirHRight"><b>Weather:</b> AM ${cell(data.weatherAM)} &nbsp; PM ${cell(data.weatherPM)}</div>
     <div class="pirHDay"><b>DAY:</b> ${cell(data.day)}</div>
     <div class="pirHReport"><b>Inspection Report #:</b> ${cell(data.inspectionReport)}</div>
     <div class="pirHPage"><b>Page:</b> 1 of 1</div>
   </div>
   <div class="pirTopV7">
     <div class="pirTopCol"><div class="pirBar">Hold Point Inspections Performed</div><div class="pirTopBody">${holdText}</div></div>
     <div class="pirTopCol"><div class="pirBar">Surface Cleanliness</div><div class="pirTopBody">SSPC/NACE SP: ${cell(data.sspc)}<br>Profile Check: ${cell(data.profileCheck)}<br>Tape / Specified Profile: ${cell(data.specifiedProfile)}<br>Abrasive Test Acceptable: ${cell(data.abrasiveTest)}<br>Blotter Test Acceptable: ${cell(data.blotterTest)}<br>Chloride: ${cell(data.chloride1)} ug/cm²<br>Chloride: ${cell(data.chloride2)} ug/cm²<br>Illumination Acceptable: ${cell(data.illumination)}</div></div>
     <div class="pirTopCol"><div class="pirBar">Profile Measurement</div><div class="pirTestexStackV7">${testex}</div></div>
   </div>
   <div class="pirIAHead">Instruments / Ambient Conditions</div>
   <div class="pirIAV7">
     <div class="pirInstGrid">${instRows}</div>
     <div class="pirAmbGrid">${ambHead}${ambRows}</div>
   </div>
   <div class="pirMixHeadV7">Mixing / Application</div>
   <div class="pirMixGridV7">${firstMix}</div>
   <div class="pirCaulkHeadV7">Caulking</div>
   <div class="pirCaulkGridV7"><div>Location: ${cell(data.caulking?.location)}</div><div>Name/Batch: ${cell(data.caulking?.nameBatch)}</div><div>Tube Size: ${cell(data.caulking?.tubeSize)}</div><div>Shelf Life: ${cell(data.caulking?.shelf)}</div><div>Total Amount Used: ${cell(data.caulking?.totalUsed)}</div></div>
   <div class="pirSigGridV7"><div>QC Print: ${cell(data.qcPrint)}</div><div>QC Signature: ${sigPrint(data.qcSignatureData,data.qcSignature)}</div><div>QCS Signature: ${sigPrint(data.qcsSignatureData,data.qcsSignature)}</div></div>
   <div class="pirRevV7">PIR Revision 0</div>
 </div>`;
 const notes=data.additionalNotes||{};
 const hasNotes=data.additionalNotesOpen || (notes.summary||notes.location||notes.qc||notes.print||'').trim() || (notes.rows||[]).some(r=>r.time||r.location||r.activity||r.notes);
 const notesRows=(notes.rows||Array.from({length:8},()=>({}))).map(r=>`<tr><td>${cell(r.time)}</td><td>${cell(r.location)}</td><td>${cell(r.activity)}</td><td>${cell(r.notes)}</td></tr>`).join('');
 const notesPage=hasNotes?`<div class="pirNotesSheet"><div class="pirNotesHeader"><img src="${logo}"><div><h1>Paint Inspection Report - Additional QC Notes</h1><p>Project: ${cell(data.project)} &nbsp; | &nbsp; Report Date: ${cell(data.reportDate)} &nbsp; | &nbsp; Inspection Report #: ${cell(data.inspectionReport)}</p></div></div><table class="extraPrintTable"><tr><th>Date</th><td>${cell(notes.date||data.reportDate)}</td><th>Location / Area</th><td>${cell(notes.location)}</td><th>QC</th><td>${cell(notes.qc||data.qcPrint)}</td></tr></table><table class="extraPrintTable pirNotesTable"><tr><th>Time</th><th>Location / Area</th><th>Activity / What Happened</th><th>Notes</th></tr>${notesRows}</table>${extraPrintBox('Additional Summary / QC Comments',notes.summary||'',1.35)}<div class="extraSigGrid two"><div><b>QC Print:</b> ${cell(notes.print||notes.qc||data.qcPrint)}</div><div><b>QC Signature:</b> ${sigPrint(notes.signatureData,notes.signature||'')}</div></div></div>`:'';
 const finalHtml=html+extraMixPage+notesPage;
 setPrint(finalHtml); return finalHtml;
}

function mewpForm(){
 app.innerHTML=`<div class="container printOnly"><h1>MEWP Daily Equipment Inspection</h1><div class="panel"><h2>Equipment / Job Information</h2><div class="grid three">${projectField('mewpJobName','Project / Job')} ${field('mewpLocation','Location / Work Area')} ${field('mewpDate','Inspection Date','date')} ${field('mewpTime','Inspection Time','time')} ${field('mewpInspector','Inspector Name')} ${field('mewpCompany','Company','text','value="JAGD Construction"')} ${field('mewpEquipmentId','Equipment ID / Unit #')} ${field('mewpMakeModel','Make / Model')} ${field('mewpSerial','Serial #')} ${field('mewpHours','Hour Meter')} ${field('mewpOperator','Operator')} ${selectField('mewpOverall','Overall Status',['Ready for Use','Do Not Use - Correction Required','N/A'])}</div></div><div class="panel"><h2>MEWP Checklist</h2>${mewpQuestions.map((q,i)=>`<div class="checkrow"><div class="questionTitle">${i+1}. ${q}</div><div class="choiceBtns"><label><input type="radio" name="mewpQ${i}" value="PASS">PASS</label><label><input type="radio" name="mewpQ${i}" value="FAIL">FAIL</label><label><input type="radio" name="mewpQ${i}" value="N/A">N/A</label></div><label>Notes / corrective action</label><textarea id="mewpNote${i}"></textarea></div>`).join('')}</div><div class="panel"><h2>Pictures / Signature</h2>${photoInput('mewpPhotos','Pictures')}${textarea('mewpGeneralNotes','General Notes')}${sigField('mewpSignature','Inspector Signature')}<div class="actions"><button class="btn" id="mewpPrintBtn" type="button">Save PDF / Print MEWP</button></div>${printPdfHelp('mewp')}<div id="mewpMsg"></div></div></div>`;
 setupOtherProject('mewpJobName');
 setupPhotoPreview('mewpPhotos');
 document.getElementById('mewpDate').value=new Date().toISOString().slice(0,10);
 initSignatureButtons();
 document.getElementById('mewpPrintBtn').onclick=(e)=>{e.preventDefault(); try{const btn=document.getElementById('mewpPrintBtn'); const msg=document.getElementById('mewpMsg'); if(btn) btn.disabled=true; if(msg) msg.innerHTML='<div class="notice">Opening MEWP print / save screen...</div>'; const data=collectMewp(); document.title = formSaveTitle('mewp', data.inspectionDate, data.jobName); buildMewpPrint(data, []); openPrintNow('mewpMsg'); logGeneratedForm('mewp', data.jobName, data.inspectionDate, document.title); setTimeout(()=>{if(btn) btn.disabled=false;},1200);}catch(err){const msg=document.getElementById('mewpMsg'); if(msg) msg.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; const btn=document.getElementById('mewpPrintBtn'); if(btn) btn.disabled=false; console.error(err);} };
}
function collectMewp(){return {jobName:projectValue('mewpJobName'),location:val('mewpLocation'),inspectionDate:val('mewpDate'),time:val('mewpTime'),inspector:val('mewpInspector'),company:val('mewpCompany'),equipmentId:val('mewpEquipmentId'),makeModel:val('mewpMakeModel'),serial:val('mewpSerial'),hours:val('mewpHours'),operator:val('mewpOperator'),overall:val('mewpOverall'),generalNotes:val('mewpGeneralNotes'),signature:val('mewpSignature'),signatureData:signatureStore.mewpSignature||'',questions:mewpQuestions.map((q,i)=>({q,status:checked('mewpQ'+i),notes:val('mewpNote'+i)}))};}
function buildMewpPrint(data=collectMewp(), files=[]){const rows=(data.questions||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.q)}</td><td>${esc(x.status)}</td><td>${esc(x.notes)}</td></tr>`).join(''); const html=`<div class="mewpSheet mewpSheetSafe"><div class="mewpHeader"><img src="${logo}"><div class="mewpTitle">MEWP Daily Equipment Inspection<br><span style="font-size:12px;font-weight:400">JAGD Construction</span></div></div><table class="printTable mewpInfoTable"><tr><td><b>Project / Job:</b> ${esc(data.jobName)}</td><td><b>Location:</b> ${esc(data.location)}</td><td><b>Date:</b> ${esc(data.inspectionDate)}</td></tr><tr><td><b>Inspector:</b> ${esc(data.inspector)}</td><td><b>Time:</b> ${esc(data.time)}</td><td><b>Overall Status:</b> ${esc(data.overall)}</td></tr><tr><td><b>Equipment ID:</b> ${esc(data.equipmentId)}</td><td><b>Make / Model:</b> ${esc(data.makeModel)}</td><td><b>Serial #:</b> ${esc(data.serial)}</td></tr><tr><td><b>Hour Meter:</b> ${esc(data.hours)}</td><td><b>Operator:</b> ${esc(data.operator)}</td><td><b>Company:</b> ${esc(data.company)}</td></tr></table><h3>Inspection Checklist</h3><table class="printTable mewpCheckTable"><tr><th>#</th><th>Inspection Item</th><th>Status</th><th>Notes / Corrective Action</th></tr>${rows}</table><p class="mewpNotesPrint"><b>General Notes:</b> ${esc(data.generalNotes)}</p><p class="mewpSigPrint"><b>Inspector Signature:</b> ${data.signatureData?`<img class="sigPrint" src="${data.signatureData}">`:esc(data.signature)}</p></div>`; setPrint(html); return html;}
async function saveForm(type,data,photoInputId,msgId){const msg=document.getElementById(msgId); msg.innerHTML='<div class="notice">Saving...</div>'; const fd=new FormData(); fd.append('type',type); fd.append('data',JSON.stringify(data)); const inp=document.getElementById(photoInputId); if(inp){[...inp.files].forEach(f=>fd.append('photos',f));} try{const res=await fetch('/api/submissions',{method:'POST',body:fd}); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Save failed'); msg.innerHTML=`<div class="success">Saved as: ${esc(json.title || json.record?.title || json.id)}</div>`;}catch(e){msg.innerHTML=`<div class="notice">Could not save: ${esc(e.message)}. You can still print from this screen.</div>`;}}
async function submissions(){app.innerHTML=`<div class="container printOnly"><h1>Saved Submissions</h1><div class="actions"><button class="btn" onclick="loadSubmissions()">Refresh</button><a class="btn light" href="#/">Back</a></div><div id="savedList" class="panel">Loading...</div></div>`; await loadSubmissions();}
async function loadSubmissions(){const box=document.getElementById('savedList'); try{const rows=await (await fetch('/api/submissions')).json(); if(!rows.length){box.innerHTML='<p>No saved submissions yet.</p>';return;} box.innerHTML=`<table class="table"><tr><th>Saved</th><th>Form</th><th>Saved Name</th><th>Project / Job</th><th>Open</th></tr>${rows.map(r=>`<tr><td>${new Date(r.createdAt).toLocaleString()}</td><td>${esc(r.type).toUpperCase()}</td><td>${esc(r.title)}</td><td>${esc(r.project)}</td><td><button class="btn small" onclick="openSubmission('${r.id}')">Open</button></td></tr>`).join('')}</table>`;}catch(e){box.innerHTML=`<div class="notice">Could not load saved submissions: ${esc(e.message)}</div>`;}}
async function openSubmission(id){const record=await (await fetch('/api/submissions/'+id)).json(); if(record.type==='pir') buildPirPrint(record.data, record.files||[]); else buildMewpPrint(record.data, record.files||[]); setTimeout(()=>window.print(), 100);}


const DAILY_EQUIPMENT_CHECKLISTS = [
  { key:'air-compressor', title:'Air Compressor – Daily Inspection Checklist', items:['Engine oil level correct','Coolant level correct','Fuel level sufficient','No visible fluid leaks','Air filters clean','Moisture drained from system','Hoses and fittings secure','Guards and covers secure','Gauges operating properly','Emergency shutdown functional'] },
  { key:'dust-collector', title:'Dust Collector – Daily Inspection Checklist', items:['Guards and access panels secure','Emergency stops functional','Warning labels legible','No visible damage or leaks','Filter bags/cartridges intact','Differential pressure normal','Hopper free of buildup','Dust discharge operating','Control panel indicators normal','No alarm conditions present'] },
  { key:'blast-machine', title:'Blast Machine – Daily Inspection Checklist', items:['Machine frame and guards intact','Emergency stop functional','Access doors secured','Screens free of blockage','Magnetic separator clean','Conveyors operating smoothly','Air lines free of leaks','Bearings lubricated','No abnormal vibration or noise'] },
  { key:'vacuum', title:'Vacuum – Daily Inspection Checklist', items:['Blower operating normally (28&quot; Hg)','Hoses free of damage','Boom and joints operate smoothly','Tank free of excessive buildup','Rear door seals intact','Door latching secure','Sludge pump functional','Valves operate smoothly','No hydraulic leaks observed'] }
];
function dailyStatusButtons(pageIndex,itemIndex){return `<div class="choiceBtns dailyChoice"><label><input type="radio" name="daily_${pageIndex}_${itemIndex}" value="OK">OK</label><label><input type="radio" name="daily_${pageIndex}_${itemIndex}" value="Needs Attention">Needs Attention</label></div>`;}
function dailyEquipmentForm(){
  app.innerHTML=`<div class="container printOnly dailyLocalContainer">
    <h1>Daily Equipment Inspection</h1>
    <div class="panel"><h2>Project / Inspector Information</h2><div class="grid three">${projectField('dailyProject','Project')} ${field('dailyDate','Date','date')} ${field('dailyInspector','Filled By / Printed Name')}</div>${sigField('dailySignature','Signature')}<p class="tiny">Fill out only the equipment used today. Mark the rest as N/A. Photos can be attached to each checklist section.</p></div>
    ${DAILY_EQUIPMENT_CHECKLISTS.map((page,pi)=>`<div class="panel dailyChecklist" data-page="${pi}"><div class="dailySectionHead"><h2>${page.title}</h2><label class="naBox"><input type="checkbox" id="dailyNa${pi}"> N/A</label></div>${page.items.map((q,ii)=>`<div class="checkrow dailyItem"><div class="questionTitle">${q}</div>${dailyStatusButtons(pi,ii)}<label>Comments</label><textarea id="dailyComment_${pi}_${ii}"></textarea></div>`).join('')} ${photoInput('dailyPhotos'+pi,'Photo Documentation')} ${textarea('dailyAdditional'+pi,'Additional Comments')}</div>`).join('')}
    <div class="panel"><div class="actions"><button class="btn light" id="dailyResetBtn" type="button">Reset</button><button class="btn" id="dailyPrintBtn" type="button">Save PDF / Print Daily Equipment Inspection</button></div><p class="tiny saveHelp"><b>Save / send:</b> Use Save PDF / Print, then choose Save as PDF. On iPhone, use Share from the print/PDF screen to text it, email it, or save/send to Dropbox.</p><div id="dailyMsg"></div></div>
  </div>`;
  setupOtherProject('dailyProject');
  document.getElementById('dailyDate').value=new Date().toISOString().slice(0,10);
  DAILY_EQUIPMENT_CHECKLISTS.forEach((_,pi)=>setupPhotoPreview('dailyPhotos'+pi));
  initSignatureButtons();
  document.getElementById('dailyResetBtn').onclick=()=>{ if(confirm('Reset this Daily Equipment Inspection form?')) dailyEquipmentForm(); };
  document.getElementById('dailyPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectDailyEquipment(); document.title=formSaveTitle('daily', data.date, data.project); logGeneratedForm('daily', data.project, data.date, document.title); buildDailyEquipmentPrint(data); openPrintNow('dailyMsg');}catch(err){document.getElementById('dailyMsg').innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function collectDailyEquipment(){return {project:projectValue('dailyProject'),date:val('dailyDate'),inspector:val('dailyInspector'),signature:val('dailySignature'),signatureData:signatureStore.dailySignature||'',pages:DAILY_EQUIPMENT_CHECKLISTS.map((page,pi)=>({title:page.title,na:document.getElementById('dailyNa'+pi)?.checked||false,items:page.items.map((q,ii)=>({q:q.replace('&quot;','"'),status:checked('daily_'+pi+'_'+ii),comment:val('dailyComment_'+pi+'_'+ii)})),additional:val('dailyAdditional'+pi),photos:localPhotoFiles('dailyPhotos'+pi)}))};}
function buildDailyEquipmentPrint(data=collectDailyEquipment()){
  const dateLabel = (data.date||'').replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$2/$3/$1');
  const pages = (data.pages||[]).filter(p=>!p.na);
  const list = pages.length ? pages : (data.pages||[]).slice(0,1);
  const html = list.map(page=>`<div class="dailyPrintSheet"><div class="dailyPrintHeader"><img src="${logo}"><div><h1>JAGD Construction</h1><h2>${esc(page.title)}</h2></div><span>1.0</span></div><div class="dailyProjectLine"><b>Project Name:</b> ${esc(data.project)}</div><table class="dailyPrintTable"><tr><th>Inspection / Maintenance Item</th><th>OK</th><th>Needs Attention</th><th>Comments</th></tr>${(page.items||[]).map(item=>`<tr><td>${esc(item.q)}</td><td class="centerMark">${item.status==='OK'?'✓':''}</td><td class="centerMark">${item.status==='Needs Attention'?'✓':''}</td><td>${esc(item.comment)}</td></tr>`).join('')}</table><h3>Photo Documentation</h3><div class="dailyPhotoBoxes">${[0,1,2,3].map(i=>`<div>${page.photos?.[i]?.url?`<img src="${page.photos[i].url}">`:''}</div>`).join('')}</div><p class="dailyComments"><b>Additional Comments:</b> ${esc(page.additional)}</p><div class="dailyPrintSig"><span><b>Name:</b> ${esc(data.inspector)}</span><span><b>Signature:</b> ${sigPrint(data.signatureData,data.signature)}</span><span><b>Date:</b> ${esc(dateLabel)}</span></div></div>`).join('');
  setPrint(html); return html;
}

const DSIF_SECTIONS = [
  {key:'platform', title:'Platform/Scaffold/Engineered Platform & Shield Systems', sub:'OSHA 1926 Subpart L', commentHeader:'Platform Repairs Performed', questions:[
    'Is the platform/scaffold/engineered system fully decked, secured, and free of loose or missing components?',
    'Is platform deflection (sag) within allowable limits per approved plans?',
    'Are all anchors, outriggers, and chokers properly installed, secured, and not overloaded?',
    'Are fall protection systems in place, including guardrails or 100% tie-off, with properly rated anchor points (5,000 lbs or engineered) and appropriate lanyards/SRLs in use?',
    'Are all rigging hoists and braking systems operational?',
    'Has a functionality check been completed on all equipment prior to use?',
    'Is safe access provided to all platforms/scaffolds/engineered systems?',
    'Is the drop zone established and controlled?',
    'Are wind and weather conditions verified to be within allowable limits for work? Wind Speed/Direction:',
    'Are approved plans for the platform/scaffold/engineered system available on site?',
    'Has a competent person inspection been completed, and is the system approved for use?'
  ]},
  {key:'blast', title:'Blast and Paint', sub:'Per OSHA 1926.57, 1910.107/AMPP/SSPC Guide 6&8', commentHeader:'Comments', questions:[
    'Are blast hoods and required PPE in use and in serviceable condition?',
    'Are all hoses, couplings, whip checks, and fittings properly secured and in good condition?',
    'Are deadman controls installed on all blast hoses and functioning properly?',
    'Are spray guns equipped with required safety devices (e.g., tip guards/knuckle guards), and are safety locks functional?',
    'Are required filters (organic vapor and particulate) inspected and within their service life?',
    'Are VOC and LEL levels within specified limits? Specification Limit:',
    'Is the air purifying system identified, and are filter change dates documented?',
    'Is a CO monitor present, calibrated, and functioning properly?',
    'Is all required monitoring equipment within calibration and verified operational (bump tested) prior to use?'
  ]},
  {key:'decon', title:'Decontamination Area', sub:'OSHA 1926.62 (Lead Standard)', commentHeader:'Comments', questions:[
    'Is a decontamination area/trailer present, accessible, and maintained in a clean and functional condition?',
    'Are employees utilizing handwashing stations prior to breaks?',
    'Does the decontamination trailer have required supplies (soap, water, towels, and clean work clothing)?',
    'Are employees exposed above the PEL utilizing shower facilities at the end of the work shift?',
    'Is contaminated (dirty) clothing handled, stored, and disposed of in accordance with project requirements?',
    'Are street clothes stored separately from contaminated work areas (clean side of decontamination area)?',
    'Are respirators properly maintained, cleaned, and stored?'
  ]},
  {key:'waste', title:'Waste Area', sub:'EPA 40 CFR 262/OSHA 1926.65', commentHeader:'Comments', questions:[
    'Is the hazardous waste storage area secure and waste properly stored?',
    'Is wastewater and paint waste properly contained and stored?',
    'Has any hazardous waste exceeded allowable on-site storage time limits? Specified days allowed:',
    'Was the hazardous waste storage area inspected for cleanliness?',
    'Was any hazardous waste shipped off-site on this date?'
  ]},
  {key:'work', title:'Work Area', sub:'OSHA 1926.20, 1926.21', commentHeader:'Comments', questions:[
    'Is the restricted work area properly segregated with required barriers, caution tape, and signage?',
    'Are employees and authorized personnel within restricted areas utilizing required PPE?',
    'Is the work area free of visible spills or dust accumulation at the end of work inspection?',
    'Are tools tethered where required?',
    'Are extension cords and electrical tools free of damage (no exposed wires or splices), and are GFCIs in use where required?',
    'Are work area walkways maintained free of debris and tripping hazards?',
    'Are any pre-existing conditions observed that require documentation? (If yes, document and photograph.)',
    'Are any other trades or operations working near the work area?'
  ]},
  {key:'life', title:'Life Safety', sub:'', commentHeader:'Comments', questions:[
    'Is required safety equipment (inside and outside containment) readily available and functional?',
    'Are first aid kits, fire extinguishers, eye wash and emergency equipment present and readily accessible?',
    'Are all required project plans (e.g., safety/work plans, waste management, rescue plans) available on site and implemented?',
    'Are independent lifelines and rigging ropes in use, within rated capacity, and in good condition?',
    'Was a daily toolbox talk conducted with crew attendance? If yes Topic:',
    'Were any incidents or accidents reported on this date?',
    'Were any verbal safety warnings issued on this date?'
  ]},
  {key:'testing', title:'Testing', sub:'OSHA 1926.62/AMPP/SSPC QP Standards', commentHeader:'Comments', questions:[
    'Have all workers received medical clearance to wear a respirator and work with lead when applicable (including blood testing, respirator clearance and fit testing)?',
    'Have all workers received annual lead training?',
    'Was any monitoring performed today (e.g., air, wipe, water, soil, waste)? Chain of Custody (if applicable):'
  ]},
  {key:'containment', title:'Containment', sub:'OSHA 1926.57/AMPP/SSPC Guide 6 (Containment)', commentHeader:'Comments', questions:[
    'Is the containment system intact and functioning in accordance with approved plans (are joints sealed? openings closed? floor covering in place? make-up air inlets and airlock access points operational)?',
    'Were dust collectors and vacuum equipment operational throughout blasting activities?',
    'Was adequate airflow/ventilation maintained throughout blasting operations?',
    'Was negative pressure maintained within the containment? Visual/Magnehelic: Reading(if applicable):',
    'Were airflow checks performed as required? Method: Airflow Readings:',
    'Was a final cleanup inspection of the containment performed? Was the containment cleaned per spec?'
  ]}
];
function dsifChoice(name){return `<div class="choiceBtns dsifChoice"><label><input type="radio" name="${name}" value="Yes">Yes</label><label><input type="radio" name="${name}" value="No">No</label><label><input type="radio" name="${name}" value="N/A">N/A</label></div>`;}
function dsifForm(){
  app.innerHTML=`<div class="container printOnly dsifContainer"><h1>Daily Safety Inspection Form</h1>
    <div class="panel"><h2>Project / Report Information</h2><div class="grid three">${projectField('dsifProject','Project')} ${field('dsifReportDate','Report Date','date')} ${field('dsifDay','Day','text','readonly')} ${field('dsifWeather','Weather')} ${selectField('dsifAttachedPages','Attached Pages',['','Accident Report','Incident Report','Safety Violation','Accident Report + Incident Report','Accident Report + Safety Violation','Incident Report + Safety Violation'])}</div></div>
    ${DSIF_SECTIONS.map((sec,si)=>`<div class="panel dsifSection"><h2>${sec.title}</h2>${sec.sub?`<p class="tiny"><b>${sec.sub}</b></p>`:''}${sec.questions.map((q,qi)=>`<div class="checkrow"><div class="questionTitle">${q}</div>${dsifChoice('dsif_'+si+'_'+qi)}<label>Comments / Corrections</label><textarea id="dsifComment_${si}_${qi}" placeholder="Not applicable for today, notes, readings, etc."></textarea></div>`).join('')}</div>`).join('')}
    <div class="panel"><h2>Visible Emissions / Signature</h2><div class="grid four">${field('dsifVELocation','Visible Emissions Location')} ${field('dsifVETime','Time')} ${field('dsifVEObservation','Observation Period')} ${field('dsifVEEmission','Emission Time')}</div>${textarea('dsifCorrections','Comments / Corrections')}${field('dsifCompetentPerson','Competent Person (Print Name)')}${sigField('dsifSignature','Signature')}<div class="actions"><button class="btn" id="dsifPrintBtn" type="button">Save PDF / Print DSIF</button></div>${printPdfHelp('dsif')}<div id="dsifMsg"></div></div>
  </div>`;
  setupOtherProject('dsifProject');
  const dateEl=document.getElementById('dsifReportDate'); const dayEl=document.getElementById('dsifDay');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value='';return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}) + ' (Day)'; };
  dateEl.value=new Date().toISOString().slice(0,10); updateDay(); dateEl.addEventListener('change',updateDay);
  initSignatureButtons();
  document.getElementById('dsifPrintBtn').onclick=(e)=>{e.preventDefault(); try{const data=collectDsif(); document.title=formSaveTitle('dsif', data.reportDate, data.project); logGeneratedForm('dsif', data.project, data.reportDate, document.title); buildDsifPrint(data); openPrintNow('dsifMsg');}catch(err){document.getElementById('dsifMsg').innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function collectDsif(){
  return {project:projectValue('dsifProject'),reportDate:val('dsifReportDate'),day:val('dsifDay'),weather:val('dsifWeather'),attachedPages:val('dsifAttachedPages'),competentPerson:val('dsifCompetentPerson'),signature:val('dsifSignature'),signatureData:signatureStore.dsifSignature||'',visible:{location:val('dsifVELocation'),time:val('dsifVETime'),observation:val('dsifVEObservation'),emission:val('dsifVEEmission')},corrections:val('dsifCorrections'),sections:DSIF_SECTIONS.map((sec,si)=>({title:sec.title,sub:sec.sub,commentHeader:sec.commentHeader,questions:sec.questions.map((q,qi)=>({q,status:checked('dsif_'+si+'_'+qi),comment:val('dsifComment_'+si+'_'+qi)}))}))};
}
function markCell(status, want){return status===want ? 'X' : '';}
function dsifSectionPrint(sec){
  return `<table class="dsifTable"><tr><th class="dsifSec" colspan="1">${esc(sec.title)}${sec.sub?`<br><span>${esc(sec.sub)}</span>`:''}</th><th>Yes</th><th>No</th><th>${esc(sec.commentHeader||'Comments')}</th></tr>${sec.questions.map(item=>`<tr><td>${esc(item.q)}</td><td class="mark">${markCell(item.status,'Yes')}</td><td class="mark">${markCell(item.status,'No')}</td><td>${esc(item.comment)}</td></tr>`).join('')}</table>`;
}
function buildDsifPrint(data=collectDsif()){
  const dateSlash=dateToSlashYYYY(data.reportDate); const page1=data.sections.slice(0,4); const page2=data.sections.slice(4);
  const header=`<div class="dsifHeader"><div class="dsifTitle"><b>Daily Safety Inspection Form</b></div><div class="dsifLogo"><img src="${logo}"><span>Revision - 2</span></div><div><b>Project:</b> <span>${esc(data.project)}</span></div><div><b>Report Date:</b> <span>${esc(dateSlash)}</span></div><div><b>Day:</b> <span>${esc(data.day)}</span></div><div><b>Weather:</b> <span>${esc(data.weather)}</span></div><div><b>Attached Pages:</b> <span>${esc(data.attachedPages)}</span></div></div>`;
  const sheet1=`<div class="dsifSheet">${header}${page1.map(dsifSectionPrint).join('')}<div class="dsifFoot"><span>DSIF B/P</span><span>Revision - 0</span></div></div>`;
  const visible=`<table class="dsifVisible"><tr><th rowspan="3">Visible Emissions</th><th>Locations</th><th>Time</th><th>Observation<br>Period</th><th>Emission Time</th></tr><tr><td>${esc(data.visible.location||'Not applicable for today')}</td><td>${esc(data.visible.time)}</td><td>${esc(data.visible.observation)}</td><td>${esc(data.visible.emission)}</td></tr><tr><th colspan="4">Comments/Corrections</th></tr><tr><td colspan="5">${esc(data.corrections)}</td></tr></table>`;
  const sheet2=`<div class="dsifSheet">${page2.map(dsifSectionPrint).join('')}${visible}<div class="dsifSign"><div><b>Competent Person (Print Name)</b> ${esc(data.competentPerson)}</div><div><b>Signature:</b> ${sigPrint(data.signatureData,data.signature)}</div></div><div class="dsifFoot"><span>DSIF B/P</span><span>Revision - 2</span></div></div>`;
  setPrint(sheet1+sheet2); return sheet1+sheet2;
}


const WEEKLY_TOPICS = [
  '1. Safety culture: stop-work authority & reporting (OSHA: 29 CFR 1926.20, 1926.21)',
  '2. Pre-job safety meeting & job hazard analysis (OSHA: 29 CFR 1926.20, 1926.21)',
  '3. Daily/weekly inspections & documentation habits (OSHA: 29 CFR 1926.20(b), 1910.132(d))',
  '4. PPE fundamentals: selection, limitations, and training (OSHA: 29 CFR 1926 Subpart E, 1910.132)',
  '5. Head, eye, and face protection (OSHA: 29 CFR 1926.100, 1926.102; 1910.133)',
  '6. Hand protection & chemical glove selection (OSHA: 29 CFR 1910.138, 1926.95)',
  '7. Foot protection, work clothing, and skin exposure control (OSHA: 29 CFR 1926.96, 1926.28; 1910.132)',
  '8. Hearing conservation & noise control (OSHA: 29 CFR 1926.52, 1910.95)',
  '9. Respiratory protection overview & medical clearance (OSHA: 29 CFR 1910.134; 1926.103)',
  '10. Fit testing & facial hair/fit issues (OSHA: 29 CFR 1910.134(f), (g))',
  '11. User seal checks, cleaning, storage, and respirator inspections (OSHA: 29 CFR 1910.134 App B-1/B-2, (h))',
  '12. Hazard communication: labels, SDS, and chemical inventory (OSHA: 29 CFR 1910.1200; 1926.59)',
  '13. Chemical storage, mixing, and spill prevention (OSHA: 29 CFR 1910.1200, 1910.106; 1926.152)',
  '14. Flammable liquids & ignition control during painting operations (OSHA: 29 CFR 1910.106; 1926.152)',
  '15. Fire prevention, hot work, and extinguishers (PASS) (OSHA: 29 CFR 1926 Subpart F; 1910.157)',
  '16. Housekeeping & slip/trip/fall prevention (OSHA: 29 CFR 1926.25; 1910.22)',
  '17. Ladder safety: selection, inspection, and setup (OSHA: 29 CFR 1926 Subpart X; 1910.23)',
  '18. Scaffold safety: competent person, access, and daily inspections (OSHA: 29 CFR 1926 Subpart L)',
  '19. Scaffold platforms & falling-object protection (OSHA: 29 CFR 1926.451(g), (h))',
  '20. Fall protection fundamentals: 6-foot rule and beyond (OSHA: 29 CFR 1926 Subpart M)',
  '21. Harness use, inspection, and 100% tie-off practices (OSHA: 29 CFR 1926.502(d))',
  '22. Fall rescue planning & suspension trauma awareness (OSHA: 29 CFR 1926.502(d)(20))',
  '23. Aerial lifts: inspection, operation, and tie-off (OSHA: 29 CFR 1926.453; 1910.67)',
  '24. Electrical safety: GFCI, cords, lighting, and temporary power (OSHA: 29 CFR 1926 Subpart K)',
  '25. Lockout/Tagout & control of hazardous energy (OSHA: 29 CFR 1910.147; 1926.417)',
  '26. Hand & power tool safety (OSHA: 29 CFR 1926 Subpart I)',
  '27. High-pressure hoses, whip checks, and injection hazards (OSHA: 29 CFR 1926.302(b))',
  '28. Compressed air: safe blow-down and alternatives (OSHA: 29 CFR 1910.242(b))',
  '29. Abrasive blasting SOP & required PPE (OSHA: 29 CFR 1926.57; 1910.94(a))',
  '30. Blasting ventilation, airflow checks, and negative pressure (OSHA: 29 CFR 1926.57)',
  '31. Containment integrity, dust control, and HEPA housekeeping (OSHA: 29 CFR 1926.57; 1926.62)',
  '32. Regulated areas, signs, and access control (OSHA: 29 CFR 1926.62(e))',
  '33. Lead awareness: hazards, symptoms, and hygiene rules (OSHA: 29 CFR 1926.62)',
  '34. Lead controls: exposure assessment and medical surveillance (OSHA: 29 CFR 1926.62)',
  '35. Decontamination: change areas, showers, and cleaning logs (OSHA: 29 CFR 1926.62(j))',
  '36. Personal hygiene: handwashing, break areas, and prohibited items (OSHA: 29 CFR 1926.62(j))',
  '37. Confined space basics: identification and hazards (OSHA: 29 CFR 1910.146)',
  '38. Confined space permits & roles (OSHA: 29 CFR 1910.146)',
  '39. Atmospheric testing & ventilation for confined spaces (OSHA: 29 CFR 1910.146(d)(5))',
  '40. Confined space rescue & retrieval systems (OSHA: 29 CFR 1910.146(k))',
  '41. Ergonomics & material handling (OSH Act General Duty Clause; 29 CFR 1926.250)',
  '42. Rigging & hoisting basics (OSHA: 29 CFR 1926.251)',
  '43. Crane safety: signaling, swing radius, and power lines (OSHA: 29 CFR 1926 Subpart CC)',
  '44. Forklift safety & load handling (OSHA: 29 CFR 1910.178; 1926.602)',
  '45. Line-of-fire awareness & working around mobile equipment (OSHA: 29 CFR 1926.600, 1926.602; 1926.21)',
  '46. Temporary traffic control & flagging fundamentals (OSHA: 29 CFR 1926.200–1926.203)',
  '47. Railroad safety & working near tracks/third rail (OSH Act General Duty Clause; 29 CFR 1926.21)',
  '48. Environmental controls: hazardous waste, decon water, and site boundaries (OSHA: 29 CFR 1910.120; 1926.65; 1910.1200)',
  '49. Emergency action plan: communications and muster (OSHA: 29 CFR 1926.35; 1910.38)',
  '50. First aid, eyewash, and chemical exposure response (OSHA: 29 CFR 1926.50; 1910.151)',
  '51. Incident/near-miss reporting, investigation, and root cause (OSHA: 29 CFR 1904.39; 1926.20)'
];
let weeklyPollTimer = null;

function weeklySafetyTopicValue(){
  const topicEl = document.getElementById('weeklyTopic');
  if(!topicEl) return '';
  return topicEl.value === '__custom__' ? val('weeklyCustomTopic') : topicEl.value.trim();
}

function setupWeeklyCustomTopic(){
  const topicEl = document.getElementById('weeklyTopic');
  const customEl = document.getElementById('weeklyCustomTopic');
  if(!topicEl || !customEl) return;
  const sync = () => {
    const custom = topicEl.value === '__custom__';
    customEl.style.display = custom ? 'block' : 'none';
    if(custom) customEl.focus();
  };
  topicEl.addEventListener('change', sync);
  sync();
}

function weeklySafetyForm(){
  if(weeklyPollTimer) { clearInterval(weeklyPollTimer); weeklyPollTimer = null; }
  app.innerHTML = `<div class="container weeklyContainer"><h1>Weekly Safety Meeting</h1>
    <div class="panel"><h2>Start Meeting</h2><div class="grid two">${projectField('weeklyProject','Project')} ${field('weeklyDate','Meeting Date','date')} ${field('weeklyForeman','Foreman / Field Person')} <div><label for="weeklyTopic">Safety Topic (one per meeting)</label><select id="weeklyTopic"><option value=""></option><option value="__custom__">Custom Topic</option>${WEEKLY_TOPICS.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select><input id="weeklyCustomTopic" class="projectOther" type="text" placeholder="Type custom toolbox talk topic" style="display:none;margin-top:8px"></div></div>
    <div class="actions"><button class="btn light" id="weeklyRandomTopicBtn" type="button">Randomize Topic</button><button class="btn" id="weeklyStartBtn" type="button">Start Meeting</button></div><p class="tiny">Tap Randomize Topic to pick from the loaded safety topic list, or choose Custom Topic and type your own.</p><div id="weeklyMsg"></div></div>
    <div id="weeklyLive" class="panel weeklyLive" style="display:none"></div>
  </div>`;
  setupOtherProject('weeklyProject');
  setupWeeklyCustomTopic();
  document.getElementById('weeklyDate').value = new Date().toISOString().slice(0,10);
  const topicEl = document.getElementById('weeklyTopic');
  const customEl = document.getElementById('weeklyCustomTopic');
  const randomBtn = document.getElementById('weeklyRandomTopicBtn');
  randomBtn.onclick = () => {
    if(!WEEKLY_TOPICS.length) return;
    const current = weeklySafetyTopicValue();
    let picked = current;
    for(let i=0; i<8 && picked===current && WEEKLY_TOPICS.length>1; i++){
      picked = WEEKLY_TOPICS[Math.floor(Math.random()*WEEKLY_TOPICS.length)];
    }
    if(picked===current) picked = WEEKLY_TOPICS[Math.floor(Math.random()*WEEKLY_TOPICS.length)];
    topicEl.value = picked;
    if(customEl) customEl.value = '';
    setupWeeklyCustomTopic();
    randomBtn.textContent = 'Pick Another Topic';
    document.getElementById('weeklyMsg').innerHTML = '';
  };
  document.getElementById('weeklyStartBtn').onclick = startWeeklyMeeting;
}

async function startWeeklyMeeting(){
  const payload = { project: projectValue('weeklyProject'), date: val('weeklyDate'), foreman: val('weeklyForeman'), topic: weeklySafetyTopicValue() };
  if(!payload.project || !payload.date || !payload.topic){ document.getElementById('weeklyMsg').innerHTML='<div class="notice">Project, meeting date, and safety topic are required.</div>'; return; }
  const res = await fetch('/api/weekly-meetings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const json = await res.json();
  if(!res.ok){ document.getElementById('weeklyMsg').innerHTML=`<div class="notice">${esc(json.error||'Could not start meeting.')}</div>`; return; }
  renderWeeklyLive(json.meeting);
}

function weeklySignUrl(id){ return `${location.origin}/#/weekly-sign/${encodeURIComponent(id)}`; }
function weeklyQrUrl(id){ return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(weeklySignUrl(id))}`; }
function weeklyTitle(data){ const project=fileProjectName(data.project); const date=dateToDotMMDDYY(data.date)||'No.Date'; return project ? `Weekly_Safety_Meeting_${date}_${project}` : `Weekly_Safety_Meeting_${date}`; }

function renderWeeklyLive(meeting){
  const live=document.getElementById('weeklyLive');
  if(!live) return;
  const link=weeklySignUrl(meeting.id);
  live.style.display='block';
  live.innerHTML = `<h2>Live Sign-In</h2><div class="weeklyLiveGrid"><div><div class="qrCard"><img src="${weeklyQrUrl(meeting.id)}" alt="QR code for worker sign-in"><p class="tiny">Workers scan this QR code with their phones.</p></div><input class="copyLink" value="${esc(link)}" readonly><div class="actions"><button class="btn light" id="weeklyCopyBtn" type="button">Copy Sign-In Link</button><button class="btn" id="weeklyPrintBtn" type="button">Save PDF / Print Meeting</button></div></div><div><h3>Workers Signed In: <span id="weeklyCount">0</span></h3><div id="weeklyAttendees" class="attendeeList">Waiting for workers to sign in...</div></div></div>`;
  document.getElementById('weeklyCopyBtn').onclick=()=>navigator.clipboard?.writeText(link);
  document.getElementById('weeklyPrintBtn').onclick=async()=>{ const latest=await fetchWeeklyMeeting(meeting.id); document.title=weeklyTitle(latest); logGeneratedForm('weekly-safety', latest.project, latest.date, document.title); buildWeeklyPrint(latest); openPrintNow(); };
  pollWeekly(meeting.id);
  weeklyPollTimer = setInterval(()=>pollWeekly(meeting.id),3000);
}
async function fetchWeeklyMeeting(id){ const res=await fetch(`/api/weekly-meetings/${encodeURIComponent(id)}`); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Meeting not found'); return json.meeting; }
async function pollWeekly(id){
  try{ const meeting=await fetchWeeklyMeeting(id); const box=document.getElementById('weeklyAttendees'), count=document.getElementById('weeklyCount'); if(!box) return; const rows=meeting.attendees||[]; if(count) count.textContent=rows.length; box.innerHTML = rows.length ? rows.map((a,i)=>`<div class="attendeeRow"><b>${i+1}. ${esc(a.name)}</b>${a.company?`<span>${esc(a.company)}</span>`:''}${a.signatureData?`<span class="signedBadge">Signature captured</span>`:''}<small>${new Date(a.signedAt).toLocaleTimeString()}</small></div>`).join('') : 'Waiting for workers to sign in...'; }catch(e){ console.error(e); }
}

async function weeklySignForm(id){
  if(weeklyPollTimer) { clearInterval(weeklyPollTimer); weeklyPollTimer = null; }
  let meeting;
  try{ meeting=await fetchWeeklyMeeting(id); }catch(e){ app.innerHTML=`<div class="container"><div class="panel"><h1>Meeting Not Found</h1><p>${esc(e.message)}</p></div></div>`; return; }
  signatureStore.workerSignature = '';
  app.innerHTML=`<div class="container workerSign"><div class="panel"><img src="${logo}" class="smallLogo"><h1>Weekly Safety Meeting Sign-In</h1><p><b>Project:</b> ${esc(meeting.project)}</p><p><b>Date:</b> ${esc(dateToSlashYYYY(meeting.date))}</p><p><b>Topic:</b> ${esc(meeting.topic)}</p><div class="grid one">${field('workerName','Print Name')} ${field('workerCompany','Company','text','value="JAGD Construction"')}</div>${sigField('workerSignature','Signature')}<p class="tiny">Print your name, tap the signature box, sign with your finger, then press Sign In.</p><div class="actions"><button class="btn" id="workerSignBtn" type="button">Sign In</button></div><div id="workerSignMsg"></div></div></div>`;
  initSignatureButtons();
  document.getElementById('workerSignBtn').onclick=async()=>{
    const name=val('workerName'); const company=val('workerCompany'); const signatureData=signatureStore.workerSignature||'';
    if(!name){document.getElementById('workerSignMsg').innerHTML='<div class="notice">Print your name to sign in.</div>'; return;}
    if(!signatureData){document.getElementById('workerSignMsg').innerHTML='<div class="notice">Tap the signature box and sign with your finger.</div>'; return;}
    const res=await fetch(`/api/weekly-meetings/${encodeURIComponent(id)}/sign`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,company,signatureData})});
    const json=await res.json();
    if(!res.ok){document.getElementById('workerSignMsg').innerHTML=`<div class="notice">${esc(json.error||'Could not sign in.')}</div>`;return;}
    document.getElementById('workerSignMsg').innerHTML='<div class="notice success">You are signed in. You can close this page.</div>';
    document.getElementById('workerSignBtn').disabled=true;
  };
}

function buildWeeklyPrint(meeting){
  const rows=(meeting.attendees||[]).map((a,i)=>`<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${esc(a.company||'')}</td><td>${esc(new Date(a.signedAt).toLocaleString())}</td><td>${a.signatureData?`<img class="weeklySigPrint" src="${a.signatureData}">`:''}</td></tr>`).join('');
  const blanks=Array.from({length:Math.max(8,18-(meeting.attendees||[]).length)},(_,i)=>`<tr><td>${(meeting.attendees||[]).length+i+1}</td><td></td><td></td><td></td><td></td></tr>`).join('');
  const html=`<div class="weeklySheet"><div class="weeklyPrintHeader"><img src="${logo}"><div><h1>Weekly Safety Meeting</h1><p><b>Project:</b> ${esc(meeting.project)}</p><p><b>Meeting Date:</b> ${esc(dateToSlashYYYY(meeting.date))}</p><p><b>Foreman:</b> ${esc(meeting.foreman||'')}</p></div></div><div class="topicBox"><b>Safety Topic:</b><br>${esc(meeting.topic)}</div><table class="weeklyTable"><tr><th>#</th><th>Worker Name</th><th>Company</th><th>Signed In</th><th>Signature / Initials</th></tr>${rows}${blanks}</table><div class="weeklyFoot">Weekly Safety Meeting</div></div>`;
  setPrint(html); return html;
}


function normalizeWorkerNameKey(w){
  return String(workerDisplayName(w) || `${w.firstName||''} ${w.lastName||''}`.trim()).trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
}
function mergeWorkerSources(...sources){
  const map = new Map();
  sources.flat().filter(Boolean).forEach(w=>{
    const key = normalizeWorkerNameKey(w);
    if(!key) return;
    const existing = map.get(key) || {};
    map.set(key, {...existing, ...w, fullName: workerDisplayName({...existing, ...w})});
  });
  return Array.from(map.values()).sort((a,b)=>workerDisplayName(a).localeCompare(workerDisplayName(b)));
}
async function loadActiveWorkers(){
  if(activeWorkers.length) return activeWorkers;
  let apiRows = [];
  let staticRows = [];
  const embeddedRows = Array.isArray(EMBEDDED_ACTIVE_WORKERS) ? EMBEDDED_ACTIVE_WORKERS.slice() : [];
  try{
    const res = await fetch('/api/workers?v=20260618v150', {cache:'no-store', headers:{Accept:'application/json'}});
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if(res.ok && Array.isArray(json.rows)) apiRows = json.rows;
  }catch(e){ console.warn('Worker API unavailable or returned non-JSON, merging static worker file instead', e); }
  try{
    const res = await fetch('/data/active-workers.json?v=20260618v150', {cache:'no-store', headers:{Accept:'application/json'}});
    const text = await res.text();
    const json = text ? JSON.parse(text) : [];
    if(res.ok && Array.isArray(json)) staticRows = json;
  }catch(e){ console.warn('Static worker file unavailable, using embedded worker list fallback', e); }
  activeWorkers = mergeWorkerSources(apiRows, staticRows, embeddedRows).filter(isWorkerActive);
  return activeWorkers;
}


function isWorkerActive(w){
  if(!w) return false;
  if(w.disabled === true) return false;
  const status = String(w.status || w.employmentStatus || '').trim().toLowerCase();
  if(['inactive','disabled','terminated','removed'].includes(status)) return false;
  return true;
}

function cleanWorkerLocal(v){ return String(v||'').replace(/\.0$/,''); }
function workerDisplayName(w){ return String(w.fullName || `${w.firstName||''} ${w.lastName||''}`.trim()).trim(); }
function workerSearchText(w){ return `${workerDisplayName(w)} ${w.firstName||''} ${w.lastName||''} ${w.class||''} ${w.local||''}`.toLowerCase().replace(/[^a-z0-9 ]+/g,' '); }
function findWorkerByName(name){
  const n=String(name||'').trim().toLowerCase();
  if(!n) return null;
  return activeWorkers.find(w=>String(w.fullName||'').trim().toLowerCase()===n) || activeWorkers.find(w=>`${w.firstName||''} ${w.lastName||''}`.trim().toLowerCase()===n) || null;
}

function dwlDataList(id, options){
  return `<datalist id="${id}">${options.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist>`;
}
function normalizeDwlClass(c){
  const v=String(c||'').trim(); const l=v.toLowerCase();
  if(!v) return '';
  if(l==='jm' || l.includes('journey')) return 'JM';
  if(l==='fm' || l.includes('foreman')) return 'FM';
  if(l==='qc' || l.includes('quality')) return 'QC';
  if(l.includes('steward')) return 'Steward';
  if(l.includes('1')) return '1st';
  if(l.includes('2')) return '2nd';
  if(l.includes('3')) return '3rd';
  if(l.includes('4')) return '4th';
  return v;
}
function cleanDwlLocal(v){
  const s=cleanWorkerLocal(v);
  return s.replace(/\.0$/,'');
}

function dwlRow(i){
  return `<tr data-row="${i}"><td class="dwlNum">${i}</td><td class="dwlEmpCell"><input id="dwlEmp${i}" class="dwlEmpInput" autocomplete="off" autocapitalize="words" spellcheck="false"><div id="dwlSuggest${i}" class="dwlSuggest"></div></td><td><input id="dwlLoc${i}"></td><td><input id="dwlAct${i}" list="dwlActivityList" inputmode="numeric"></td><td><input id="dwlClass${i}" list="dwlClassList" autocapitalize="characters"></td><td><input id="dwlLocal${i}" list="dwlLocalList" inputmode="numeric"></td><td><input id="dwlStraight${i}" class="dwlStraightBox" inputmode="decimal" title="Tap to set 8 hours; edit if needed"></td><td><input id="dwlOver${i}" list="dwlOverList" inputmode="decimal"></td><td class="center"><input id="dwlNoLunch${i}" class="dwlNoLunchBox" readonly inputmode="decimal" title="Tap to toggle .5"></td><td><input id="dwlPT${i}" list="dwlSmallHourList" inputmode="decimal"></td><td><input id="dwlRT${i}" list="dwlSmallHourList" inputmode="decimal"></td></tr>`;
}
function applyWorkerToDwlRow(i,w){
  if(!w) return;
  const emp=document.getElementById('dwlEmp'+i);
  if(emp) emp.value = workerDisplayName(w);
  const cls=document.getElementById('dwlClass'+i); if(cls) cls.value = normalizeDwlClass(w.class || '');
  const loc=document.getElementById('dwlLocal'+i); if(loc) loc.value = cleanDwlLocal(w.local);
}
function getDwlSuggestBox(i){
  return document.getElementById('dwlSuggest'+i);
}
function hideDwlSuggestions(){
  document.querySelectorAll('.dwlSuggest').forEach(box=>{
    box.style.display='none';
    box.innerHTML='';
  });
}
function showDwlSuggestions(i){
  const emp=document.getElementById('dwlEmp'+i), box=getDwlSuggestBox(i);
  if(!emp || !box) return;
  const q=emp.value.toLowerCase().trim();
  if(q.length<1){ hideDwlSuggestions(); return; }
  const matches=dwlMatchesForQuery(q).slice(0,80);
  if(!matches.length){ hideDwlSuggestions(); return; }
  document.querySelectorAll('.dwlSuggest').forEach(other=>{
    if(other!==box){ other.style.display='none'; other.innerHTML=''; }
  });
  box.innerHTML=matches.map((w,idx)=>`<button type="button" data-idx="${idx}"><b>${esc(workerDisplayName(w))}</b>${(w.class||w.local)?`<span>${esc(w.class||'')}${w.local?` • Local ${esc(cleanWorkerLocal(w.local))}`:''}</span>`:''}</button>`).join('');
  box.style.display='block';
  box.querySelectorAll('button').forEach(btn=>{
    btn.onmousedown=(e)=>{
      e.preventDefault();
      const idx=Number(btn.dataset.idx);
      applyWorkerToDwlRow(i,matches[idx]);
      hideDwlSuggestions();
      const next=document.getElementById('dwlLoc'+i);
      if(next) next.focus();
    };
    btn.onclick=(e)=>{
      e.preventDefault();
      const idx=Number(btn.dataset.idx);
      applyWorkerToDwlRow(i,matches[idx]);
      hideDwlSuggestions();
    };
  });
}

function populateDwlWorkerDatalist(){
  const dl=document.getElementById('dwlWorkerList');
  if(!dl) return;
  dl.innerHTML = activeWorkers.map(w=>`<option value="${esc(workerDisplayName(w))}">${esc(w.class||'')}${w.local?` Local ${esc(cleanWorkerLocal(w.local))}`:''}</option>`).join('');
}
function dwlMatchesForQuery(q){
  const raw=String(q||'').trim().toLowerCase();
  const clean=raw.replace(/[^a-z0-9 ]+/g,' ');
  if(!clean) return [];
  const starts=[]; const contains=[];
  activeWorkers.forEach(w=>{
    const name=workerDisplayName(w).toLowerCase();
    const first=String(w.firstName||'').toLowerCase();
    const last=String(w.lastName||'').toLowerCase();
    const hay=workerSearchText(w);
    if(name.startsWith(raw) || first.startsWith(raw) || last.startsWith(raw)) starts.push(w);
    else if(hay.includes(clean)) contains.push(w);
  });
  return starts.concat(contains);
}

function setupDwlWorkerAutofill(){
  for(let i=1;i<=80;i++){
    const emp=document.getElementById('dwlEmp'+i);
    if(!emp || emp.dataset.ready==='1') continue;
    emp.dataset.ready='1';
    emp.addEventListener('input',()=>showDwlSuggestions(i));
    emp.addEventListener('keyup',()=>showDwlSuggestions(i));
    emp.addEventListener('focus',()=>showDwlSuggestions(i));
    emp.addEventListener('change',()=>{ const w=findWorkerByName(emp.value); if(w) applyWorkerToDwlRow(i,w); });
    emp.addEventListener('blur',()=>{ setTimeout(()=>hideDwlSuggestions(),220); setTimeout(()=>saveDwlLastCrewFromRows(),250); });
    const st=document.getElementById('dwlStraight'+i);
    if(st && st.dataset.ready!=='1'){
      st.dataset.ready='1';
      st.addEventListener('click',()=>{ if(!st.value.trim()){ st.value='8'; setTimeout(()=>{ try{ st.select(); }catch(e){} },0); } });
      st.addEventListener('input',()=>{ const n=parseFloat(st.value); if(!isNaN(n) && n>8) st.value='8'; });
    }
    const nl=document.getElementById('dwlNoLunch'+i);
    if(nl && nl.dataset.ready!=='1'){
      nl.dataset.ready='1';
      nl.addEventListener('click',()=>{ nl.value = nl.value.trim()==='.5' ? '' : '.5'; });
    }
  }
}
function setupDwlRows(){
  const tbody=document.getElementById('dwlRows');
  tbody.innerHTML = Array.from({length:20},(_,idx)=>dwlRow(idx+1)).join('');
  setupDwlWorkerAutofill();
}
function addDwlPageRows(){
  const tbody=document.getElementById('dwlRows');
  const current=tbody.querySelectorAll('tr').length;
  if(current>=40) return;
  tbody.insertAdjacentHTML('beforeend', Array.from({length:20},(_,idx)=>dwlRow(current+idx+1)).join(''));
  setupDwlWorkerAutofill();
}

function clearDwlWorkerRows(){
  for(let i=1;i<=80;i++){
    ['Emp','Loc','Act','Class','Local','Straight','Over','NoLunch','PT','RT'].forEach(k=>{
      const el=document.getElementById('dwl'+k+i);
      if(el) el.value='';
    });
  }
}
function normalizeCrewName(v){
  return String(v||'').trim().replace(/\s+/g,' ');
}
function findWorkerForCrewName(name){
  const raw=normalizeCrewName(name);
  if(!raw) return null;
  const exact=findWorkerByName(raw);
  if(exact) return exact;
  const lower=raw.toLowerCase();
  const flipped=lower.includes(',') ? lower.split(',').map(x=>x.trim()).reverse().join(' ') : '';
  const clean=lower.replace(/[^a-z0-9]+/g,' ').trim();
  const matches=activeWorkers.filter(w=>{
    const full=workerDisplayName(w).toLowerCase();
    const first=String(w.firstName||'').toLowerCase();
    const last=String(w.lastName||'').toLowerCase();
    const fullClean=full.replace(/[^a-z0-9]+/g,' ').trim();
    return full===lower || full===flipped || fullClean===clean || `${first} ${last}`.trim()===lower || `${last} ${first}`.trim()===lower;
  });
  if(matches.length===1) return matches[0];
  const starts=dwlMatchesForQuery(raw).filter(w=>workerDisplayName(w).toLowerCase().startsWith(lower));
  return starts.length===1 ? starts[0] : null;
}
function getDwlCrewNamesFromRows(){
  const names=[];
  for(let i=1;i<=80;i++){
    const emp=document.getElementById('dwlEmp'+i);
    if(emp && emp.value.trim()) names.push(emp.value.trim());
  }
  return names;
}
function saveDwlLastCrewFromRows(){
  try{
    const names=getDwlCrewNamesFromRows();
    if(names.length) localStorage.setItem('jagdDwlLastCrewNames', JSON.stringify(names));
  }catch(e){}
}
function ensureDwlRows(count){
  const tbody=document.getElementById('dwlRows');
  if(!tbody) return;
  while(tbody.querySelectorAll('tr').length<count && tbody.querySelectorAll('tr').length<40) addDwlPageRows();
}
function applyDwlCrewNames(names){
  const cleanNames=(names||[]).map(normalizeCrewName).filter(Boolean);
  if(!cleanNames.length){
    const msg=document.getElementById('dwlMsg');
    if(msg) msg.innerHTML='<div class="notice">Paste at least one employee name.</div>';
    return;
  }
  ensureDwlRows(cleanNames.length);
  clearDwlWorkerRows();
  cleanNames.slice(0,40).forEach((name,idx)=>{
    const row=idx+1;
    const worker=findWorkerForCrewName(name);
    if(worker) applyWorkerToDwlRow(row, worker);
    else {
      const emp=document.getElementById('dwlEmp'+row);
      if(emp) emp.value=name;
    }
  });
  try{ localStorage.setItem('jagdDwlLastCrewNames', JSON.stringify(cleanNames.slice(0,40))); }catch(e){}
  const msg=document.getElementById('dwlMsg');
  if(msg) msg.innerHTML=`<div class="notice success">Loaded ${Math.min(cleanNames.length,40)} crew member${cleanNames.length===1?'':'s'}.${cleanNames.length>40?' Only the first 40 fit right now.':''}</div>`;
}
function showDwlCrewUpload(){
  document.querySelectorAll('.modalOverlay').forEach(m=>m.remove());
  const modal=document.createElement('div');
  modal.className='modalOverlay no-print';
  modal.innerHTML=`<div class="modalBox crewUploadBox"><h2>Upload Crew</h2><p class="tiny">Paste one employee name per line. Matching workers will auto-fill Class and Local. Unknown names will still load as manual entries.</p><textarea id="dwlCrewPaste" placeholder="One name per line"></textarea><div class="actions right"><button class="btn light" type="button" id="dwlCrewCancel">Cancel</button><button class="btn" type="button" id="dwlCrewApply">Apply</button></div></div>`;
  document.body.appendChild(modal);
  const ta=document.getElementById('dwlCrewPaste');
  setTimeout(()=>ta&&ta.focus(),50);
  document.getElementById('dwlCrewCancel').onclick=()=>modal.remove();
  modal.addEventListener('click',e=>{ if(e.target===modal) modal.remove(); });
  document.getElementById('dwlCrewApply').onclick=()=>{
    const names=String(ta.value||'').split(/\r?\n/).map(normalizeCrewName).filter(Boolean);
    applyDwlCrewNames(names);
    modal.remove();
  };
}
function loadDwlLastCrew(){
  let names=[];
  try{ names=JSON.parse(localStorage.getItem('jagdDwlLastCrewNames')||'[]'); }catch(e){ names=[]; }
  if(!Array.isArray(names) || !names.length){
    const msg=document.getElementById('dwlMsg');
    if(msg) msg.innerHTML='<div class="notice">No last crew saved on this phone/browser yet. Use Upload Crew first.</div>';
    return;
  }
  applyDwlCrewNames(names);
}
function resetDwlForm(){
  if(!confirm('Reset this Daily Work Log? This clears the form on this screen.')) return;
  ['dwlProject','dwlProjectOther','dwlCrew','dwlCrewOther','dwlWeather','dwlForeman','dwlDescription','dwlNotes','dwlSafetyTopic','dwlPrintName'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  signatureStore.dwlSignature='';
  const sig=document.getElementById('dwlSignaturePreview'); if(sig) sig.innerHTML='Tap to sign';
  const dateEl=document.getElementById('dwlReportDate'), dayEl=document.getElementById('dwlDay');
  if(dateEl){ dateEl.value=new Date().toISOString().slice(0,10); const d=new Date(dateEl.value+'T00:00:00'); if(dayEl) dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); }
  clearDwlWorkerRows();
  const msg=document.getElementById('dwlMsg');
  if(msg) msg.innerHTML='<div class="notice success">DWL reset.</div>';
}
function activityCodesTable(){
  const rows=[]; for(let i=0;i<DWL_ACTIVITIES.length;i+=2){rows.push(`<tr><td>${esc(DWL_ACTIVITIES[i]||'')}</td><td>${esc(DWL_ACTIVITIES[i+1]||'')}</td></tr>`)}
  return rows.join('');
}
async function autoFillWeather(){
  const weatherEl=document.getElementById('dwlWeather');
  if(!weatherEl || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude, longitude}=pos.coords;
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
      const res=await fetch(url); const data=await res.json(); const c=data.current||{};
      const code=Number(c.weather_code); const desc = code===0?'Clear':([1,2,3].includes(code)?'Partly cloudy':([45,48].includes(code)?'Fog':([51,53,55,61,63,65,80,81,82].includes(code)?'Rain':([71,73,75,77,85,86].includes(code)?'Snow':([95,96,99].includes(code)?'Thunderstorm':'Cloudy')))));
      if(!weatherEl.value.trim()) weatherEl.value = `${desc}, ${Math.round(c.temperature_2m)}°F, Wind ${Math.round(c.wind_speed_10m||0)} mph`;
    }catch(e){ /* silent: field remains manually editable */ }
  }, ()=>{}, {enableHighAccuracy:false, timeout:8000, maximumAge:600000});
}

function dwlVisibleRows(data = {}) {
  return (Array.isArray(data.rows) ? data.rows : []).filter(r => r.employee || r.location || r.activity || r.class || r.local || r.straight || r.over || r.noLunch || r.pt || r.rt);
}
function appendDwlSyncMessage(html) {
  const msg = document.getElementById('dwlMsg');
  if (!msg) return;
  const div = document.createElement('div');
  div.innerHTML = html;
  msg.appendChild(div.firstElementChild || div);
}
function makeDwlSyncId(data, title){
  const parts=[data?.reportDate||'', data?.project||'', data?.crew||'', cleanDwlRevision(data?.revision||'0')||'0', title||'', Date.now(), Math.random().toString(36).slice(2,8)];
  return 'forms-dwl-' + parts.join('|').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
}
function dwlPortalPayload(data, title, syncId){
  const rows = dwlVisibleRows(data);
  const leanData = { ...data, rows, signatureData:'' };
  return { syncId, title, sourceFileName: title ? `${String(title).replace(/\.pdf$/i, '')}.pdf` : '', data: leanData };
}
async function syncDwlToPortal(data, title, options = {}) {
  const rows = dwlVisibleRows(data);
  if (!data || (!data.project && !data.reportDate && !rows.length)) return;
  const syncId = options.syncId || makeDwlSyncId(data, title);
  const payload = dwlPortalPayload(data, title, syncId);
  try {
    const body = JSON.stringify(payload);
    const res = await fetch('/api/dwl/portal-sync', { method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body, keepalive: !!options.keepalive });
    const json = await res.json().catch(()=>({}));
    if (res.ok && json.ok) {
      appendDwlSyncMessage('<div class="success">DWL sent to portal.</div>');
    } else {
      appendDwlSyncMessage(`<div class="notice">DWL PDF saved, but portal import needs attention. ${esc(json.message || json.error || 'Office may need manual upload.')}</div>`);
    }
  } catch (err) {
    try{
      if(navigator.sendBeacon){
        const ok = navigator.sendBeacon('/api/dwl/portal-sync', new Blob([JSON.stringify(payload)], {type:'application/json'}));
        if(ok){ appendDwlSyncMessage('<div class="notice">DWL portal send was queued in the background.</div>'); return; }
      }
    }catch(e){}
    appendDwlSyncMessage(`<div class="notice">DWL PDF saved, but portal import failed. Office may need manual upload. ${esc(err.message || '')}</div>`);
  }
}

async function dwlForm(){
  await loadActiveWorkers();
  app.innerHTML=`<div class="container printOnly dwlContainer"><h1>Daily Work Log</h1><datalist id="dwlWorkerList"></datalist>${dwlDataList('dwlClassList',DWL_CLASS_OPTIONS)}${dwlDataList('dwlLocalList',DWL_LOCAL_OPTIONS)}${dwlDataList('dwlActivityList',DWL_ACTIVITY_NUMBERS)}${dwlDataList('dwlOverList',DWL_OVER_OPTIONS)}${dwlDataList('dwlSmallHourList',DWL_SMALL_HOUR_OPTIONS)}
    <div class="panel dwlBossPanel"><h2>Project / Report Information</h2><div class="grid three dwlTopGrid">${projectField('dwlProject','Project')} ${field('dwlReportDate','Report Date','date')} ${field('dwlDay','Day','text','readonly')} ${crewField('dwlCrew','Crew')} ${field('dwlWeather','Weather')} ${field('dwlForeman','Foreman / Field Person')} ${field('dwlRevision','Revision','text','value="0" inputmode="numeric"')}</div><p class="tiny"><b>Revision:</b> Use 0 for the first DWL. If a saved DWL needs to be corrected/re-sent, use Revision 1, 2, etc.</p></div>
    <div class="panel dwlActivitiesPanel"><h2>Activities Performed</h2><table class="dwlActivityInfo"><tbody>${activityCodesTable()}</tbody></table></div>
    <div class="panel"><h2>Work Performed</h2>${textarea('dwlDescription','Location / Description of Work')}${textarea('dwlNotes','Additional Notes')}${textarea('dwlSafetyTopic','Safety Huddle Topic')}</div>
    <div class="panel dwlBossPanel"><h2>Crew / Employees</h2><div class="dwlCrewTools"><div><b>Crew Tools</b><span>Upload a pasted crew list or reload the last crew saved on this phone.</span></div><div class="actions"><button class="btn light" type="button" id="dwlUploadCrewBtn">Upload Crew</button><button class="btn light" type="button" id="dwlLoadLastCrewBtn">Load Last Crew</button><button class="btn danger" type="button" id="dwlResetBtn">Reset Form</button></div></div><div class="dwlTableWrap"><table class="dwlEntryTable"><thead><tr><th>#</th><th>Employee</th><th>Location</th><th>Activity</th><th>Class</th><th>Local</th><th>Straight</th><th>Over</th><th>No Lunch</th><th>P.T.</th><th>R.T.</th></tr></thead><tbody id="dwlRows"></tbody></table></div><div class="actions"><button class="btn light" type="button" id="dwlAddPageBtn">Add Additional Page / 20 More Rows</button></div></div>
    <div class="panel"><h2>Signature</h2>${field('dwlPrintName','Print Name')} ${sigField('dwlSignature','Signature')}<div class="actions"><button class="btn" id="dwlPrintBtn" type="button">Save PDF / Print DWL</button><button class="btn light" id="dwlPhonePdfBtn" type="button">Save/Text Phone View PDF</button></div><p class="tiny saveHelp"><b>Save / send:</b> This saves the official PDF and also sends the DWL to the office portal. On iPhone, use Share from the PDF screen to text it, email it, or save/send to Dropbox.</p><p class="tiny saveHelp"><b>Phone View PDF:</b> Optional bigger-text copy for texting to someone on a phone. It also sends the DWL to the portal, but the normal Save PDF / Print DWL is still the official office/Dropbox copy.</p><div id="dwlMsg"></div></div>
  </div>`;
  setupOtherProject('dwlProject'); setupOtherCrew('dwlCrew');
  const dateEl=document.getElementById('dwlReportDate'), dayEl=document.getElementById('dwlDay');
  const updateDay=()=>{ if(!dateEl.value){dayEl.value='';return;} const d=new Date(dateEl.value+'T00:00:00'); dayEl.value=d.toLocaleDateString(undefined,{weekday:'long'}); };
  dateEl.value=new Date().toISOString().slice(0,10); updateDay(); dateEl.addEventListener('change',updateDay);
  populateDwlWorkerDatalist(); setupDwlRows(); initSignatureButtons();
  document.getElementById('dwlAddPageBtn').onclick=addDwlPageRows;
  document.getElementById('dwlUploadCrewBtn').onclick=showDwlCrewUpload;
  document.getElementById('dwlLoadLastCrewBtn').onclick=loadDwlLastCrew;
  document.getElementById('dwlResetBtn').onclick=resetDwlForm;
  setTimeout(()=>autoFillWeather(),350);
  document.getElementById('dwlPrintBtn').onclick=async(e)=>{
    e.preventDefault();
    try{
      saveDwlLastCrewFromRows();
      const data=collectDwl();
      const baseTitle=formSaveTitle('dwl', data.reportDate, data.project, data.crew || crewValue('dwlCrew'));
      const dwlFileTitle=dwlFileTitleWithRevision(baseTitle, data.revision);
      if(!confirmDwlSaveAndSend(data,dwlFileTitle)) return;
      setNextPdfFileTitle(dwlFileTitle);
      markDwlSubmittedLocally(data,dwlFileTitle);
      logGeneratedForm('dwl', data.project, data.reportDate, dwlFileTitle);
      const syncId = makeDwlSyncId(data, dwlFileTitle);
      const portalSend = syncDwlToPortal(data, dwlFileTitle, { syncId, keepalive:true });
      const savedDirect = await saveDwlDirectPdf(data,'dwlMsg');
      if(!savedDirect){ buildDwlPrint(data); await openPrintNow('dwlMsg'); }
      portalSend.catch(()=>{});
    }catch(err){
      document.getElementById('dwlMsg').innerHTML=`<div class="notice">DWL print/save could not open: ${esc(err.message)}.</div>`;
      console.error(err);
    }
  };
  document.getElementById('dwlPhonePdfBtn').onclick=async(e)=>{
    e.preventDefault();
    try{
      saveDwlLastCrewFromRows();
      const data=collectDwl();
      const baseTitle=formSaveTitle('dwl', data.reportDate, data.project, data.crew || crewValue('dwlCrew'));
      const officialTitle=dwlFileTitleWithRevision(baseTitle, data.revision);
      const phoneTitle=String(officialTitle || 'DWL').replace(/\.pdf$/i,'') + ' Phone View';
      const ok=window.confirm(`Create a bigger-text phone view PDF for texting?

This also sends the DWL data to the office portal.

Use the normal Save PDF / Print DWL button for the official office/Dropbox PDF.`);
      if(!ok) return;
      setNextPdfFileTitle(phoneTitle);
      markDwlSubmittedLocally(data, officialTitle);
      logGeneratedForm('dwl', data.project, data.reportDate, phoneTitle);
      const syncId = makeDwlSyncId(data, officialTitle);
      const portalSend = syncDwlToPortal(data, officialTitle, { syncId, keepalive:true });
      await saveDwlPhoneViewPdf(data,'dwlMsg');
      portalSend.catch(()=>{});
    }catch(err){
      document.getElementById('dwlMsg').innerHTML=`<div class="notice">Phone View PDF could not open: ${esc(err.message)}.</div>`;
      console.error(err);
    }
  };
}

// v63: DWL direct PDF generator. This avoids iPhone/Safari print headers/footers (URL, date, Page 1 of 2)
// and keeps the DWL to a true one-page PDF unless the user added/filled more than 20 worker rows.
function dwlPdfText(doc, text, x, y, opts={}){
  const value = String(text || '');
  const maxWidth = opts.maxWidth || 9999;
  const size = opts.size || 8;
  const style = opts.style || 'normal';
  const align = opts.align || 'left';
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  let out = value;
  if (doc.getTextWidth(out) > maxWidth) {
    while(out.length > 3 && doc.getTextWidth(out + '…') > maxWidth) out = out.slice(0,-1);
    out = out.trim() + '…';
  }
  doc.text(out, x, y, {align});
}
function dwlPdfCell(doc, x, y, w, h, text, opts={}){
  if(opts.fill){ doc.setFillColor(opts.fill[0], opts.fill[1], opts.fill[2]); doc.rect(x,y,w,h,'F'); }
  doc.setDrawColor(0); doc.setLineWidth(opts.lineWidth || 0.7); doc.rect(x,y,w,h);
  const size=opts.size || 8;
  const style=opts.style || 'normal';
  const align=opts.align || 'left';
  const tx = align==='center' ? x+w/2 : align==='right' ? x+w-3 : x+3;
  const ty = y + h/2 + size*0.34;
  dwlPdfText(doc, text, tx, ty, {maxWidth:w-6, size, style, align});
}
function dwlPdfWrapText(doc, text, x, y, w, h, opts={}){
  const size=opts.size || 8;
  const style=opts.style || 'normal';
  doc.setFont('helvetica', style); doc.setFontSize(size);
  const lines=doc.splitTextToSize(String(text||''), w-8);
  const lineH=size*1.15;
  let cy=y+size+3;
  for(const line of lines){ if(cy > y+h-3) break; doc.text(line, x+4, cy); cy += lineH; }
}
function dwlPdfBox(doc, x, y, w, h, label, value, bodySize=9){
  doc.setLineWidth(0.8); doc.rect(x,y,w,h);
  doc.setFillColor(217,217,217); doc.rect(x,y,w,13,'F'); doc.rect(x,y,w,13);
  dwlPdfText(doc, label, x+3, y+9.5, {size:8, style:'bold', maxWidth:w-6});
  dwlPdfWrapText(doc, value, x, y+13, w, h-13, {size:bodySize, style:'normal'});
}

function dwlPhoneRow(doc, y, row, rowNum, m, w){
  const h=38;
  doc.setDrawColor(0); doc.setLineWidth(1);
  doc.rect(m,y,w,h);
  doc.setFillColor(217,217,217); doc.rect(m,y,28,h,'F'); doc.rect(m,y,28,h);
  dwlPdfText(doc,String(rowNum),m+14,y+23,{size:11,style:'bold',align:'center',maxWidth:24});
  dwlPdfText(doc,row.employee||'',m+34,y+16,{size:15,style:'bold',maxWidth:270});
  const line2=[];
  if(row.class) line2.push('Class: '+row.class);
  if(row.local) line2.push('Local: '+row.local);
  if(row.location) line2.push('Loc: '+row.location);
  if(row.activity) line2.push('Act: '+row.activity);
  dwlPdfText(doc,line2.join('   '),m+34,y+32,{size:9.5,style:'bold',maxWidth:340});
  const x=m+w-190;
  dwlPdfText(doc,'ST',x,y+12,{size:8,style:'bold',align:'center',maxWidth:25});
  dwlPdfText(doc,'OT',x+38,y+12,{size:8,style:'bold',align:'center',maxWidth:25});
  dwlPdfText(doc,'NL',x+76,y+12,{size:8,style:'bold',align:'center',maxWidth:25});
  dwlPdfText(doc,'PT',x+114,y+12,{size:8,style:'bold',align:'center',maxWidth:25});
  dwlPdfText(doc,'RT',x+152,y+12,{size:8,style:'bold',align:'center',maxWidth:25});
  dwlPdfText(doc,row.straight||'',x,y+31,{size:15,style:'bold',align:'center',maxWidth:35});
  dwlPdfText(doc,row.over||'',x+38,y+31,{size:15,style:'bold',align:'center',maxWidth:35});
  dwlPdfText(doc,row.noLunch||'',x+76,y+31,{size:15,style:'bold',align:'center',maxWidth:35});
  dwlPdfText(doc,row.pt||'',x+114,y+31,{size:15,style:'bold',align:'center',maxWidth:35});
  dwlPdfText(doc,row.rt||'',x+152,y+31,{size:15,style:'bold',align:'center',maxWidth:35});
}
async function saveDwlPhoneViewPdf(data, msgId){
  if(!window.jspdf || !window.jspdf.jsPDF) return false;
  const msg=document.getElementById(msgId);
  if(msg) msg.innerHTML='<div class="notice">Building bigger phone-view DWL PDF...</div>';
  const { jsPDF } = window.jspdf;
  const filledRows=(data.rows||[]).filter(r=>r.employee||r.location||r.activity||r.class||r.local||r.straight||r.over||r.noLunch||r.pt||r.rt);
  const rows = filledRows.length ? filledRows : (data.rows||[]).slice(0,20);
  const rowsPerPage=10;
  const pages=Math.max(1, Math.ceil(Math.max(rows.length,1)/rowsPerPage));
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
  const pageW=612, pageH=792, m=22, w=pageW-m*2;
  const dateSlash=dateToSlashYYYY(data.reportDate);
  for(let p=0;p<pages;p++){
    if(p>0) doc.addPage('letter','portrait');
    let y=18;
    try{ doc.addImage('/assets/jagd-logo.png','PNG',m,y,22,16); }catch(e){}
    dwlPdfText(doc,'JAGD Daily Work Log - Phone View',m+30,y+13,{size:13,style:'bold',maxWidth:310});
    dwlPdfText(doc,'DWL 4.0',pageW-m,y+13,{size:12,style:'bold',align:'right',maxWidth:90});
    y += 28;
    doc.setLineWidth(1.4); doc.line(m,y,pageW-m,y); y += 6;
    dwlPdfText(doc,'Project:',m,y+16,{size:10,style:'bold'});
    dwlPdfText(doc,data.project,m+48,y+17,{size:14,style:'bold',maxWidth:330});
    dwlPdfText(doc,'Date:',pageW-m-150,y+10,{size:9,style:'bold'});
    dwlPdfText(doc,dateSlash,pageW-m,y+24,{size:22,style:'bold',align:'right',maxWidth:135});
    y += 34;
    dwlPdfText(doc,'Weather:',m,y+13,{size:10,style:'bold'});
    dwlPdfText(doc,data.weather,m+55,y+13,{size:12,style:'bold',maxWidth:245});
    dwlPdfText(doc,'Day:',m+330,y+13,{size:10,style:'bold'});
    dwlPdfText(doc,data.day,m+360,y+13,{size:12,style:'bold',maxWidth:80});
    dwlPdfText(doc,'Crew:',m+455,y+13,{size:10,style:'bold'});
    dwlPdfText(doc,data.crew,m+492,y+13,{size:12,style:'bold',maxWidth:70});
    y += 22;
    if(p===0){
      dwlPdfBox(doc,m,y,w,86,'Location/Description of work',data.description,13); y += 86;
      dwlPdfBox(doc,m,y,w,34,'Additional Notes',data.notes,11); y += 34;
      dwlPdfBox(doc,m,y,w,34,'Safety Huddle Topic',data.safetyTopic,11); y += 42;
    } else {
      dwlPdfText(doc,`Employee continuation - page ${p+1}`,m,y+14,{size:13,style:'bold',maxWidth:300}); y += 28;
    }
    doc.setFillColor(217,217,217); doc.rect(m,y,w,20,'F'); doc.rect(m,y,w,20);
    dwlPdfText(doc,'Employees / Hours',m+6,y+14,{size:12,style:'bold',maxWidth:220});
    dwlPdfText(doc,'ST  OT  NL  PT  RT',pageW-m-10,y+14,{size:10,style:'bold',align:'right',maxWidth:140});
    y += 20;
    for(let i=0;i<rowsPerPage;i++){
      const idx=p*rowsPerPage+i;
      const row=rows[idx] || {};
      dwlPhoneRow(doc,y,row,idx+1,m,w);
      y += 38;
    }
    y += 12;
    if(p===pages-1){
      dwlPdfText(doc,'Print Name:',m,y+12,{size:9,style:'bold'});
      dwlPdfText(doc,data.printName||data.foreman||'',m+66,y+13,{size:11,style:'bold',maxWidth:190});
      dwlPdfText(doc,'Sign:',m+285,y+12,{size:9,style:'bold'});
      if(data.signatureData){ try{ doc.addImage(data.signatureData,'PNG',m+320,y-7,130,30); }catch(e){} }
      dwlPdfText(doc,'Date:',pageW-m-85,y+12,{size:9,style:'bold'});
      dwlPdfText(doc,dateSlash,pageW-m,y+12,{size:11,style:'bold',align:'right',maxWidth:85});
    }
    dwlPdfText(doc,`Phone View PDF - Page ${p+1} of ${pages}`,pageW/2,pageH-14,{size:8,style:'bold',align:'center',maxWidth:180});
  }
  const filename = safePdfFileName();
  await downloadPdfDocThroughServer(doc, filename, msgId);
  return true;
}

async function saveDwlDirectPdf(data, msgId){
  if(!window.jspdf || !window.jspdf.jsPDF) return false;
  const msg=document.getElementById(msgId);
  if(msg) msg.innerHTML='<div class="notice">Building clean DWL PDF...</div>';
  const { jsPDF } = window.jspdf;
  const filledRows=(data.rows||[]).filter(r=>r.employee||r.location||r.activity||r.class||r.local||r.straight||r.over||r.noLunch||r.pt||r.rt);
  const needed=Math.max(1, Math.ceil(Math.max(filledRows.length,20)/20));
  const rowsForPrint=(data.rows||[]).slice(0, needed*20);
  while(rowsForPrint.length < needed*20) rowsForPrint.push({num:rowsForPrint.length+1});
  const doc=new jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
  const pageW=612, pageH=792;
  const dateSlash=dateToSlashYYYY(data.reportDate);
  const m=14, w=pageW-m*2;
  const cols=[18,176,45,42,42,42,44,42,52,40,40];
  const headers=['#','Employee','Location','Activity','Class','Local','Straight','Over','No Lunch','P.T.','R.T.'];
  for(let p=0;p<needed;p++){
    if(p>0) doc.addPage('letter','portrait');
    let y=14;
    // Header
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    try{ doc.addImage('/assets/jagd-logo.png','PNG',m,y,18,13); }catch(e){}
    dwlPdfText(doc,'JAGD Daily Work Log',m+24,y+10,{size:9,style:'bold',maxWidth:180});
    dwlPdfText(doc,'DWL 4.0',pageW-m,y+10,{size:9,style:'bold',align:'right',maxWidth:70});
    y += 26;
    doc.setLineWidth(1.2); doc.line(m,y+w*0,w+m,y+w*0); // harmless reset line?
    // Project / date line
    dwlPdfText(doc,'Project:',m,y+14,{size:8,style:'bold'});
    dwlPdfText(doc,data.project,m+36,y+15,{size:10,style:'bold',maxWidth:340});
    dwlPdfText(doc,'Report Date:',pageW-m-120,y+8,{size:7,style:'bold',align:'left'});
    dwlPdfText(doc,dateSlash,pageW-m,y+23,{size:18,style:'bold',align:'right',maxWidth:120});
    dwlPdfText(doc,'Revision:',pageW-m-120,y+28,{size:7,style:'bold',align:'left'});
    dwlPdfText(doc,cleanDwlRevision(data.revision || '0') || '0',pageW-m,y+28,{size:9,style:'bold',align:'right',maxWidth:120});
    doc.setLineWidth(1.1); doc.line(m,y+31,pageW-m,y+31);
    y += 33;
    // Weather line
    dwlPdfText(doc,'Weather:',m,y+12,{size:8,style:'bold'});
    dwlPdfText(doc,data.weather,m+42,y+12,{size:9,style:'bold',maxWidth:230});
    dwlPdfText(doc,'Day:',m+365,y+12,{size:8,style:'bold'});
    dwlPdfText(doc,data.day,m+390,y+12,{size:9,style:'bold',maxWidth:85});
    dwlPdfText(doc,'Crew:',m+485,y+12,{size:8,style:'bold'});
    dwlPdfText(doc,data.crew,m+515,y+12,{size:9,style:'bold',maxWidth:70});
    doc.line(m,y+17,pageW-m,y+17); y += 18;
    // Activities table
    dwlPdfCell(doc,m,y,w,12,'Activities Performed',{fill:[217,217,217],size:7.5,style:'bold',align:'center'}); y += 12;
    for(let i=0;i<DWL_ACTIVITIES.length;i+=2){
      dwlPdfCell(doc,m,y,w/2,12,DWL_ACTIVITIES[i]||'',{size:7.3,style:'bold'});
      dwlPdfCell(doc,m+w/2,y,w/2,12,DWL_ACTIVITIES[i+1]||'',{size:7.3,style:'bold'});
      y += 12;
    }
    // Description / notes
    dwlPdfBox(doc,m,y,w,74,'Location/Description of work',data.description,10); y += 74;
    dwlPdfBox(doc,m,y,w,26,'Additional Notes',data.notes,9); y += 26;
    dwlPdfBox(doc,m,y,w,26,'Safety Huddle Topic',data.safetyTopic,9); y += 26;
    // Worker table
    let x=m; const headerH=14;
    for(let c=0;c<headers.length;c++){dwlPdfCell(doc,x,y,cols[c],headerH,headers[c],{fill:[217,217,217],size:6.8,style:'bold',align:'center'}); x+=cols[c];}
    y += headerH;
    const rowH=20;
    for(let r=0;r<20;r++){
      const row=rowsForPrint[p*20+r]||{num:p*20+r+1};
      const vals=[p*20+r+1,row.employee,row.location,row.activity,row.class,row.local,row.straight,row.over,row.noLunch,row.pt,row.rt];
      x=m;
      for(let c=0;c<vals.length;c++){
        const isName=c===1; const isNum=c!==0 && c!==2;
        dwlPdfCell(doc,x,y,cols[c],rowH,vals[c]||'',{size:isName?13.7:(isNum?11.5:7.5),style:(isName||isNum)?'bold':'normal',align:c===1?'left':'center',lineWidth:0.75});
        x += cols[c];
      }
      y += rowH;
    }
    y += 12;
    dwlPdfText(doc,'Print Name:',m,y+10,{size:7,style:'bold'});
    dwlPdfText(doc,data.printName||data.foreman||'',m+50,y+10,{size:8.5,style:'bold',maxWidth:160});
    dwlPdfText(doc,'Sign:',m+230,y+10,{size:7,style:'bold'});
    if(data.signatureData){ try{ doc.addImage(data.signatureData,'PNG',m+260,y-6,120,26); }catch(e){} }
    dwlPdfText(doc,'Date:',pageW-m-70,y+10,{size:7,style:'bold'});
    dwlPdfText(doc,dateSlash,pageW-m,y+10,{size:8.5,style:'bold',align:'right',maxWidth:70});
    if(needed>1) dwlPdfText(doc,`Page ${p+1} of ${needed}`,pageW/2,pageH-12,{size:7,align:'center',maxWidth:100});
  }
  // Match the original boss DWL behavior: let jsPDF save/download the generated PDF directly.
  // This avoids iPhone/Safari browser print headers/footers and avoids the blank second page
  // caused by opening the form through the native print preview.
  const filename = safePdfFileName();
  await downloadPdfDocThroughServer(doc, filename, msgId);
  return true;
}

function collectDwl(){
  const rows=[]; for(let i=1;i<=40;i++){
    const emp=document.getElementById('dwlEmp'+i); if(!emp) continue;
    const row={num:i, employee:val('dwlEmp'+i), location:val('dwlLoc'+i), activity:val('dwlAct'+i), class:val('dwlClass'+i), local:val('dwlLocal'+i), straight:val('dwlStraight'+i), over:val('dwlOver'+i), noLunch:val('dwlNoLunch'+i), pt:val('dwlPT'+i), rt:val('dwlRT'+i)};
    rows.push(row);
  }
  return {project:projectValue('dwlProject'),reportDate:val('dwlReportDate'),day:val('dwlDay'),crew:crewValue('dwlCrew'),revision:cleanDwlRevision(val('dwlRevision')||'0')||'0',weather:val('dwlWeather'),foreman:val('dwlForeman'),activities:[],description:val('dwlDescription'),notes:val('dwlNotes'),safetyTopic:val('dwlSafetyTopic'),printName:val('dwlPrintName'),signatureData:signatureStore.dwlSignature||'',rows};
}
function dwlWorkerRowsPrint(rows, start, count){
  const slice=rows.slice(start,start+count);
  while(slice.length<count) slice.push({num:start+slice.length+1});
  return slice.map(r=>`<tr><td>${esc(r.num||'')}</td><td>${esc(r.employee||'')}</td><td>${esc(r.location||'')}</td><td>${esc(r.activity||'')}</td><td>${esc(r.class||'')}</td><td>${esc(r.local||'')}</td><td>${esc(r.straight||'')}</td><td>${esc(r.over||'')}</td><td class="dwlNoLunchPrint">${esc(r.noLunch||'')}</td><td>${esc(r.pt||'')}</td><td>${esc(r.rt||'')}</td></tr>`).join('');
}
function buildDwlSheet(data, pageIndex, totalPages){
  const dateSlash=dateToSlashYYYY(data.reportDate); const dateDot=dateToDotMMDDYY(data.reportDate);
  const rowsPerPage=20; const start=(pageIndex-1)*rowsPerPage;
  return `<div class="dwlPrintSheet ${totalPages===1?'dwlSinglePage':''}"><div class="dwlPrintTop"><div class="dwlBrand"><img src="${logo}"><b>JAGD Daily Work Log</b></div><b>DWL 4.0</b></div><div class="dwlHeadLine"><div><b>Project:</b> ${esc(data.project)}</div><div><b>Report Date:</b> <span class="bigDate">${esc(dateSlash)}</span></div></div><div class="dwlWeatherLine"><div><b>Weather:</b> ${esc(data.weather)}</div><div><b>Day:</b> ${esc(data.day)}</div><div><b>Crew:</b> ${esc(data.crew)}</div><div><b>Revision:</b> ${esc(cleanDwlRevision(data.revision||'0')||'0')}</div></div><table class="dwlActivitiesPrint"><tr><th colspan="2">Activities Performed</th></tr>${activityCodesTable()}</table><div class="dwlBox"><b>Location/Description of work</b><div>${esc(data.description)}</div></div><div class="dwlBox small"><b>Additional Notes</b><div>${esc(data.notes)}</div></div><div class="dwlBox small"><b>Safety Huddle Topic</b><div>${esc(data.safetyTopic)}</div></div><table class="dwlPrintTable"><tr><th>#</th><th>Employee</th><th>Location</th><th>Activity</th><th>Class</th><th>Local</th><th>Straight</th><th>Over</th><th>No Lunch</th><th>P.T.</th><th>R.T.</th></tr>${dwlWorkerRowsPrint(data.rows,start,rowsPerPage)}</table><div class="dwlPrintFoot"><div><b>Print Name:</b> ${esc(data.printName||data.foreman||'')}</div><div><b>Sign:</b> ${sigPrint(data.signatureData,'')}</div><div><b>Date:</b> <span class="bigDate2">${esc(dateSlash)}</span></div></div><div class="dwlPageNum">${pageIndex}${totalPages>1?` of ${totalPages}`:''}</div></div>`;
}
function buildDwlPrint(data){
  const filledRows=data.rows.filter(r=>r.employee || r.location || r.activity || r.class || r.local || r.straight || r.over || r.noLunch || r.pt || r.rt);
  const needed=Math.max(1, Math.ceil(Math.max(filledRows.length,20)/20));
  const rowsForPrint = data.rows.slice(0, needed*20);
  const d={...data, rows:rowsForPrint};
  const html=Array.from({length:needed},(_,i)=>buildDwlSheet(d,i+1,needed)).join('');
  setPrint(html); return html;
}


// v48: Extra JAGD forms converted from PDF links into phone-friendly web forms.
const EXTRA_FORM_ROWS = 14;
function extraFormIntro(title, subtitle=''){
  return `<div class="container extraFormContainer"><div class="panel extraFormHero"><div class="extraFormTitle"><img src="${logo}" alt="JAGD"><div><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div></div><div class="actions"><a class="btn light" href="#/">Back to Forms</a></div></div>`;
}
function setupToday(id){const el=document.getElementById(id); if(el && !el.value) el.value=new Date().toISOString().slice(0,10);}
function collectExtraRows(prefix, count=EXTRA_FORM_ROWS){
  const rows=[]; for(let i=1;i<=count;i++){rows.push({a:val(prefix+'A'+i), b:val(prefix+'B'+i), c:val(prefix+'C'+i)});} return rows;
}
function extraPrintButton(id, buildFn, msgId, logFn=null){
  const btn=document.getElementById(id); if(!btn) return;
  btn.onclick=e=>{e.preventDefault(); try{if(logFn) logFn(); buildFn(); openPrintNow(msgId);}catch(err){const m=document.getElementById(msgId); if(m) m.innerHTML=`<div class="notice">Print preview could not open: ${esc(err.message)}.</div>`; console.error(err);}};
}
function extraRadio(name, opts=['Yes','No']){return `<div class="choiceBtns extraChoice">${opts.map(o=>`<label><input type="radio" name="${name}" value="${esc(o)}">${esc(o)}</label>`).join('')}</div>`;}
function radioVal(name){const el=document.querySelector(`[name="${name}"]:checked`); return el?el.value:'';}
function bolForm(){
  app.innerHTML=extraFormIntro('JAGD - Bill of Lading','Material delivery / shipping paperwork. Date and project use the same field tools as the rest of the app.')+`<div class="panel"><h2>Delivery Info</h2><div class="grid three">${projectField('bolProject','Job / Project')} ${field('bolDate','Date','date')} ${field('bolBL','BL #')} ${field('bolTo','To')} ${field('bolFrom','From')} ${field('bolPO','PO #')}</div></div><div class="panel"><h2>Products</h2><div class="extraTableWrap"><table class="table extraEntryTable"><thead><tr><th>Quote #</th><th>Quantity</th><th>Product</th></tr></thead><tbody>${Array.from({length:EXTRA_FORM_ROWS},(_,idx)=>{const i=idx+1;return `<tr><td><input id="bolA${i}"></td><td><input id="bolB${i}"></td><td><input id="bolC${i}"></td></tr>`}).join('')}</tbody></table></div>${textarea('bolNotes','Additional Notes')}</div><div class="panel"><h2>Signatures</h2><div class="grid three">${field('bolName','Name (Print)')} ${sigField('bolSignature','Signature')} ${field('bolShipper','Shipper / Loader')} ${sigField('bolShipperSig','Shipper / Loader Signature')} ${field('bolReceiver','Receiver')} ${sigField('bolReceiverSig','Receiver Signature')}</div><div class="actions"><button class="btn" id="bolPrintBtn">Save PDF / Print Bill of Lading</button></div>${printPdfHelp('bol')}<div id="bolMsg"></div></div></div>`;
  setupOtherProject('bolProject'); setupToday('bolDate'); initSignatureButtons(); extraPrintButton('bolPrintBtn', buildBolPrint, 'bolMsg', ()=>logGeneratedForm('bol', projectValue('bolProject'), val('bolDate'), `Bill of Lading - ${dateToDisplay(val('bolDate'))} - ${cleanFilePart(projectValue('bolProject'))}`));
}
function buildBolPrint(){
  const rows=collectExtraRows('bol').map(r=>`<tr><td>${esc(r.a)}</td><td>${esc(r.b)}</td><td>${esc(r.c)}</td></tr>`).join('');
  const html=`<div class="extraPrintSheet bolPrintSheet"><div class="extraPrintHeader"><img src="${logo}"><h1>JAGD - BILL OF LADING</h1></div><table class="extraPrintTable bolTop"><tr><th>Job # / Project</th><td>${esc(projectValue('bolProject'))}</td><th>Date</th><td>${esc(dateToSlashYYYY(val('bolDate')))}</td></tr><tr><th>To</th><td>${esc(val('bolTo'))}</td><th>From</th><td>${esc(val('bolFrom'))}</td></tr><tr><th>BL #</th><td>${esc(val('bolBL'))}</td><th>PO #</th><td>${esc(val('bolPO'))}</td></tr></table><table class="extraPrintTable bolItems"><tr><th>Quote #</th><th>Quantity</th><th>Product</th></tr>${rows}</table><div class="extraNotes"><b>Additional Notes:</b><br>${esc(val('bolNotes'))}</div><div class="extraSigGrid"><div><b>Name (Print):</b> ${esc(val('bolName'))}</div><div><b>Signature:</b> ${sigPrint(signatureStore.bolSignature,'')}</div><div><b>Shipper / Loader:</b> ${esc(val('bolShipper'))}</div><div><b>Signature:</b> ${sigPrint(signatureStore.bolShipperSig,'')}</div><div><b>Receiver:</b> ${esc(val('bolReceiver'))}</div><div><b>Signature:</b> ${sigPrint(signatureStore.bolReceiverSig,'')}</div></div></div>`;
  document.title=`Bill of Lading - ${dateToDisplay(val('bolDate'))} - ${cleanFilePart(projectValue('bolProject'))}`; setPrint(html);
}
function incidentReportForm(){
  app.innerHTML=extraFormIntro('Incident Report','Short non-truck incident report. Use this when the full accident packet is not needed.')+`<div class="panel"><h2>Basic Info</h2><div class="grid three">${field('irReportDate','Report Date','date')} ${projectField('irProject','Project')} ${field('irProjectLocation','Project Location')} ${field('irIncidentDate','Incident Date','date')} ${field('irIncidentTime','Time of Incident','time')} ${field('irEmployee','Employee')} ${selectField('irAdditionalSheets','Additional Sheets Attached',['','Yes','No'])}</div></div><div class="panel"><h2>Incident Details</h2>${textarea('irDescription','Description of Incident')}${textarea('irInjuries','Injuries Sustained')}${textarea('irTreatment','Medical Review & Treatment')}${textarea('irCause','Cause of Incident')}${textarea('irCorrective','Corrective Action Taken to Prevent Recurrences')}${textarea('irComments','Supplemental Review / Comments')}<div class="grid two"><div><label>Post to OSHA 300 Log</label>${extraRadio('irOsha300')}</div><div><label>Police Report</label>${extraRadio('irPolice')}</div>${field('irAgency','Police Agency')} ${field('irReportNo','Report No.')}<div><label>Reported to OSHA</label>${extraRadio('irReportedOsha')}</div>${field('irToWhom','To Whom')} ${field('irOshaDate','OSHA Report Date','date')} ${field('irOshaTime','OSHA Report Time','time')} ${field('irByWhom','By Whom')}</div></div><div class="panel"><h2>Witness Statement</h2><p class="tiny">Optional. Use when a witness needs to explain what happened in their own words.</p><div class="grid three">${field('irWitnessName','Witness Print Name')} ${field('irWitnessCompany','Company / Trade')} ${field('irWitnessPhone','Phone')} ${field('irWitnessDate','Witness Date','date')} ${field('irWitnessTime','Witness Time','time')} ${field('irWitnessSupervisor','Supervisor Notified')}</div>${textarea('irWitnessStatement','This is what happened, in the witness’s own words')}${textarea('irWitnessPrevent','How could this be prevented in the future?')}<div class="grid two">${field('irWitnessPrint','Witness Print Name')} ${sigField('irWitnessSignature','Witness Signature')}</div></div><div class="panel"><h2>Completed By</h2><div class="grid two">${field('irCompletedBy','Print Name')} ${sigField('irSignature','Signature')}</div><div class="actions"><button class="btn" id="irPrintBtn">Save PDF / Print Incident Report</button></div>${printPdfHelp('ir')}<div id="irMsg"></div></div></div>`;
  setupOtherProject('irProject'); setupToday('irReportDate'); setupToday('irIncidentDate'); setupToday('irWitnessDate'); initSignatureButtons(); extraPrintButton('irPrintBtn', buildIncidentPrint, 'irMsg', ()=>logGeneratedForm('ir', projectValue('irProject'), val('irReportDate'), `Incident Report - ${dateToDisplay(val('irReportDate'))} - ${cleanFilePart(projectValue('irProject'))}`));
}
function buildIncidentPrint(){
  const html=`<div class="extraPrintSheet irPrintSheet"><div class="extraPrintHeader"><img src="${logo}"><h1>INCIDENT REPORT</h1></div><table class="extraPrintTable"><tr><th>Report Date</th><td>${esc(dateToSlashYYYY(val('irReportDate')))}</td><th>Page</th><td>1 of 1</td></tr><tr><th>Employee</th><td>${esc(val('irEmployee'))}</td><th>Additional Sheets Attached</th><td>${esc(val('irAdditionalSheets'))}</td></tr><tr><th>Project</th><td>${esc(projectValue('irProject'))}</td><th>Project Location</th><td>${esc(val('irProjectLocation'))}</td></tr><tr><th>Incident Date</th><td>${esc(dateToSlashYYYY(val('irIncidentDate')))}</td><th>Time of Incident</th><td>${esc(val('irIncidentTime'))}</td></tr></table>${extraPrintBox('Description of Incident',val('irDescription'))}${extraPrintBox('Injuries Sustained',val('irInjuries'))}${extraPrintBox('Medical Review & Treatment',val('irTreatment'))}${extraPrintBox('Cause of Incident',val('irCause'))}${extraPrintBox('Corrective Action Taken to Prevent Recurrences',val('irCorrective'))}${extraPrintBox('Supplemental Review / Comments',val('irComments'))}<table class="extraPrintTable"><tr><th>Post to OSHA 300 Log</th><td>${esc(radioVal('irOsha300'))}</td><th>Police Report</th><td>${esc(radioVal('irPolice'))}</td></tr><tr><th>Agency</th><td>${esc(val('irAgency'))}</td><th>Report No.</th><td>${esc(val('irReportNo'))}</td></tr><tr><th>Reported to OSHA</th><td>${esc(radioVal('irReportedOsha'))}</td><th>To Whom</th><td>${esc(val('irToWhom'))}</td></tr><tr><th>Date / Time / By Whom</th><td colspan="3">${esc(dateToSlashYYYY(val('irOshaDate')))} ${esc(val('irOshaTime'))} &nbsp; ${esc(val('irByWhom'))}</td></tr></table>${(val('irWitnessName')||val('irWitnessStatement')||signatureStore.irWitnessSignature)?`<h2 class="extraSectionTitle">Witness Statement</h2><table class="extraPrintTable"><tr><th>Witness</th><td>${esc(val('irWitnessName'))}</td><th>Company / Trade</th><td>${esc(val('irWitnessCompany'))}</td><th>Phone</th><td>${esc(val('irWitnessPhone'))}</td></tr><tr><th>Date / Time</th><td>${esc(dateToSlashYYYY(val('irWitnessDate')))} ${esc(val('irWitnessTime'))}</td><th>Supervisor Notified</th><td colspan="3">${esc(val('irWitnessSupervisor'))}</td></tr></table>${extraPrintBox('Witness Statement - In Their Own Words',val('irWitnessStatement'),1.0)}${extraPrintBox('How Could This Be Prevented in the Future?',val('irWitnessPrevent'),.55)}<div class="extraSigGrid two"><div><b>Witness Print Name:</b> ${esc(val('irWitnessPrint')||val('irWitnessName'))}</div><div><b>Witness Signature:</b> ${sigPrint(signatureStore.irWitnessSignature,'')}</div></div>`:''}<div class="extraSigGrid two"><div><b>Report Completed By:</b> ${esc(val('irCompletedBy'))}</div><div><b>Signature:</b> ${sigPrint(signatureStore.irSignature,'')}</div></div></div>`;
  document.title=`Incident Report - ${dateToDisplay(val('irReportDate'))} - ${cleanFilePart(projectValue('irProject'))}`; setPrint(html);
}
function disciplinaryReportForm(){
  app.innerHTML=extraFormIntro('Disciplinary Action','Employee disciplinary form with violation, action taken, corrective action, and signatures.')+`<div class="panel"><h2>Basic Info</h2><div class="grid three">${field('drReportDate','Report Date','date')} ${projectField('drProject','Project')} ${field('drProjectLocation','Project Location')} ${field('drIncidentDate','Incident Date','date')} ${field('drIncidentTime','Time of Incident','time')} ${field('drEmployee','Employee')} ${field('drPage','Page','text','placeholder="1 of 1"')}</div></div><div class="panel"><h2>Incident / Violation</h2>${textarea('drDescription','Description of Incident & Safety Violation')}<div class="grid three"><label class="checkPill"><input id="drVerbal" type="checkbox"> Verbal</label><label class="checkPill"><input id="drWritten" type="checkbox"> Written</label><label class="checkPill"><input id="drReprimanded" type="checkbox"> Reprimanded</label><label class="checkPill"><input id="drSuspension" type="checkbox"> Temporary Suspension</label><label class="checkPill"><input id="drTerminated" type="checkbox"> Terminated</label>${field('drOffense','Number of Offense Past 6 Months')} ${field('drFrom','Suspension From','date')} ${field('drTo','Suspension To','date')}</div>${textarea('drCorrective','Corrective Action Taken')}${textarea('drComments','Supplemental Review / Comments')}${textarea('drEmployeeRemarks','Employee Remarks')}</div><div class="panel"><h2>Signatures</h2><div class="grid three">${field('drEmployeePrint','Employee Print Name')} ${sigField('drEmployeeSig','Employee Signature')} ${field('drEmployeeSigDate','Employee Date','date')} ${field('drSupervisor','Supervisor Print Name')} ${field('drSupervisorTitle','Supervisor Title')} ${sigField('drSupervisorSig','Supervisor Signature')} ${field('drSupervisorDate','Supervisor Date','date')} ${field('drSteward','Steward Print Name')} ${field('drUnionLocal','Union / Local')} ${sigField('drStewardSig','Steward Signature')} ${field('drStewardDate','Steward Date','date')}</div><div class="actions"><button class="btn" id="drPrintBtn">Save PDF / Print Disciplinary Report</button></div>${printPdfHelp('dr')}<div id="drMsg"></div></div></div>`;
  setupOtherProject('drProject'); setupToday('drReportDate'); setupToday('drIncidentDate'); setupToday('drEmployeeSigDate'); setupToday('drSupervisorDate'); setupToday('drStewardDate'); initSignatureButtons(); extraPrintButton('drPrintBtn', buildDisciplinaryPrint, 'drMsg', ()=>logGeneratedForm('dr', projectValue('drProject'), val('drReportDate'), `Disciplinary Report - ${dateToDisplay(val('drReportDate'))} - ${cleanFilePart(projectValue('drProject'))}`));
}
function checkedText(ids){return ids.filter(id=>isChecked(id)).map(id=>document.querySelector('label[for="'+id+'"]')?.innerText || id.replace(/^dr/,'')).join(', ');}
function buildDisciplinaryPrint(){
  const actions=[['drVerbal','Verbal'],['drWritten','Written'],['drReprimanded','Reprimanded'],['drSuspension','Temporary Suspension'],['drTerminated','Terminated']].filter(([id])=>isChecked(id)).map(x=>x[1]).join(', ');
  const html=`<div class="extraPrintSheet drPrintSheet"><div class="extraPrintHeader"><img src="${logo}"><h1>DISCIPLINARY ACTION</h1></div><table class="extraPrintTable"><tr><th>Report Date</th><td>${esc(dateToSlashYYYY(val('drReportDate')))}</td><th>Page</th><td>${esc(val('drPage')||'1 of 1')}</td></tr><tr><th>Project</th><td>${esc(projectValue('drProject'))}</td><th>Project Location</th><td>${esc(val('drProjectLocation'))}</td></tr><tr><th>Incident Date</th><td>${esc(dateToSlashYYYY(val('drIncidentDate')))}</td><th>Time of Incident</th><td>${esc(val('drIncidentTime'))}</td></tr><tr><th>Employee</th><td colspan="3">${esc(val('drEmployee'))}</td></tr></table>${extraPrintBox('Description of Incident & Safety Violation',val('drDescription'),1.15)}<table class="extraPrintTable"><tr><th>Disciplinary Action Taken</th><td>${esc(actions)}</td><th>Number of Offense Past 6 Months</th><td>${esc(val('drOffense'))}</td></tr><tr><th>Temporary Suspension From</th><td>${esc(dateToSlashYYYY(val('drFrom')))}</td><th>To</th><td>${esc(dateToSlashYYYY(val('drTo')))}</td></tr></table>${extraPrintBox('Corrective Action Taken',val('drCorrective'),.9)}${extraPrintBox('Supplemental Review / Comments',val('drComments'),.9)}${extraPrintBox('Employee Remarks',val('drEmployeeRemarks'),.9)}<table class="extraPrintTable"><tr><th>Employee</th><td>${esc(val('drEmployeePrint'))}</td><th>Date</th><td>${esc(dateToSlashYYYY(val('drEmployeeSigDate')))}</td></tr><tr><th>Signature</th><td colspan="3">${sigPrint(signatureStore.drEmployeeSig,'')}</td></tr><tr><th>Supervisor</th><td>${esc(val('drSupervisor'))}</td><th>Title</th><td>${esc(val('drSupervisorTitle'))}</td></tr><tr><th>Signature</th><td>${sigPrint(signatureStore.drSupervisorSig,'')}</td><th>Date</th><td>${esc(dateToSlashYYYY(val('drSupervisorDate')))}</td></tr><tr><th>Steward</th><td>${esc(val('drSteward'))}</td><th>Union / Local</th><td>${esc(val('drUnionLocal'))}</td></tr><tr><th>Signature</th><td>${sigPrint(signatureStore.drStewardSig,'')}</td><th>Date</th><td>${esc(dateToSlashYYYY(val('drStewardDate')))}</td></tr></table></div>`;
  document.title=`Disciplinary Report - ${dateToDisplay(val('drReportDate'))} - ${cleanFilePart(projectValue('drProject'))}`; setPrint(html);
}
function heavyAccidentReportForm(){
  app.innerHTML=extraFormIntro('Accident Report','Field-friendly starter for the accident/incident investigation packet. Use the original packet if the full seven pages are required.')+`<div class="panel notice"><b>Note:</b> This quick field version captures the main accident/incident details. The original 7-page packet is still stored with the app and can be printed from the office if needed.</div><div class="panel"><h2>Incident Info</h2><div class="grid three">${field('harDate','Date of Incident','date')} ${field('harTime','Time','time')} ${field('harReportDate','Date of Report','date')} ${projectField('harProject','Project Name')} ${field('harDay','Day of Week')} ${field('harWeather','Weather')} ${field('harPM','Project Manager')} ${field('harForeman','Superintendent / Foreman')} ${field('harExactLoc','Exact Location of Incident')} ${field('harAddress','Street Address')} ${field('harCity','City / State / Zip')} ${selectField('harDrugScreen','Drug Screen Administered',['','Yes','No'])}</div></div><div class="panel"><h2>Incident Type / Employee</h2><div class="grid three">${field('harType','Type of Incident')} ${field('harEmployee','Injured Employee Name')} ${field('harEmpId','Employee ID #')} ${field('harPhone','Phone')} ${field('harDob','Date of Birth','date')} ${field('harOccupation','Occupation / Job Title')} ${field('harYears','Years Experience')} ${field('harHire','Date of Hire','date')} ${field('harStart','Time Employee Started Work','time')}</div>${textarea('harPpe','List PPE worn at time of incident')}${textarea('harInjury','Detailed Description of Injury')}</div><div class="panel"><h2>Treatment / Property / Cause</h2><div class="grid two"><div><label>Onsite First Aid Given</label>${extraRadio('harFirstAid')}</div><div><label>Offsite Medical Treatment</label>${extraRadio('harMedical')}</div><div><label>Witnesses?</label>${extraRadio('harWitnesses')}</div><div><label>Property Damage?</label>${extraRadio('harProperty')}</div></div>${textarea('harTreatment','Treatment / Facility / Date Treatment Given')}${textarea('harDamage','Property / Equipment / Vehicle Damage')}${textarea('harDescription','Detailed chronological description of what happened')}${textarea('harRootCause','Root Cause / Contributing Factors')}${textarea('harCorrective','Corrective Actions Taken or Planned')}</div><div class="panel"><h2>Witness Statement</h2><p class="tiny">Optional witness page. Let the witness explain what happened in their own words and sign.</p><div class="grid three">${field('harWitnessName','Witness Print Name')} ${field('harWitnessCompany','Company / Trade')} ${field('harWitnessPhone','Phone')} ${field('harWitnessDate','Witness Date','date')} ${field('harWitnessTime','Witness Time','time')} ${field('harWitnessSupervisor','Supervisor Notified')}</div>${textarea('harWitnessStatement','This is what happened, in the witness’s own words')}${textarea('harWitnessUnusual','Anything unusual or unexpected?')}${textarea('harWitnessPrevent','How could this be prevented in the future?')}<div class="grid two">${field('harWitnessPrint','Witness Print Name')} ${sigField('harWitnessSignature','Witness Signature')}</div></div><div class="panel"><h2>Completed By</h2><div class="grid two">${field('harCompletedBy','Completed By')} ${sigField('harSignature','Signature')}</div><div class="actions"><button class="btn" id="harPrintBtn">Save PDF / Print Accident Report</button></div>${printPdfHelp('har')}<div id="harMsg"></div></div></div>`;
  setupOtherProject('harProject'); setupToday('harDate'); setupToday('harReportDate'); setupToday('harWitnessDate'); initSignatureButtons(); const d=document.getElementById('harDate'), day=document.getElementById('harDay'); const upd=()=>{if(d&&d.value&&day){day.value=new Date(d.value+'T00:00:00').toLocaleDateString(undefined,{weekday:'long'});}}; d&&d.addEventListener('change',upd); upd(); extraPrintButton('harPrintBtn', buildHeavyAccidentPrint, 'harMsg', ()=>logGeneratedForm('har', projectValue('harProject'), val('harReportDate'), `Accident Report - ${dateToDisplay(val('harReportDate'))} - ${cleanFilePart(projectValue('harProject'))}`));
}
function buildHeavyAccidentPrint(){
  const html=`<div class="extraPrintSheet harPrintSheet"><div class="extraPrintHeader"><img src="${logo}"><h1>ACCIDENT / INCIDENT INVESTIGATION REPORT</h1></div><table class="extraPrintTable"><tr><th>Date of Incident</th><td>${esc(dateToSlashYYYY(val('harDate')))}</td><th>Time</th><td>${esc(val('harTime'))}</td><th>Date of Report</th><td>${esc(dateToSlashYYYY(val('harReportDate')))}</td></tr><tr><th>Project Name</th><td>${esc(projectValue('harProject'))}</td><th>Day / Weather</th><td>${esc(val('harDay'))} / ${esc(val('harWeather'))}</td><th>Project Manager</th><td>${esc(val('harPM'))}</td></tr><tr><th>Superintendent / Foreman</th><td>${esc(val('harForeman'))}</td><th>Drug Screen</th><td>${esc(val('harDrugScreen'))}</td><th>Type of Incident</th><td>${esc(val('harType'))}</td></tr><tr><th>Exact Location</th><td colspan="5">${esc(val('harExactLoc'))} ${esc(val('harAddress'))} ${esc(val('harCity'))}</td></tr><tr><th>Injured Employee</th><td>${esc(val('harEmployee'))}</td><th>Employee ID</th><td>${esc(val('harEmpId'))}</td><th>Phone</th><td>${esc(val('harPhone'))}</td></tr><tr><th>DOB</th><td>${esc(dateToSlashYYYY(val('harDob')))}</td><th>Occupation</th><td>${esc(val('harOccupation'))}</td><th>Years / Hire / Start</th><td>${esc(val('harYears'))} / ${esc(dateToSlashYYYY(val('harHire')))} / ${esc(val('harStart'))}</td></tr></table>${extraPrintBox('PPE Worn',val('harPpe'),.55)}${extraPrintBox('Detailed Description of Injury',val('harInjury'),.75)}<table class="extraPrintTable"><tr><th>Onsite First Aid</th><td>${esc(radioVal('harFirstAid'))}</td><th>Offsite Medical Treatment</th><td>${esc(radioVal('harMedical'))}</td><th>Witnesses</th><td>${esc(radioVal('harWitnesses'))}</td></tr><tr><th>Property Damage</th><td colspan="5">${esc(radioVal('harProperty'))}</td></tr></table>${extraPrintBox('Treatment / Facility / Date Treatment Given',val('harTreatment'),.75)}${extraPrintBox('Property / Equipment / Vehicle Damage',val('harDamage'),.75)}${extraPrintBox('Detailed Chronological Description of What Happened',val('harDescription'),1.25)}${extraPrintBox('Root Cause / Contributing Factors',val('harRootCause'),.75)}${extraPrintBox('Corrective Actions Taken or Planned',val('harCorrective'),.75)}${(val('harWitnessName')||val('harWitnessStatement')||signatureStore.harWitnessSignature)?`<h2 class="extraSectionTitle">Witness Statement</h2><table class="extraPrintTable"><tr><th>Witness</th><td>${esc(val('harWitnessName'))}</td><th>Company / Trade</th><td>${esc(val('harWitnessCompany'))}</td><th>Phone</th><td>${esc(val('harWitnessPhone'))}</td></tr><tr><th>Date / Time</th><td>${esc(dateToSlashYYYY(val('harWitnessDate')))} ${esc(val('harWitnessTime'))}</td><th>Supervisor Notified</th><td colspan="3">${esc(val('harWitnessSupervisor'))}</td></tr></table>${extraPrintBox('Witness Statement - In Their Own Words',val('harWitnessStatement'),.85)}${extraPrintBox('Anything Unusual or Unexpected?',val('harWitnessUnusual'),.45)}${extraPrintBox('How Could This Be Prevented in the Future?',val('harWitnessPrevent'),.45)}<div class="extraSigGrid two"><div><b>Witness Print Name:</b> ${esc(val('harWitnessPrint')||val('harWitnessName'))}</div><div><b>Witness Signature:</b> ${sigPrint(signatureStore.harWitnessSignature,'')}</div></div>`:''}<div class="extraSigGrid two"><div><b>Completed By:</b> ${esc(val('harCompletedBy'))}</div><div><b>Signature:</b> ${sigPrint(signatureStore.harSignature,'')}</div></div></div>`;
  document.title=`Accident Report - ${dateToDisplay(val('harReportDate'))} - ${cleanFilePart(projectValue('harProject'))}`; setPrint(html);
}
function extraPrintBox(title, text, h=0.7){return `<div class="extraPrintBox" style="min-height:${h}in"><b>${esc(title)}:</b><br>${esc(text)}</div>`;}


function adminView(){
  const pin=adminPin();
  app.innerHTML=`<div class="container adminContainer"><div class="panel adminHero"><div><h1>JAGD Field Forms Admin</h1><p>Boss dashboard for job folders, daily/weekly form counts, workers, and COA materials. First version tracks forms generated from this app.</p></div><div class="actions"><a class="btn light" href="#/">Back to Forms</a></div></div>${!pin?adminLoginHtml():adminDashboardHtml()}</div>`;
  if(!pin) setupAdminLogin(); else loadAdminDashboard();
}
function adminLoginHtml(){return `<div class="panel"><h2>Admin Login</h2><p class="tiny">Admin password for now. Later we can move this into portal login.</p><div class="grid two"><div><label for="adminPinInput">Admin Password</label><input id="adminPinInput" type="password" placeholder="Enter admin password"></div></div><div class="actions"><button class="btn" id="adminLoginBtn">Open Admin</button></div><div id="adminLoginMsg"></div></div>`;}
function setupAdminLogin(){const btn=document.getElementById('adminLoginBtn'); if(!btn)return; btn.onclick=()=>{const v=val('adminPinInput'); if(!v){document.getElementById('adminLoginMsg').innerHTML='<div class="notice">Enter the admin PIN.</div>';return;} localStorage.setItem('jagdAdminPin',v); adminView();};}
function adminDashboardHtml(){return `<div class="adminTabs"><button class="btn small" data-admin-tab="tracker">Tracker</button><button class="btn small light" data-admin-tab="workers">DWL Names</button><button class="btn small light" data-admin-tab="coa">COA Materials</button><button class="btn small light" id="adminLogoutBtn">Logout</button></div><div id="adminContent"><div class="notice">Loading admin dashboard...</div></div>`;}
async function fetchBuiltInWorkersForAdmin(){
  const embeddedRows = Array.isArray(EMBEDDED_ACTIVE_WORKERS) ? EMBEDDED_ACTIVE_WORKERS.slice() : [];
  let staticRows = [];
  try{
    const res = await fetch('/data/active-workers.json?v=20260618v160', {cache:'no-store', headers:{Accept:'application/json'}});
    const text = await res.text();
    const json = text ? JSON.parse(text) : [];
    if(res.ok && Array.isArray(json)) staticRows = json;
  }catch(e){ console.warn('Admin built-in worker fallback failed', e); }
  return mergeWorkerSources(staticRows, embeddedRows).filter(isWorkerActive);
}
async function adminFetch(path, opts={}){
  const headers={Accept:'application/json',...(opts.headers||{}),'x-admin-pin':adminPin()};
  const res=await fetch(path,{...opts,headers,cache:'no-store'});
  if(res.status===401){localStorage.removeItem('jagdAdminPin'); adminView(); throw new Error('Admin PIN required.');}
  const text=await res.text();
  let json=null;
  try{json=text?JSON.parse(text):{};}
  catch(e){
    if(String(path).includes('/api/admin/workers') && (!opts.method || String(opts.method).toUpperCase()==='GET')){
      const rows = await fetchBuiltInWorkersForAdmin();
      return {ok:true, rows, apiFallback:true, warning:'Server worker API returned the app page, so the admin screen is showing the built-in worker list. Deploy the API fix, then hard refresh.'};
    }
    throw new Error('Server worker API returned the website page instead of JSON. This patch fixes that after Render finishes deploying.');
  }
  if(!res.ok) throw new Error(json.error||'Admin request failed');
  return json;
}
function setupAdminTabs(logs){
  document.querySelectorAll('[data-admin-tab]').forEach(btn=>{btn.onclick=()=>{document.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.add('light')); btn.classList.remove('light'); const tab=btn.dataset.adminTab; if(tab==='tracker') renderAdminTracker(logs); if(tab==='workers') renderAdminWorkers(); if(tab==='coa') renderAdminCoa();};});
  const out=document.getElementById('adminLogoutBtn'); if(out) out.onclick=()=>{localStorage.removeItem('jagdAdminPin'); adminView();};
}
async function loadAdminDashboard(){
  try{const json=await adminFetch('/api/admin/form-logs'); setupAdminTabs(json.rows||[]); renderAdminTracker(json.rows||[]);}catch(e){const c=document.getElementById('adminContent'); if(c)c.innerHTML=`<div class="notice">${esc(e.message)}</div>`;}
}
function visibleAdminLogs(logs){
  const showTest = localStorage.getItem('jagdAdminShowTestLogs') === '1';
  return showTest ? logs : logs.filter(r=>!r.test);
}
function renderAdminTracker(logs){
  const c=document.getElementById('adminContent'); if(!c)return;
  const showTest = localStorage.getItem('jagdAdminShowTestLogs') === '1';
  const visible = visibleAdminLogs(logs||[]);
  const jobs={}; visible.forEach(r=>{const project=r.project||'No Project'; jobs[project]=jobs[project]||[]; jobs[project].push(r);});
  const jobNames=Object.keys(jobs).sort((a,b)=>a.localeCompare(b));
  const testCount=(logs||[]).filter(r=>r.test).length;
  const week=weekLabel(new Date().toISOString().slice(0,10));
  c.innerHTML=`<div class="panel"><h2>Job Tracker</h2><p class="tiny"><b>Daily folder:</b> DWL, PIR, MEWP, DSIF, Daily Equipment, BOL, Incident, Accident, Disciplinary. <b>Weekly folder:</b> Weekly Safety Meetings. Current week: ${esc(week)}.</p><div class="adminToolbar"><label class="checkLine"><input type="checkbox" id="adminShowTestLogs" ${showTest?'checked':''}> Show test logs (${testCount})</label><button class="btn small light" id="adminRefreshLogs" type="button">Refresh</button><button class="btn small danger" id="adminClearTestLogs" type="button">Clear Test Logs</button><button class="btn small danger" id="adminClearAllLogs" type="button">Clear All Logs</button></div>${jobNames.length?'<div class="adminJobGrid">'+jobNames.map(j=>adminJobCard(j,jobs[j])).join('')+'</div>':'<div class="notice">No forms have been generated yet. Counts start when field users tap Save PDF / Print.</div>'}</div><div id="adminJobDetail"></div>`;
  const show=document.getElementById('adminShowTestLogs'); if(show) show.onchange=()=>{localStorage.setItem('jagdAdminShowTestLogs', show.checked?'1':'0'); renderAdminTracker(logs);};
  const refresh=document.getElementById('adminRefreshLogs'); if(refresh) refresh.onclick=()=>loadAdminDashboard();
  const clearTest=document.getElementById('adminClearTestLogs'); if(clearTest) clearTest.onclick=async()=>{if(!confirm('Delete all test logs? This will not delete real logs.'))return; await adminFetch('/api/admin/form-logs?testOnly=1',{method:'DELETE'}); loadAdminDashboard();};
  const clearAll=document.getElementById('adminClearAllLogs'); if(clearAll) clearAll.onclick=async()=>{if(!confirm('Delete ALL tracker logs? Only use this before launch or if you are cleaning test data.'))return; await adminFetch('/api/admin/form-logs',{method:'DELETE'}); loadAdminDashboard();};
  document.querySelectorAll('[data-admin-job]').forEach(btn=>{btn.onclick=()=>renderAdminJobDetail(btn.dataset.adminJob, jobs[btn.dataset.adminJob]||[], logs||[]);});
}
function adminJobCard(project, rows){
  const daily=rows.filter(r=>formBucket(r.type)==='daily').length;
  const weekly=rows.filter(r=>formBucket(r.type)==='weekly').length;
  const last=rows.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
  return `<button class="adminJobCard" data-admin-job="${esc(project)}"><b>${esc(project)}</b><span>Daily forms: ${daily}</span><span>Weekly forms: ${weekly}</span><small>Last: ${last?new Date(last.createdAt).toLocaleString():'None'}</small></button>`;
}
function renderAdminJobDetail(project, rows, allLogs=[]){
  const d=document.getElementById('adminJobDetail'); if(!d)return;
  const daily=rows.filter(r=>formBucket(r.type)==='daily');
  const weekly=rows.filter(r=>formBucket(r.type)==='weekly');
  const byDay={}; daily.forEach(r=>{byDay[r.date]=byDay[r.date]||[]; byDay[r.date].push(r);});
  const byWeek={}; weekly.forEach(r=>{const w=weekLabel(r.date); byWeek[w]=byWeek[w]||[]; byWeek[w].push(r);});
  d.innerHTML=`<div class="panel"><h2>${esc(project)}</h2><div class="adminToolbar"><button class="btn small danger" id="adminDeleteJobLogs" type="button">Delete Logs for This Job</button><button class="btn small light" id="adminBackToJobs" type="button">Back to Job List</button></div>${adminDailyWeekChecklist(daily)}<div class="adminFolders"><div class="adminFolder"><h3>Daily Folder</h3><p class="tiny">Use this to see if a job missed daily forms.</p>${Object.keys(byDay).sort().reverse().map(date=>adminDayBlock(date,byDay[date])).join('')||'<p>No daily forms generated yet.</p>'}</div><div class="adminFolder"><h3>Weekly Folder</h3><p class="tiny">Weekly safety / toolbox talk records.</p>${Object.keys(byWeek).sort().reverse().map(w=>adminWeekBlock(w,byWeek[w])).join('')||'<p>No weekly forms generated yet.</p>'}</div></div></div>`;
  const del=document.getElementById('adminDeleteJobLogs'); if(del) del.onclick=async()=>{if(!confirm(`Delete tracker logs for ${project}?`))return; await adminFetch('/api/admin/form-logs?project='+encodeURIComponent(project),{method:'DELETE'}); loadAdminDashboard();};
  const back=document.getElementById('adminBackToJobs'); if(back) back.onclick=()=>renderAdminTracker(allLogs);
  setupAdminLogButtons();
}
function adminLogActions(r){
  return `<div class="adminLogActions"><button class="btn tiny light" data-test-log="${esc(r.id)}" type="button">${r.test?'Unmark Test':'Mark Test'}</button><button class="btn tiny danger" data-delete-log="${esc(r.id)}" type="button">Delete</button></div>`;
}
function setupAdminLogButtons(){
  document.querySelectorAll('[data-delete-log]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this tracker log?'))return; await adminFetch('/api/admin/form-logs/'+encodeURIComponent(b.dataset.deleteLog),{method:'DELETE'}); loadAdminDashboard();});
  document.querySelectorAll('[data-test-log]').forEach(b=>b.onclick=async()=>{await adminFetch('/api/admin/form-logs/'+encodeURIComponent(b.dataset.testLog),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({toggleTest:true})}); loadAdminDashboard();});
}
function adminDayBlock(date, rows){
  const counts={}; rows.forEach(r=>{counts[formLabel(r.type)]=(counts[formLabel(r.type)]||0)+1;});
  return `<details class="adminDetail"><summary>${esc(dateToDisplay(date))} — ${rows.length} form(s)</summary><div class="adminCountList">${Object.entries(counts).map(([k,v])=>`<span>${esc(k)}: <b>${v}</b></span>`).join('')}</div><ul>${rows.map(r=>`<li>${r.test?'<b class="testBadge">TEST</b> ':''}${esc(formLabel(r.type))} — ${esc(r.title||'Generated form')} <small>${new Date(r.createdAt).toLocaleTimeString()}</small>${adminLogActions(r)}</li>`).join('')}</ul></details>`;
}
function adminDailyWeekChecklist(dailyRows){
  const start=weekStart(new Date().toISOString().slice(0,10));
  const today=ymd(new Date());
  const days=Array.from({length:7},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return ymd(d);});
  const counts={}; dailyRows.forEach(r=>{counts[r.date]=(counts[r.date]||0)+1;});
  const boxes=days.map(date=>{const isFuture=date>today; const count=counts[date]||0; const cls=isFuture?'future':(count?'ok':'missing'); const label=isFuture?'Upcoming':(count?`${count} form(s)`:'Missing daily forms'); return `<div class="adminDayCheck ${cls}"><b>${esc(dateToDisplay(date))}</b><span>${esc(label)}</span></div>`;}).join('');
  return `<div class="adminWeekCheck"><h3>This Week Daily Check</h3><p class="tiny">Quick view so the boss can see missed daily paperwork for the current week. Test logs are hidden unless you turn them on.</p><div class="adminDayCheckGrid">${boxes}</div></div>`;
}

function adminWeekBlock(label, rows){return `<details class="adminDetail"><summary>${esc(label)} — ${rows.length} weekly form(s)</summary><ul>${rows.map(r=>`<li>${r.test?'<b class="testBadge">TEST</b> ':''}${esc(formLabel(r.type))} — ${esc(r.title||'Weekly Safety')} <small>${dateToDisplay(r.date)}</small>${adminLogActions(r)}</li>`).join('')}</ul></details>`;}
function adminProjectOptions(selected=''){
  const vals=[...PROJECT_OPTIONS.filter(Boolean)];
  if(selected && !vals.includes(selected)) vals.unshift(selected);
  return vals.map(p=>`<option value="${esc(p)}" ${p===selected?'selected':''}>${esc(p)}</option>`).join('');
}
function workerFormHtml(w={}, mode='add'){
  return `<div class="adminEditForm" id="adminWorkerForm"><h3>${w.id?'Edit Worker':'Add Worker'}</h3><input id="adminWorkerId" type="hidden" value="${esc(w.id||'')}"><div class="grid four"><div><label>First Name</label><input id="adminWorkerFirst" value="${esc(w.firstName||'')}"></div><div><label>Last Name</label><input id="adminWorkerLast" value="${esc(w.lastName||'')}"></div><div><label>Full Name</label><input id="adminWorkerFull" value="${esc(w.fullName||'')}"></div><div><label>Class</label><input id="adminWorkerClass" value="${esc(w.class||'')}"></div><div><label>Local</label><input id="adminWorkerLocal" value="${esc(cleanLocalValue(w.local))}"></div><div><label>Current Job</label><select id="adminWorkerJob"><option value=""></option>${adminProjectOptions(w.currentJob||'')}</select></div><div><label>Status</label><select id="adminWorkerStatus"><option ${(!w.status||w.status==='Active')?'selected':''}>Active</option><option ${w.status==='Inactive'?'selected':''}>Inactive</option><option ${w.status==='Disabled'?'selected':''}>Disabled</option><option ${w.status==='Terminated'?'selected':''}>Terminated</option></select></div><div><label>Employee ID</label><input id="adminWorkerEmployeeId" value="${esc(w.employeeId||'')}"></div><div><label>Trade</label><input id="adminWorkerTrade" value="${esc(w.trade||'')}"></div><div><label>Crew</label><input id="adminWorkerCrew" value="${esc(w.crew||'')}"></div></div><div class="actions"><button class="btn" id="adminWorkerSaveBtn" type="button">Save Worker</button><button class="btn light" id="adminWorkerCancelBtn" type="button">Cancel</button></div><div id="adminWorkerMsg"></div></div>`;
}
function workerFullName(w){ return (w.fullName || `${w.firstName||''} ${w.lastName||''}`.trim() || '').trim(); }
async function renderAdminWorkers(editWorker=null, showForm=false){
  const c=document.getElementById('adminContent'); if(!c)return;
  c.innerHTML='<div class="panel"><div class="notice">Loading workers...</div></div>';
  try{
    let fallbackNotice='';
    let rows=[];
    try{
      const json=await adminFetch('/api/admin/workers');
      rows=(json.rows||[]).slice();
    }catch(apiErr){
      rows=builtInWorkerRows();
      fallbackNotice=`<div class="notice">Live worker API is not responding, so this page is showing the built-in worker list. The field DWL autocomplete can still use these names.</div>`;
    }
    if(!rows.length){
      rows=builtInWorkerRows();
      fallbackNotice=`<div class="notice">Live worker list was empty, so this page is showing the built-in worker list.</div>`;
      try{ await adminFetch('/api/admin/workers/restore-built-in',{method:'POST'}); }catch(e){}
    }
    rows=rows.sort((a,b)=>workerFullName(a).localeCompare(workerFullName(b)));
    const activeCount=rows.filter(w=>!w.disabled && !String(w.status||'').toLowerCase().includes('term') && !String(w.status||'').toLowerCase().includes('inactive') && !String(w.status||'').toLowerCase().includes('disabled')).length;
    c.innerHTML=`<div class="panel"><h2>DWL Names / Workers</h2>${fallbackNotice}<p class="tiny">This shows the full worker list used by DWL autocomplete. Start typing in search just like the DWL employee box, or click Edit next to any worker.</p><div class="adminToolbar"><button class="btn" id="adminAddWorkerBtn" type="button">+ Add Worker</button><button class="btn light" id="adminOpenWorkerImportBtn" type="button">Import New Excel / CSV</button><a class="btn light" id="adminWorkerExportBtn" href="/api/admin/workers/export.csv?pin=${encodeURIComponent(adminPin())}">Export Worker List</a><button class="btn light" id="adminRestoreBuiltInWorkersBtn" type="button">Reload Built-In Worker List</button><span><b>${activeCount}</b> active / <b>${rows.length}</b> total</span></div><div id="adminWorkerFormHolder">${showForm||editWorker?workerFormHtml(editWorker||{}):''}</div><details class="adminDetail" id="adminWorkerImportDetails"><summary>Import new Excel / CSV worker list</summary><p class="tiny">Best option: export/save Excel as CSV, then upload it here or paste it below. Import replaces the Forms worker list.</p><input id="adminWorkerCsvFile" type="file" accept=".csv,.txt,text/csv"><textarea id="adminWorkerCsv" class="adminBigText" placeholder="Or paste active workers CSV here"></textarea><div class="actions"><button class="btn" id="adminWorkerImportBtn" type="button">Import Worker List</button></div><div id="adminWorkerImportMsg"></div></details><div class="adminToolbar"><input id="adminWorkerSearch" placeholder="Start typing a name like the DWL autocomplete"><select id="adminWorkerStatusFilter"><option value="">All statuses</option><option value="active">Active only</option><option value="disabled">Disabled / inactive</option></select></div><div id="adminWorkerTable"></div></div>`;
    const holder=document.getElementById('adminWorkerFormHolder');
    const add=document.getElementById('adminAddWorkerBtn'); if(add) add.onclick=()=>{holder.innerHTML=workerFormHtml({}); setupAdminWorkerForm(); holder.scrollIntoView({behavior:'smooth',block:'start'});};
    const restoreBuiltIn=document.getElementById('adminRestoreBuiltInWorkersBtn'); if(restoreBuiltIn) restoreBuiltIn.onclick=async()=>{if(!confirm('Reload the built-in active worker list? This replaces the current Forms worker list.'))return; try{const out=await adminFetch('/api/admin/workers/restore-built-in',{method:'POST'}); activeWorkers=[]; alert(`Reloaded ${out.count} workers (${out.activeCount} active).`); renderAdminWorkers();}catch(e){alert(e.message);}};
    const openImport=document.getElementById('adminOpenWorkerImportBtn'); if(openImport) openImport.onclick=()=>{const d=document.getElementById('adminWorkerImportDetails'); if(d){d.open=true; d.scrollIntoView({behavior:'smooth',block:'start'});}};
    if(showForm||editWorker) setupAdminWorkerForm();
    const fileInput=document.getElementById('adminWorkerCsvFile'); if(fileInput) fileInput.onchange=()=>{const f=fileInput.files&&fileInput.files[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{document.getElementById('adminWorkerCsv').value=String(reader.result||'');}; reader.readAsText(f);};
    document.getElementById('adminWorkerImportBtn').onclick=async()=>{
      const csvText=val('adminWorkerCsv');
      if(!csvText){document.getElementById('adminWorkerImportMsg').innerHTML='<div class="notice">Upload a CSV file or paste CSV text first.</div>'; return;}
      try{const out=await adminFetch('/api/admin/workers/import-csv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csvText})}); activeWorkers=[]; document.getElementById('adminWorkerImportMsg').innerHTML=`<div class="notice success">Imported ${out.count} workers (${out.activeCount} active).</div>`; setTimeout(()=>renderAdminWorkers(),700);}catch(e){document.getElementById('adminWorkerImportMsg').innerHTML=`<div class="notice">${esc(e.message)}</div>`;}
    };
    const renderTable=()=>{
      const q=val('adminWorkerSearch').toLowerCase(), statusFilter=val('adminWorkerStatusFilter');
      const filtered=rows.filter(w=>{
        const active=!w.disabled && !String(w.status||'').toLowerCase().includes('term') && !String(w.status||'').toLowerCase().includes('inactive') && !String(w.status||'').toLowerCase().includes('disabled');
        if(statusFilter==='active' && !active) return false;
        if(statusFilter==='disabled' && active) return false;
        return `${workerFullName(w)} ${w.firstName||''} ${w.lastName||''} ${w.class||''} ${w.local||''} ${w.currentJob||''} ${w.employeeId||''}`.toLowerCase().includes(q);
      }).slice(0,500);
      document.getElementById('adminWorkerTable').innerHTML=`<div class="adminTableWrap"><table class="adminTable"><tr><th>Name</th><th>Class</th><th>Local</th><th>Job</th><th>Status</th><th>Action</th></tr>${filtered.map(w=>`<tr class="${w.disabled?'mutedRow':''}"><td><b>${esc(workerFullName(w))}</b><br><small>${esc(w.employeeId||'')}</small></td><td>${esc(w.class||'')}</td><td>${esc(cleanLocalValue(w.local))}</td><td>${esc(w.currentJob||'')}</td><td>${esc(w.disabled?'Disabled':(w.status||'Active'))}</td><td><button class="btn small light" data-edit-worker="${esc(w.id)}" type="button">Edit</button> <button class="btn small danger" data-disable-worker="${esc(w.id)}" type="button">Disable</button></td></tr>`).join('')}</table></div><p class="tiny">Showing ${filtered.length} of ${rows.length} workers.</p>`;
      document.querySelectorAll('[data-edit-worker]').forEach(b=>b.onclick=()=>{const worker=rows.find(w=>String(w.id)===b.dataset.editWorker); holder.innerHTML=workerFormHtml(worker||{}); setupAdminWorkerForm(); holder.scrollIntoView({behavior:'smooth',block:'start'});});
      document.querySelectorAll('[data-disable-worker]').forEach(b=>b.onclick=async()=>{if(!confirm('Disable this worker from DWL autocomplete?'))return; await adminFetch('/api/admin/workers/'+encodeURIComponent(b.dataset.disableWorker),{method:'DELETE'}); activeWorkers=[]; renderAdminWorkers();});
    };
    document.getElementById('adminWorkerSearch').oninput=renderTable;
    document.getElementById('adminWorkerStatusFilter').onchange=renderTable;
    renderTable();
  }catch(e){c.innerHTML=`<div class="panel"><div class="notice">${esc(e.message)}</div></div>`;}
}
function setupAdminWorkerForm(){
  const save=document.getElementById('adminWorkerSaveBtn'); if(!save)return;
  const cancel=document.getElementById('adminWorkerCancelBtn'); if(cancel) cancel.onclick=()=>{const holder=document.getElementById('adminWorkerFormHolder'); if(holder) holder.innerHTML='';};
  const first=document.getElementById('adminWorkerFirst'), last=document.getElementById('adminWorkerLast'), full=document.getElementById('adminWorkerFull');
  const syncFull=()=>{ if(full && !full.value.trim()) full.value=`${first?.value||''} ${last?.value||''}`.trim(); };
  if(first) first.onblur=syncFull; if(last) last.onblur=syncFull;
  save.onclick=async()=>{
    const body={id:val('adminWorkerId'),firstName:val('adminWorkerFirst'),lastName:val('adminWorkerLast'),fullName:val('adminWorkerFull')||`${val('adminWorkerFirst')} ${val('adminWorkerLast')}`.trim(),class:val('adminWorkerClass'),local:cleanLocalValue(val('adminWorkerLocal')),currentJob:val('adminWorkerJob'),status:val('adminWorkerStatus'),employeeId:val('adminWorkerEmployeeId'),trade:val('adminWorkerTrade'),crew:val('adminWorkerCrew'),disabled:val('adminWorkerStatus')==='Disabled'};
    try{await adminFetch('/api/admin/workers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); activeWorkers=[]; document.getElementById('adminWorkerMsg').innerHTML='<div class="notice success">Worker saved.</div>'; setTimeout(()=>renderAdminWorkers(),500);}catch(e){document.getElementById('adminWorkerMsg').innerHTML=`<div class="notice">${esc(e.message)}</div>`;}
  };
}
function materialFormHtml(m={}, projectDefault=''){
  const projectValue=m.project||projectDefault||'';
  return `<div class="adminEditForm"><h3>${m.id?'Edit COA Material':'Add Single COA Manually'}</h3><input id="adminMatId" type="hidden" value="${esc(m.id||'')}"><div class="grid four"><div><label>Project / Job</label><select id="adminMatProject"><option value=""></option>${adminProjectOptions(projectValue)}</select></div><div><label>Component</label><select id="adminMatComponent"><option ${m.component==='Base / Paint'?'selected':''}>Base / Paint</option><option ${m.component==='Hardener / Converter'?'selected':''}>Hardener / Converter</option><option ${m.component==='Dust / Powder'?'selected':''}>Dust / Powder</option><option ${m.component==='Accelerator'?'selected':''}>Accelerator</option><option ${m.component==='Thinner'?'selected':''}>Thinner</option><option ${m.component==='Other'?'selected':''}>Other</option></select></div><div><label>Mfr</label><input id="adminMatMfr" value="${esc(m.mfr||'')}"></div><div><label>Product Name</label><input id="adminMatProd" value="${esc(m.prodName||'')}"></div><div><label>Color</label><input id="adminMatColor" value="${esc(m.color||'')}"></div><div><label>Batch #</label><input id="adminMatBatch" value="${esc(m.batch||'')}"></div><div><label>Mfg Date</label><input id="adminMatMfg" value="${esc(m.mfgDate||'')}"></div><div><label>Exp Date</label><input id="adminMatExp" value="${esc(m.expDate||'')}"></div><div><label>Shelf Life</label><input id="adminMatShelf" value="${esc(m.shelfLife||'')}"></div><div><label>Item No.</label><input id="adminMatItem" value="${esc(m.itemNo||'')}"></div><div><label>COA File Name</label><input id="adminMatFile" value="${esc(m.fileName||'')}"></div><div><label>Status</label><select id="adminMatStatus"><option value="active" ${!m.disabled?'selected':''}>Active</option><option value="disabled" ${m.disabled?'selected':''}>Disabled / Needs Review</option></select></div></div><div><label>Description / label notes</label><input id="adminMatDesc" value="${esc(m.description||'')}"></div><div class="actions"><button class="btn" id="adminMatSaveBtn" type="button">Save Material</button><button class="btn light" id="adminMatCancelBtn" type="button">Cancel</button></div><div id="adminMatMsg"></div></div>`;
}
function coaImportHtml(project=''){
  return `<div class="adminEditForm"><h3>Import COAs</h3><p class="tiny">Pick the job first, then upload one or more COA PDFs. The app will create review rows from the file names. Edit each row to confirm product, batch, dates, color, and mark Active before it appears in the PIR helper.</p><div class="grid two"><div><label>Project / Job</label><select id="adminImportProject"><option value=""></option>${adminProjectOptions(project)}</select></div><div><label>COA PDF files</label><input id="adminImportFiles" type="file" accept="application/pdf,.pdf" multiple></div></div><div class="actions"><button class="btn" id="adminImportBtn" type="button">Import Selected COAs</button><button class="btn light" id="adminImportCancelBtn" type="button">Cancel</button></div><div id="adminImportMsg"></div></div>`;
}
async function renderAdminCoa(editMat=null, mode='list'){
  const c=document.getElementById('adminContent'); if(!c)return;
  c.innerHTML='<div class="panel"><div class="notice">Loading COA materials...</div></div>';
  try{
    const json=await adminFetch('/api/admin/materials');
    let rows=dedupeMaterials([...(json.rows||[]), ...builtInMaterialRows()]);
    if(!rows.length) rows=builtInMaterialRows();
    const active=rows.filter(m=>!m.disabled);
    const savedProject=window.adminCoaSelectedProject||'';
    let workPanel='';
    if(mode==='manual') workPanel=materialFormHtml(editMat||{}, savedProject);
    if(mode==='import') workPanel=coaImportHtml(savedProject);
    c.innerHTML=`<div class="panel"><h2>COA / Material Library</h2><p class="tiny">Simple view: choose a job, import COA PDFs, add one material manually, or show what is already loaded for that job.</p><div class="adminSimpleBar"><label>Project / Job</label><select id="adminMatFilterProject"><option value="">Choose a job...</option>${adminProjectOptions(savedProject)}</select><button class="btn" id="adminShowMaterialsBtn" type="button">Show Current COAs</button><button class="btn" id="adminImportCoaBtn" type="button">Import COAs</button><button class="btn light" id="adminAddManualCoaBtn" type="button">Add Single COA Manually</button><span>${active.length} active / ${rows.length} total</span></div>${workPanel}<div class="adminToolbar"><input id="adminMatSearch" placeholder="Search product, batch, color"><span id="adminMatVisibleCount"></span></div><div id="adminMatTable"></div></div>`;
    if(mode==='manual') setupAdminMaterialForm();
    if(mode==='import') setupAdminCoaImport();
    const clearMatTable=(msg='Choose a job, then click Show Current COAs.')=>{
      const count=document.getElementById('adminMatVisibleCount'); if(count) count.textContent='';
      const table=document.getElementById('adminMatTable'); if(table) table.innerHTML=`<div class="notice soft">${esc(msg)}</div>`;
    };
    const renderTable=()=>{
      const q=val('adminMatSearch').toLowerCase(), project=val('adminMatFilterProject');
      window.adminCoaSelectedProject=project;
      if(!window.adminCoaShowMaterials){ clearMatTable(); return; }
      if(!project){ clearMatTable('Pick a job first, then click Show Current COAs.'); return; }
      const projectKey=adminProjectKeyFromName(project);
      const filtered=rows.filter(m=>materialProjectMatches(m,projectKey) && `${m.project||''} ${m.mfr||''} ${m.prodName||''} ${m.batch||''} ${m.color||''} ${m.component||''} ${m.fileName||''}`.toLowerCase().includes(q)).slice(0,350);
      const count=document.getElementById('adminMatVisibleCount'); if(count) count.textContent=`Showing ${filtered.length} for ${project}`;
      document.getElementById('adminMatTable').innerHTML=`<div class="adminTableWrap"><table class="adminTable"><tr><th>Project</th><th>Component</th><th>Product</th><th>Batch</th><th>Exp</th><th>Status</th><th></th></tr>${filtered.map(m=>`<tr class="${m.disabled?'mutedRow':''}"><td>${esc(m.project||'')}</td><td>${esc(m.component||'')}</td><td><b>${esc(m.prodName||m.description||'')}</b><br><small>${esc(m.color||'')} ${esc(m.mfr||'')} ${m.fileName?('File: '+esc(m.fileName)):''}</small></td><td>${esc(m.batch||'')}</td><td>${esc(m.expDate||'')}</td><td>${m.builtIn?'Built-in / Active':(m.disabled?'Needs Review / Disabled':'Active')}</td><td><button class="btn small light" data-edit-mat="${esc(m.id)}" type="button">${m.builtIn?'Copy/Edit':'Edit'}</button> ${m.builtIn?'':`<button class="btn small danger" data-disable-mat="${esc(m.id)}" type="button">Disable</button>`}</td></tr>`).join('')}</table></div>`;
      document.querySelectorAll('[data-edit-mat]').forEach(b=>b.onclick=()=>{
        const found=rows.find(m=>String(m.id)===b.dataset.editMat);
        const editable=found?.builtIn ? {...found, id:'', builtIn:false} : found;
        renderAdminCoa(editable,'manual');
      });
      document.querySelectorAll('[data-disable-mat]').forEach(b=>b.onclick=async()=>{if(!confirm('Disable this material from PIR helper?'))return; await adminFetch('/api/admin/materials/'+encodeURIComponent(b.dataset.disableMat),{method:'DELETE'}); serverMaterialsLoaded=false; renderAdminCoa();});
    };
    document.getElementById('adminMatSearch').oninput=renderTable;
    document.getElementById('adminMatFilterProject').onchange=()=>{window.adminCoaSelectedProject=val('adminMatFilterProject'); window.adminCoaShowMaterials=false; clearMatTable();};
    document.getElementById('adminShowMaterialsBtn').onclick=()=>{window.adminCoaSelectedProject=val('adminMatFilterProject'); window.adminCoaShowMaterials=true; renderTable();};
    document.getElementById('adminImportCoaBtn').onclick=()=>{window.adminCoaSelectedProject=val('adminMatFilterProject'); window.adminCoaShowMaterials=false; renderAdminCoa(null,'import');};
    document.getElementById('adminAddManualCoaBtn').onclick=()=>{window.adminCoaSelectedProject=val('adminMatFilterProject'); window.adminCoaShowMaterials=false; renderAdminCoa(null,'manual');};
    window.adminCoaShowMaterials=false;
    clearMatTable();
  }catch(e){c.innerHTML=`<div class="panel"><div class="notice">${esc(e.message)}</div></div>`;}
}
function setupAdminCoaImport(){
  const btn=document.getElementById('adminImportBtn'); if(!btn)return;
  const cancel=document.getElementById('adminImportCancelBtn'); if(cancel) cancel.onclick=()=>renderAdminCoa();
  const sel=document.getElementById('adminImportProject'); if(sel) sel.onchange=()=>{window.adminCoaSelectedProject=sel.value;};
  btn.onclick=async()=>{
    const project=val('adminImportProject');
    const files=document.getElementById('adminImportFiles')?.files;
    if(!project){document.getElementById('adminImportMsg').innerHTML='<div class="notice">Choose a project/job first.</div>';return;}
    if(!files || !files.length){document.getElementById('adminImportMsg').innerHTML='<div class="notice">Choose at least one COA PDF.</div>';return;}
    const fd=new FormData(); fd.append('project',project); Array.from(files).forEach(f=>fd.append('coaFiles',f));
    btn.disabled=true; btn.textContent='Importing...';
    try{const res=await fetch('/api/admin/materials/import',{method:'POST',headers:{'x-admin-pin':adminPin()},body:fd}); const json=await res.json(); if(!res.ok) throw new Error(json.error||'Import failed'); serverMaterialsLoaded=false; window.adminCoaSelectedProject=project; document.getElementById('adminImportMsg').innerHTML=`<div class="notice success">Imported ${json.added?.length||0} COA file(s) as review rows. Edit them before making active.</div>`; setTimeout(()=>renderAdminCoa(),900);}catch(e){document.getElementById('adminImportMsg').innerHTML=`<div class="notice">${esc(e.message)}</div>`;}finally{btn.disabled=false; btn.textContent='Import Selected COAs';}
  };
}
function setupAdminMaterialForm(){
  const save=document.getElementById('adminMatSaveBtn'); if(!save)return;
  document.getElementById('adminMatCancelBtn').onclick=()=>renderAdminCoa();
  save.onclick=async()=>{
    const body={id:val('adminMatId'),project:val('adminMatProject'),component:val('adminMatComponent'),mfr:val('adminMatMfr'),prodName:val('adminMatProd'),description:val('adminMatDesc'),color:val('adminMatColor'),batch:val('adminMatBatch'),mfgDate:val('adminMatMfg'),expDate:val('adminMatExp'),shelfLife:val('adminMatShelf'),itemNo:val('adminMatItem'),fileName:val('adminMatFile'),disabled:val('adminMatStatus')==='disabled'};
    try{await adminFetch('/api/admin/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); serverMaterialsLoaded=false; window.adminCoaSelectedProject=body.project; document.getElementById('adminMatMsg').innerHTML='<div class="notice success">Material saved. Active materials are available to the PIR helper for that job.</div>'; setTimeout(()=>renderAdminCoa(),700);}catch(e){document.getElementById('adminMatMsg').innerHTML=`<div class="notice">${esc(e.message)}</div>`;}
  };
}


function router(){const h=location.hash||'#/'; if(h.startsWith('#/admin')) adminView(); else if(h.startsWith('#/weekly-sign/')) weeklySignForm(decodeURIComponent(h.split('/').pop())); else if(h.startsWith('#/weekly-safety')) weeklySafetyForm(); else if(h.startsWith('#/dwl')) dwlForm(); else if(h.startsWith('#/daily-equipment')) dailyEquipmentForm(); else if(h.startsWith('#/dsif')) dsifForm(); else if(h.startsWith('#/pir')) pirForm(); else if(h.startsWith('#/mewp')) mewpForm(); else if(h.startsWith('#/bill-of-lading')) bolForm(); else if(h.startsWith('#/incident-report')) incidentReportForm(); else if(h.startsWith('#/heavy-accident-report')) heavyAccidentReportForm(); else if(h.startsWith('#/disciplinary-report')) disciplinaryReportForm(); else home();}

window.addEventListener('beforeprint',()=>{
  const h=location.hash||'#/';
  if(h.startsWith('#/pir') && document.getElementById('pirProject')) { const data=collectPir(); document.title=formSaveTitle('pir', data.reportDate, data.project); buildPirPrint(data); }
  if(h.startsWith('#/mewp') && document.getElementById('mewpJobName')) { const data=collectMewp(); document.title=formSaveTitle('mewp', data.inspectionDate, data.jobName); buildMewpPrint(data, localPhotoFiles('mewpPhotos')); }
  if(h.startsWith('#/daily-equipment') && document.getElementById('dailyProject')) { const data=collectDailyEquipment(); document.title=formSaveTitle('daily', data.date, data.project); buildDailyEquipmentPrint(data); }
  if(h.startsWith('#/dsif') && document.getElementById('dsifProject')) { const data=collectDsif(); document.title=formSaveTitle('dsif', data.reportDate, data.project); buildDsifPrint(data); }
  if(h.startsWith('#/dwl') && document.getElementById('dwlProject')) { const data=collectDwl(); document.title=formSaveTitle('dwl', data.reportDate, data.project, data.crew || crewValue('dwlCrew')); buildDwlPrint(data); }
  if(h.startsWith('#/bill-of-lading') && document.getElementById('bolProject')) buildBolPrint();
  if(h.startsWith('#/incident-report') && document.getElementById('irProject')) buildIncidentPrint();
  if(h.startsWith('#/heavy-accident-report') && document.getElementById('harProject')) buildHeavyAccidentPrint();
  if(h.startsWith('#/disciplinary-report') && document.getElementById('drProject')) buildDisciplinaryPrint();
});
window.addEventListener('hashchange',router); router();
