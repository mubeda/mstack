Review of orders/parsing.py

1. parse_quantity accepts negative quantities: parse_quantity("-2") returns -2, so an order can have a negative line. It should reject values below zero.
