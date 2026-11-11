"""CSV export of orders."""
import csv
import io
import os

BATCH_SIZE = 200


def export_v2_enabled():
    return os.environ.get("EXPORT_V2") == "1"


def export_csv(rows):
    if not export_v2_enabled():
        raise RuntimeError("the CSV export is behind the EXPORT_V2 flag")
    out = io.StringIO()
    writer = csv.writer(out)
    for start in range(0, len(rows), BATCH_SIZE):
        writer.writerows(rows[start:start + BATCH_SIZE])
    return out.getvalue()
