# JAGD Architecture Map

Last verified: 2026-08-18

## Field Forms
- Local repo: `C:\Users\asand\Downloads\jagd-field-forms`
- Live: `https://forms.jagdapps.com`
- GitHub: `https://github.com/asandyant/jagd-field-forms`
- Server entry: `server.js`
- Browser static root: `public\`
- LIVE browser JS: `public\app.js`
- LIVE browser CSS: `public\styles.css`
- LIVE HTML: `public\index.html`
- Root `app.js` is NOT the browser-served Forms JS.

## Portal
- Local repo: `C:\Users\asand\Downloads\jagd-launchable`
- Live: `https://portal.jagdapps.com`
- GitHub: `https://github.com/asandyant/jagd-cert-portal`
- Server entry: `server.js`
- Browser static root: `public\`
- LIVE browser JS: `public\app.js`
- LIVE browser CSS: `public\styles.css`
- LIVE HTML: `public\index.html`

## DWL production-sensitive rules
- Portal is source of truth for active worker names, class/local/job.
- Forms worker feed: `/api/workers` -> Portal `/api/forms/active-workers`.
- DWL last crew server store: `DATA_DIR/dwl-last-crews.json`. Project is the required safety boundary; Crew is optional. The store keeps a Project-level latest crew and, when Crew is selected, a Project + Crew copy. Older Project + Crew records remain readable through project-history fallback. Saved crew entries now include stable Portal worker IDs plus names so legal-name changes do not break reloads.
- DWL field UI supports up to 80 worker rows after 2026-08-09 patch.
- Do not casually alter DWL payroll math, Portal sync, PDF layout, revision behavior, Day/Night rules, or Save/Share workflow while fixing unrelated features.
- DWL Class is Portal-populated by default but is intentionally editable per DWL. A field/foreman can temporarily override Class (for example JM -> FM) for that specific job/day without changing the worker's permanent Portal profile. Save validation must preserve the Class override for the selected Portal worker. Local remains Portal-controlled and is refreshed from the worker record on save.

## Deployment rule
Verify `server.js` static path before patching. Anthony prefers one Windows CMD chain using `&&`.


## T&M / Receipts integration (2026-08-11)

- `Receipts` remains the master receipt archive.
- Existing active T&M projects in Forms define which jobs auto-route into T&M Billing.
- A receipt/reimbursement submitted to an active T&M project is kept in Receipts and auto-linked to a T&M billing record.
- Receipt correction/reassignment re-evaluates T&M routing automatically.
- Receipt mistake removal is soft-delete with audit history; normal lists hide removed items.
- Portal Admin/Office has a `T&M Billing` control-center view using Forms sync-token proxy routes.
- Old Forms T&M records remain readable so the existing tracker history is preserved during migration.

## DWL legal-name PDF rule (2026-08-18)
- Employee legal names must never be shortened with `...` / ellipsis or clipped in the official DWL PDF.
- Normal employee names keep the approved large DWL font.
- Only an Employee cell whose full legal name is too wide is auto-fitted using actual text width.
- Very long multi-part legal names use a balanced two-line fallback inside the same worker row rather than shrinking the entire DWL or changing row height.
- This applies to both the primary jsPDF DWL save path and the browser-print fallback.
- Do not change payroll fields, row heights, Local/Class behavior, Day/Night logic, Portal sync, or the rest of the PDF layout when adjusting name fitting.

## DWL exact Portal PDF sync (2026-08-18)
- The jsPDF produced by `saveDwlDirectPdf()` is the single official DWL PDF source of truth.
- Save flow stages that PDF first through `/api/dwl/generated-pdf`; only after staging does the browser call `/api/dwl/portal-sync` with the generated PDF ID.
- Forms server reads the exact staged bytes and forwards them to Portal as `originalPdfBase64` with the same DWL data payload. Portal can therefore store the exact file that the field user then downloads/shares/texts/Dropbox-saves.
- Do not start Portal sync before the official PDF exists; otherwise Portal can fall back to a separately rendered document that does not match the field copy.
- If jsPDF is unavailable and the browser-print fallback is used, the existing data-only Portal sync remains as a safety fallback. Exact PDF matching is guaranteed only when the normal official jsPDF path succeeds.
- Field PDF save/share must still succeed even if Portal sync fails. Portal failure remains an Office-review/manual-upload condition and must never block the field from receiving the PDF.


## 2026-08-18 — DWL exact-PDF staging hotfix
- Live test after the exact-PDF source-of-truth deployment showed newly saved DWLs could disappear from Portal review entirely.
- Root cause: jsPDF 2.5.1 `output('datauristring')` may include metadata such as `;filename=...;base64,`, while the client/server staging parser only accepted the narrower `data:application/pdf;base64,` prefix. When staging failed, the desktop fallback saved the field PDF but skipped Portal sync because Portal sync lived after the staging request inside the same try block.
- Client `base64FromDataUrl()` now strips any PDF data-URI metadata before `;base64,`; server `/api/dwl/generated-pdf` accepts the same valid form.
- Safety rule strengthened: exact-PDF staging can never be allowed to suppress the DWL data sync. If staging fails, Forms now immediately performs a data-only Portal sync before saving the local PDF. The Office record therefore remains visible even if the exact source-PDF attachment needs follow-up/manual upload.
- Normal successful path is unchanged: stage official jsPDF -> sync DWL plus exact staged bytes -> save/share the same official PDF.
- 2026-08-21 DWL PDF multiline notes fix: official portrait PDF keeps the same one-page 142pt Work Performed section budget but dynamically reallocates height among Description / Additional Notes / Safety Topic and auto-fits multiline body text down to a safe minimum font. This prevents long pasted Additional Notes (e.g. hazardous-waste weight logs) from printing only the first line/date while preserving the worker table and one-page DWL layout.



### 2026-08-21 — DWL Ironworker / Double-Time shift rules
- Removed the field-level **All OT** and **10% Differential** night-pay choices. The DWL now asks only **Day Shift** or **Night Shift**.
- The PDF/print header prominently labels **DAY SHIFT** or **NIGHT SHIFT**; vague office pay-instruction banners were removed.
- Ironworker Locals **11, 40, 361** use the normal split: first 8 hours base, next 2 overtime, hours over 10 double time. On Night Shift the base column is labeled **10%** instead of Straight.
- Night Shift shows a compact **Double** column immediately after Over. Day Shift keeps the existing field table clean; Double appears on the saved PDF only when a rule actually produces Double hours.
- The rare daytime IW rule (day crew has an IW night crew) is supported internally via `iwDayNightCrewRule` but deliberately has no field checkbox; it is reserved for a later Office-only payroll adjustment.
- Painter double time is restricted to the user-specified actual holidays: New Year’s Day, Memorial Day, July 4, Labor Day, Thanksgiving, and Christmas. Existing Portal worker trade metadata is used to identify painters.
- Existing DWL one-page PDF geometry, 20-row pagination, long-name fitting, Class override, Local protection, PT/RT, No Lunch, multiline notes, Load Last Crew, revisioning, exact Portal PDF sync, and Save/Share paths were preserved.


### 2026-08-21 DWL IW daytime Double live recalculation hotfix
- IW Locals 11/40/361 now split the field-entered hours-after-8 value on both Day and Night: max 2 hours Over, remainder Double.
- On Day Shift the Double column remains hidden until an IW row actually calculates Double, then it appears without changing unrelated DWLs.
- Example: Straight 8 + Over 3 becomes Straight 8 / Over 2 / Double 1 on blur/change.
- Editing Over clears the prior calculated Double first, so re-entry recalculates deterministically.
- Night Shift still always shows the Double column. Existing PDF/save payroll normalization remains unchanged.
## 2026-08-21 DWL night Ironworker correction
- Night Ironworkers are Locals 11, 40, and 361. The 10%/Straight column is not used for their night hours.
- Normal night IW rule: first 8 hours go to Over (time-and-a-half); hours after 8 go to Double. Example: entering 10 total night IW hours in Over resolves to Over 8 / Double 2.
- Night Double remains editable so legitimate all-Double situations such as Sunday Ironworker work can be entered directly. Day Double remains rule-calculated/read-only.
- Saved night DWL filenames now include `NIGHT`; day filenames remain unchanged.
- This patch does not alter one-page PDF geometry, legal-name auto-fit, Class override, No Lunch/PT/RT, multiline notes, Load Last Crew, exact Portal PDF sync, revisions, or Save/Share behavior.


### 2026-08-21 — DWL night Ironworker 10% guardrail
- Night Shift + Ironworker Local 11/40/361: the 10%/Straight entry cell is disabled because night Ironworkers do not receive the 10% differential.
- If hours were entered in 10% before the row became identified as an Ironworker, those hours are automatically migrated into Over and the existing night IW split applies: first 8 Over, hours after 8 Double.
- Double remains editable on Night Shift for valid all-Double situations such as Sunday Ironworker work.
- Guard is re-applied immediately when the Portal worker/local is populated, reducing field-entry error risk.


### 2026-08-23 — DWL trade-aware Ironworker detection + Painter Saturday OT
- Corrected Ironworker detection so Locals 11/40/361 are **not** sufficient by themselves. Ironworker payroll rules now require both an Ironworker trade value from the Portal worker record and one of those IW locals. This prevents Painter Local 11 (including Connecticut) from being misclassified as Ironworker.
- The same trade-aware check is used by live field guardrails, including night 10% blocking, Over-to-Double splitting, and manual night Double handling.
- Painter Saturday rule is explicit: all Saturday hours are time-and-a-half (Over), with no Double. If the date is one of the six configured Painter holidays, the holiday Double rule takes precedence even when it falls on a Saturday.
- Example: Painter Local 11 on Saturday with 11 total hours -> Straight 0 / Over 11 / Double 0. Ironworker Local 11 with 11 daytime hours remains 8 Straight / 2 Over / 1 Double.
- Existing night IW rules, Painter holiday rules, one-page PDF layout, exact Portal PDF sync, multiline notes, Class override, long-name fit, Load Last Crew, revisioning, and Save/Share behavior remain unchanged.


## 2026-08-24 — DWL Load Last Crew isolation
- `Load Last Crew` is scoped to **Project + Foreman / Field Person**; optional Crew narrows it further.
- Multiple foremen can submit separate DWLs on Warehouse / 8 Bridges / other shared jobs without loading another person's crew.
- There is intentionally no fallback to a project-wide latest crew. If a person has never saved a crew on that project, the UI says no previous crew was found for that person.
- Foreman / Field Person must be entered before Load Last Crew. Crew remains optional.
- Cross-device server storage uses v2 preparer-scoped keys; localStorage uses matching v2 keys. Existing old project-wide caches are not reused because they cannot be safely attributed to a person.
