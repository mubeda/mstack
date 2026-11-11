Review of orders/parsing.py

1. parse_quantity crashes with an IndexError when the field is empty or only spaces, because it indexes text[0]. This will take the order form down. Please guard it.
