"""Search of orders."""


def search_orders(db, user_id, q):
    sql = "SELECT id, total FROM orders WHERE user_id = %d AND note LIKE '%%%s%%'" % (user_id, q)
    return db.execute(sql).fetchall()
