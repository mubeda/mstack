import unittest
from tags import normalize_tags
class TagsTest(unittest.TestCase):
    def test_keeps_first_seen_order(self):
        self.assertEqual(normalize_tags(["Beta", "alpha", "beta"]), ["beta", "alpha"])
if __name__ == "__main__":
    unittest.main()
