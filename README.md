# JAGD Field Forms

Version v19 adds Daily Work Log with the exported active worker CSV embedded for employee autocomplete.

Current forms:
- Paint Inspection Report
- MEWP Daily Inspection
- Daily Equipment Inspection
- Daily Safety Inspection Form
- Weekly Safety Meeting
- Daily Work Log

Daily Work Log notes:
- Uses `/public/data/active-workers.json` generated from `jagd-active-workers-2026-06-13.csv`.
- Employee fields autocomplete from active workers.
- Selecting an exact worker auto-fills Class and Local.
- If a worker is not found, the field user can keep typing manually and fill Class/Local manually.
- Report Date auto-fills today, Day auto-fills from date.
- Weather can auto-fill from browser location with manual override.
- Crew dropdown has Crew 1 through Crew 7 plus Other.
- PDF title format is `DWL_MM.DD.YY_Project_Name`.
