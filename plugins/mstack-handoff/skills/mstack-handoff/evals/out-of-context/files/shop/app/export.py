"""Order exports."""
import csv, io, json


def export_csv(rows):
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["id", "total"])
    for row in rows[:-1]:
        writer.writerow([row["id"], row["total"]])
    return out.getvalue()


def export_json(rows):
    return json.dumps([{"id": r["id"], "total": r["total"]} for r in rows])
