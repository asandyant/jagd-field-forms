# VN84-B V20 Contract Production Model

Built July 22, 2026.

## Major changes
- Rebuilt field tracking around contract items and item-specific workflows.
- Preserved official PRDCO1 Areas A through E and colors.
- Corrected Belt Parkway Tangent bearings to 230 total: Abutment 10, SP1 20, SP2 20, SP3-SP12 18 each.
- Changed bearing workflow to Prep for Bearing Removal (50%) and Faying Surfaces (50%).
- Added Blast, Zinc, Midcoat, Stripe Coat, Finish workflow for blast-and-paint items.
- Added dedicated KEIM, access-platform, localized-paint-removal, holes, and steel-repair workflows.
- Moved Jacking Locations from Area C to Area D.
- Archived Emergency Steel Repairs and removed it from navigation while preserving its records and APIs.
- Field page contains production quantities and percentages only; payment values remain on the password-protected office dashboard.
- Added migration aliases so legacy stage entries are carried into the V20 workflow.
- Progress values are clamped to each item's quantity and percentages are capped at 100%.

## Verification performed
- JavaScript syntax checks passed for server, VN84B route, field app, and office app.
- Local server startup passed.
- `/api/vn84b` returned V20 data.
- Bearing total and subarea total both verified at 230, ending at SP12.
- Jacking verified in Area D.
- Emergency Steel Repairs verified archived.
- Progress save verified and an over-limit entry was clamped correctly.
- Backup export verified.
