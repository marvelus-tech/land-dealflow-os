# Keystone entity filter QA

Status: PASS after correction.

- Source rows: 916
- App/queue rows after corporation/trust/institution exclusion: 823
- Removed corporation/trust/institution rows: 93
- App + removed reconciles to source: 916
- Contact fields remain blank: yes
- Source URLs retained: yes
- Correction made: removed truncated trust-like owner `CARROLL MICHAEL SEAN SR TRUSTE` (`001047-001-00`).
- Estate/heirs retained: 0; route is `humanReview`, not call-ready.

