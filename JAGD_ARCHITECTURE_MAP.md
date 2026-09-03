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


### 2026-08-23 — DWL trade-aware Ironworker detection + Painter Saturday OT (Saturday portion superseded 2026-08-26)
- Corrected Ironworker detection so Locals 11/40/361 are **not** sufficient by themselves. Ironworker payroll rules now require both an Ironworker trade value from the Portal worker record and one of those IW locals. This prevents Painter Local 11 (including Connecticut) from being misclassified as Ironworker.
- The same trade-aware check is used by live field guardrails, including night 10% blocking, Over-to-Double splitting, and manual night Double handling.
- Historical rule only (superseded 2026-08-26): painters were previously forced to all Over on Saturday. Do not restore this blanket Saturday rewrite.
- The trade-aware Ironworker example remains valid: Ironworker Local 11 with 11 daytime hours resolves to 8 Straight / 2 Over / 1 Double under the existing IW rule.
- Existing night IW rules, Painter holiday rules, one-page PDF layout, exact Portal PDF sync, multiline notes, Class override, long-name fit, Load Last Crew, revisioning, and Save/Share behavior remain unchanged.


## 2026-08-24 — DWL Load Last Crew isolation
- `Load Last Crew` is scoped to **Project + Foreman / Field Person**; optional Crew narrows it further.
- Multiple foremen can submit separate DWLs on Warehouse / 8 Bridges / other shared jobs without loading another person's crew.
- There is intentionally no fallback to a project-wide latest crew. If a person has never saved a crew on that project, the UI says no previous crew was found for that person.
- Foreman / Field Person must be entered before Load Last Crew. Crew remains optional.
- Cross-device server storage uses v2 preparer-scoped keys; localStorage uses matching v2 keys. Existing old project-wide caches are not reused because they cannot be safely attributed to a person.

## 2026-08-26 — DWL Saturday manual hours for Painter / general rows
- Removed the automatic **Painter Saturday = all Over** rewrite. A Saturday report date by itself no longer changes field-entered Straight/Over hours for Painter or general/non-Ironworker rows.
- Field users are responsible for entering Saturday hours in the correct **Straight / Over** columns based on the worker's actual agreement. This supports cases such as drivers or other workers who may legitimately receive Straight time on Saturday.
- Existing Painter holiday Double rules remain unchanged: New Year's Day, Memorial Day, July 4, Labor Day, Thanksgiving, and Christmas still force Painter holiday hours to Double when the report date is that holiday.
- **Ironworker rules are intentionally untouched.** Trade-aware IW detection still requires Trade = Iron Worker plus Local 11/40/361. Day IW remains first 8 Straight, next 2 Over, over 10 Double; Night IW remains first 8 Over, after 8 Double, including existing manual Night Double support for legitimate all-Double situations.
- No PDF geometry, Day/Night UI, Class/Local protection, PT/RT, No Lunch, multiline notes, Load Last Crew, revisioning, exact Portal PDF sync, or Save/Share behavior changed in this patch.


## 2026-08-26 — Receipt Textract vendor + card-last-4 hardening
- Receipts remain AWS Textract based. `AnalyzeExpense` is still the primary parser; this is not a return to browser/local OCR.
- Fixed vendor extraction accepting one-letter garbage such as `R`. Vendor names now pass a plausibility/sanity layer, normalize obvious repeated names (for example `Speedway Speedway` -> `Speedway`), and recognize strong merchant text such as `THE HOME DEPOT` from Textract document text.
- Fixed company-card last-four extraction. `AnalyzeExpense` responses are now scanned across all SummaryFields / labels / values / line-item fields instead of assuming a top-level `Blocks` array. Last-four matching accepts AMEX/American Express, card/account/ending/last-4 wording, and masked `XXXX` / `****` formats.
- When `AnalyzeExpense` returns a suspicious vendor or a company receipt has no card last four, Forms makes a second AWS Textract `AnalyzeDocument` pass and merges only missing/bad fields. Date/amount from the expense parser are preserved unless absent.
- Added token-protected `POST /api/forms/receipts/:id/reread` so Office can deliberately re-run AWS Textract on an existing private S3 receipt. Re-read updates parsed vendor/date/amount/card-last-4 and T&M receipt linkage without re-uploading the image.
- Portal receipt search already searches `parsed.cardLast4`; once a receipt is re-read/populated, searches such as `2222` work without a separate search-index change.


## 2026-08-26 — Receipts: Other / Company Expense
- Field Forms Receipts and Reimbursements now include a fixed `Other / Company Expense` job choice for fuel, company vehicles, office purchases, and other legitimate non-job expenses.
- The existing custom job/property/location field remains available for unusual one-off locations.
- Receipt records keep `jobId=other:company-expense` and `jobName=Other / Company Expense`, so Portal search/export can filter them consistently.
- This change builds on the AWS Textract vendor/card parsing hardening; receipt extraction remains AWS Textract based.

## 2026-08-26 — Receipt card-ending false-positive guard
- Live receipt re-read exposed a false AMEX ending: a Speedway receipt visibly showed a masked card ending in `2222`, but the parser saved `0801` from the EMV `AID ...0801` line.
- Root cause: the earlier card matcher allowed `AMERICAN EXPRESS` in the full Textract text to reach a later 4-digit EMV identifier across line breaks. Because AnalyzeExpense had already populated a false last-four, the AnalyzeDocument fallback could not replace it.
- Card-last-4 matching is now line-scoped and confidence-ordered: masked card number on the same line first, explicit card/ending label plus four digits on the same line second, or AMEX/card label followed immediately by a masked-number line.
- EMV / transaction identifiers such as AID, AUTH, REF, BATCH, SEQ, TRACE, APPROVAL, TERMINAL and merchant/store IDs are explicitly excluded from card-ending candidates.
- AnalyzeDocument may replace a conflicting AnalyzeExpense card ending when it finds a higher-confidence masked/explicit card ending. If Textract cannot read a real card ending, the field stays blank rather than saving an unrelated identifier.
- Existing Portal `Re-read Details` can be used on affected receipts after this Forms patch is live; no Portal code change is required for this correction.

## 2026-08-26 — Receipt card-last-4 Speedway line/Query recovery
- Follow-up live testing showed the false EMV/AID endings were correctly removed, but some Speedway AMEX receipts still returned a blank card ending even though the printed receipt visibly showed a masked number ending in `2222`.
- Root cause: the strict parser only accepted a conventional masked-number pattern. AWS Textract can omit or fragment the asterisks and return the four card digits as a standalone line immediately after `AMEX`; additionally, combining LINE and WORD blocks can disturb adjacency.
- AnalyzeDocument receipt parsing now uses Textract `LINE` blocks for receipt line order instead of mixing LINE/WORD text.
- Immediately after an `AMEX` / `American Express` / `Card` label, a mask/punctuation-only line or standalone four-digit line is accepted as the card ending only before AUTH/AID/REF/other transaction metadata. This remains deliberately position-scoped so random receipt numbers cannot become card endings.
- The same AnalyzeDocument call now includes an AWS Textract Query asking specifically for the last four digits of the payment/credit card. The Query result is used only if the direct masked/adjacent-line parser did not find a card ending.
- Existing false-positive exclusions remain in place. If neither direct receipt text nor the targeted AWS Query produces a usable ending, the field remains blank rather than guessing.

## 2026-08-26 - Receipt Textract vendor sanity fallback
- Receipt vendor extraction remains AWS Textract based.
- Obvious non-merchant tokens returned as `VENDOR_NAME` (including the observed `WENT`/single-letter-style garbage cases) are treated as low-confidence rather than accepted as a vendor.
- Low-confidence vendor output forces the existing AWS AnalyzeDocument fallback so strong full-header merchant text such as `THE HOME DEPOT` / `HOME DEPOT` can win.
- Existing AMEX/card-last-four protections remain unchanged; do not reintroduce AID/AUTH/REF false matches.


## 2026-08-26 — Receipt merchant fingerprint + Textract vendor Query fallback
- Receipt vendor extraction remains AWS Textract based; no browser/local OCR and no image-logo matching library was introduced.
- `AnalyzeDocument` now asks a targeted Textract Query for the merchant/business name in addition to the existing card-last-four Query. Query answers are resolved by Alias/relationship so merchant and card responses cannot be confused.
- Added a conservative merchant fingerprint layer over Textract text for common high-confidence brands. Home Depot can be recognized from `HOME DEPOT`, common OCR `H0ME DEP0T`, `homedepot.com`, `1-800-HOME-DEPOT`, or the receipt slogan `How doers get more done`, even when Textract returns a garbage `VENDOR_NAME` such as `R`/`WENT` from the stylized logo area.
- Initial fingerprints also normalize Speedway/Speedy Rewards, Lowe's, Wawa, Sunoco, Exxon/Mobil, Shell, 7-Eleven, Dunkin, and Starbucks when those brand strings are actually present in Textract text. Generic words never create a merchant match.
- Existing AMEX/card-last-four safeguards remain unchanged: AID/AUTH/REF/transaction IDs must never be promoted to card endings, and unreadable card endings remain blank rather than guessed.


## 2026-08-26 — Receipt batch received-vs-AWS status safeguard
- Field receipt batches now distinguish **photo receipt/storage** from **AWS detail reading**. A batch no longer says `9 of 10 read by AWS` in a way that can be mistaken for a missing upload.
- Every selected receipt is assigned a stable batch sequence number. Status shows `Receipt N of X` and one of `Ready`, `Reading`, `Needs Review`, or `NOT RECEIVED`.
- `Ready`, `Reading`, and `Needs Review` all mean the photo itself is already safely stored; only `NOT RECEIVED` means the field user must select that photo again.
- The batch summary explicitly shows `X of X receipts safely received` separately from `AWS details: ready / reading / needs review`. Field users may leave once all photos are safely received even if AWS is still processing.
- A genuinely failed upload remains visible by receipt number/original filename and instructs the user to re-select it before leaving. Polling no longer hides that upload failure.
- AWS detail extraction automatically retries once when Textract errors or cannot confidently read the required vendor + amount. After the retry, the photo remains stored and is marked `Needs Review` rather than being treated as a failed submission.


### 2026-08-31 — PIR print/PDF completeness regression fix
- Field Forms only; `public/styles.css`.
- PIR print section heights are constrained to fit inside one Letter page again.
- Clean-PDF capture is explicitly allowed to measure the full generated PIR instead of clipping fixed-height overflow.
- Top project/report information, filled PIR cells, caulking, QC/QCS signatures, and revision footer are protected from print/PDF clipping.
- Live phone/desktop data-entry layout and all non-PIR forms are unchanged.

### 2026-08-31 — PIR Testex photo capture + printer-safe page inset
- Field Forms PIR only; `public/app.js` + `public/styles.css`.
- Each of the three Testex Tape slots now accepts one camera/library photo with Replace/Remove controls; the selected photo prints inside the corresponding Profile Measurement/Testex box.
- The fixed PIR header no longer renders the redundant `Page: 1 of 1` cell that created an implicit third grid row and overlapped the `Profile Measurement` heading.
- PIR print/clean-PDF content is inset about 0.14 in inside Letter size so printers with larger non-printable edge margins (including office printers) do not clip the outer report border/content.
- No changes to PIR calculations, signatures, mixing/application logic, or any other Field Forms workflow.

- 2026-08-31 PIR Testex workflow: starts with 3 tape slots and supports + Add Another Testex Tape one at a time (up to 50). Testex photo selection opens a crop/rotate/zoom/drag editor so the tape can be made inspector-readable without stretching. Tapes 1-3 remain in the official PIR Profile Measurement area; Tape 4+ automatically print on attached Testex Tape Photos pages with location, reading, and notes.


### 2026-08-31 PIR extra Testex/Ambient print fix
- PIR Testex tapes 4+ are forced into explicit attachment print pages and included in clean PDF/browser print.
- PIR ambient readings now support up to 20 entries; first 4 stay on the official PIR page and readings 5+ print on Attached Ambient Conditions pages.
- Attached Pages header now reports generated Testex and Ambient attachment pages.

- 2026-09-01 Weekly Safety Meeting print safeguard: attendee PDF pagination is capped at 14 workers per printed Letter page instead of 18. This prevents rows/signatures at the bottom of page 1 from being clipped by browser/printer printable-height differences; meetings with 15+ attendees automatically generate page 2+ with repeated header/topic/table structure and continuous row numbering.

## 2026-09-03 — PIR QC report photo attachments + blank-extra print safeguard
- Field Forms PIR now has an optional `Report Photo Attachments` section at the bottom of the field questionnaire.
- QC can add report photos one at a time with `+ Add Photo`; each photo has its own optional Photo Note and can be removed before generating the report.
- Print/save inclusion is content-driven: a photo attachment prints only when it has an actual photo or a nonblank note. Unused blank photo controls do not create PDF pages.
- Each used report photo/note prints on its own Letter attachment page after the normal PIR generated pages. This deliberately avoids squeezing photos/notes into the main PIR and reduces clipping/cutoff risk in both browser print and clean-PDF capture.
- Extra Ambient Conditions remain content-driven: readings 5+ print only when at least one actual ambient field contains information. Merely opening extra blank ambient boxes does not create blank attachment columns/pages. The main PIR's existing four ambient columns remain unchanged.
- Existing Testex tape attachments, Additional Mix/Application pages, Additional QC Notes page rules, signatures, and main PIR layout remain unchanged.
