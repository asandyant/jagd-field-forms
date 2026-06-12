# JAGD Field Forms

Web-based field forms for JAGD Construction.

## Forms included

- PIR Questionnaire
- MEWP Daily Equipment Inspection

## v11 updates

- Form library home screen is ready for adding more forms later.
- PIR Inspection Report # auto-fills from the report date in MMDDYY format.
  - Example: 10/02/2026 becomes 100226.
- Saved records use the form name followed by the form date.
  - Example: PIR - 10-02-26
  - Example: MEWP - 10-02-26
- Print-to-PDF title is also set to the form name and date when possible.
- MEWP print preview includes current image attachments when printing from the form.

## Local run

```bash
npm install
npm start
```

Open http://localhost:10000

## Render

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```
