import os, sys, unittest
sys.path.insert(0, os.path.dirname(__file__))
import export


class ExportTest(unittest.TestCase):
    def test_header(self):
        self.assertTrue(export.export_csv([]).startswith("id,total"))


if __name__ == "__main__":
    unittest.main()
