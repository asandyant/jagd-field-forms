# JAGD Field Forms v55 - Admin Worker/COA List Restore

Fixes admin DWL Names / Workers and COA Materials visibility.

## Changes
- Admin DWL Names now falls back to the built-in active worker list if the server worker store is empty.
- Admin DWL Names shows the full worker list by default.
- Search box acts like the DWL employee search: start typing a name to filter instantly.
- Edit button remains next to each worker.
- Add Worker form includes class/local/current job/status/employee id/trade/crew.
- Server material store now seeds from built-in GWB and Dyre COA libraries if empty.
- COA Materials admin list now includes built-in GWB and Dyre COAs, plus imported/admin-added COAs.
- COA job filter now understands project dropdown names like GWB Cables and C35311 - Dyre Ave. Line.
- Built-in COAs show as Built-in / Active and can be copied/edited into an admin record.

No DWL layout, PIR print, Weekly, or extra-form layout changes were made.
