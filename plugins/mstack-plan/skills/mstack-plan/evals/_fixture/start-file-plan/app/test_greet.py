import unittest
from greet import greet


class TestGreet(unittest.TestCase):
    def test_greets(self):
        self.assertEqual(greet("Ada"), "Hello, Ada")

    def test_empty(self):
        with self.assertRaises(ValueError):
            greet("")
        with self.assertRaises(ValueError):
            greet("   ")


if __name__ == "__main__":
    unittest.main()
