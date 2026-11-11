"""Orders, keyed by order ID. Staff mark an order shipped from the admin page, which calls mark_shipped."""
ORDERS = {}  # order ID -> {"email": str, "items": [str], "status": "paid" or "shipped", "tracking": str or None}


def mark_shipped(order_id, tracking=None):
    order = ORDERS[order_id]
    order["status"] = "shipped"
    order["tracking"] = tracking
    return order
