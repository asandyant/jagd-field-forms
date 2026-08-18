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
