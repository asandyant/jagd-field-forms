# JAGD Field Forms v64

DWL-only emergency fix.

- Keeps the clean jsPDF DWL PDF generation.
- Changes the save behavior to match the original boss DWL: `pdf.save(...)` directly.
- Removes the popup/blob viewer behavior that was not acting right on phones.
- Avoids Safari/iPhone browser print footer/page count junk.
- Does not touch PIR, Weekly, Admin, COA, or portal work.
