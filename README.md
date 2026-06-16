# JAGD Field Forms - v50 Admin Foundation

## Checkpoint
v50 adds the first Admin Dashboard foundation.

## What changed
- Added an Admin Dashboard card on the home page.
- Added temporary Admin PIN login. Default PIN: `2468` unless `ADMIN_PIN` or `ADMIN_PASSWORD` is set in Render.
- Added form-generated logging when users tap Save PDF / Print.
- Added Admin Job Tracker with separate Daily Folder and Weekly Folder views per job.
- Daily folder includes DWL, PIR, MEWP, Daily Equipment, DSIF, BOL, Incident, Heavy Accident, and Disciplinary reports.
- Weekly folder includes Weekly Safety Meetings / Toolbox Talks.
- Added DWL Names admin placeholder for the next build.
- Added COA Materials admin placeholder showing current GWB and Dyre Ave library counts.

## Important
This tracker logs forms generated in the app. It does not yet confirm that a PDF was uploaded to Dropbox.

## Test URLs
- Home: https://forms.jagdapps.com/?v=50
- Admin: https://forms.jagdapps.com/#/admin?v=50

## Admin PIN
Temporary default: 2468
Set `ADMIN_PIN` in Render environment variables before showing the boss if you want a different PIN.
