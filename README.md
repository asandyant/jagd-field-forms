# JAGD Field Forms

Web-based field forms for JAGD Construction.

## Forms included

- PIR Questionnaire: mobile-friendly questionnaire that generates a printable Paint Inspection Report layout.
- MEWP Daily Equipment Inspection: separate MEWP checklist form using the same field-form style as the existing Daily Equipment Inspection workflow, with photo uploads and printable output.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:10000

## Deploy on Render

This repo includes `render.yaml` with a persistent disk for saved submissions and uploaded photos.

Recommended subdomain:

`forms.jagdapps.com`

## Notes

The PIR printable output is built to match the one-page PIR sample structure: project info, hold points, surface cleanliness/profile, instruments, ambient conditions, mixing/application, caulking, and signatures.


## v9 polish
- Cleaned up PIR print header spacing.
- Slightly reduced logo/header height.
- Made Hold Point list and Surface Cleanliness area easier to read.
- Kept one-page print layout and mobile-friendly web form.
