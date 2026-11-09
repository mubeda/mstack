import os, sys, unittest
sys.path.insert(0, os.path.dirname(__file__))
import auth


class SignInTest(unittest.TestCase):
    def test_wrong_password_returns_none(self):
        salt = b"salt"
        user = {"email": "a@example.com", "salt": salt, "password_hash": auth.hash_password("right", salt)}
        self.assertIsNone(auth.sign_in(user, "wrong"))

    def test_right_password_returns_session(self):
        salt = b"salt"
        user = {"email": "a@example.com", "salt": salt, "password_hash": auth.hash_password("right", salt)}
        token = auth.sign_in(user, "right")
        self.assertEqual(auth.session_user(token), "a@example.com")


if __name__ == "__main__":
    unittest.main()
