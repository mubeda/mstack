"""Sign-in and sessions."""
import hashlib, secrets, time

SESSION_TIMEOUT_MINUTES = 30
_sessions = {}

def hash_password(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000).hex()

def sign_in(user, password):
    if hash_password(password, user["salt"]) != user["password_hash"]:
        return None
    token = secrets.token_urlsafe(32)
    _sessions[token] = (user["email"], time.time())
    return token

def session_user(token):
    entry = _sessions.get(token)
    if not entry or time.time() - entry[1] > SESSION_TIMEOUT_MINUTES * 60:
        return None
    return entry[0]
