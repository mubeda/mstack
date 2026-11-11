# Export flag

- 2026-11-03: The user decided the export ships behind the flag `EXPORT_V2` until the load test passes, because an unbounded export took the staging database down in October.
- 2026-11-03: As of shop@COMMIT, `export_csv` in `app/export.py` raises unless `EXPORT_V2` is set to 1.
