"""Parse order form fields."""


def parse_quantity(text):
    text = text.strip()
    if not text:
        raise ValueError("quantity is required")
    return int(text)


def parse_price(text):
    text = text.strip()
    if not text:
        raise ValueError("price is required")
    return round(float(text), 2)
