# JAGD Architecture Map

Last verified: 2026-08-17

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
