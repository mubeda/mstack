"""User records, keyed by email."""
USERS = {}

def find_user(email):
    return USERS.get(email.strip().lower())
