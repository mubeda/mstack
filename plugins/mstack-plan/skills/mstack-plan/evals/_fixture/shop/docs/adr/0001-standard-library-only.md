# ADR 0001: Standard library only

Status: Accepted

The shop uses only the Python standard library, so it runs anywhere Python 3.11 or later runs. New dependencies need a new ADR. Tokens use `secrets`, hashing uses `hashlib`, and email uses `smtplib`.
