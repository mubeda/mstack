import unittest

from parsing import parse_price, parse_quantity


class ParsingTest(unittest.TestCase):
    def test_quantity(self):
        self.assertEqual(parse_quantity(" 3 "), 3)

    def test_empty_quantity(self):
        with self.assertRaises(ValueError):
            parse_quantity("  ")

    def test_price(self):
        self.assertEqual(parse_price("4.5"), 4.5)


if __name__ == "__main__":
    unittest.main()
