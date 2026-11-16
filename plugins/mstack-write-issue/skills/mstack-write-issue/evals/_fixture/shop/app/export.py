"""Export of orders as CSV."""
import csv
import io


def export_csv(query):
    rows = list(query.all())
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["id", "customer", "total"])
    for row in rows:
        writer.writerow([row.id, row.customer, row.total])
    return out.getvalue()
