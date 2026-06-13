# JAGD Field Forms

Field-friendly form library for JAGD Construction.

Forms included:

- Paint Inspection Report (PIR): questionnaire-style web form that prints to a one-page PIR layout.
- MEWP Daily Inspection: separate MEWP inspection checklist with photos, notes, and signature.
- Daily Equipment Inspection: embedded existing JAGD daily equipment inspection source/form from `https://jagdconstruction.github.io/daily_equipment_inspection/`.

Current workflow: fill out in the field, use Save PDF / Print, then text/email/send to Dropbox from the phone. No permanent Render saving is used for field records in this demo.

PIR report number rule: the inspection report number auto-fills from the date. Example: `10/02/2026` -> `100226`.

Suggested PDF filename/title format:

- `PIR - MM-DD-YY - Project Name`
- `MEWP - MM-DD-YY - Project Name`

Project/job dropdowns are shared across PIR and MEWP. The original Daily Equipment Inspection retains its own PM-built project dropdown and Save PDF behavior.
