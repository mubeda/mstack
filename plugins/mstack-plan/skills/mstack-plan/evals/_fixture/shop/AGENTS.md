# AGENTS.md

- Standard library only (see docs/adr/0001-standard-library-only.md).
- Tests live next to the code as `app/test_*.py`. Run `python3 -m unittest discover -s app` before every commit; it must pass.
- Never open a real SMTP connection in tests.
