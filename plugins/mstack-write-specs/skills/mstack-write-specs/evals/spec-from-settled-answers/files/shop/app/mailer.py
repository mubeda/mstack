"""Outgoing email. Uses the SMTP relay configured in SHOP_SMTP_HOST."""
import os, smtplib
from email.message import EmailMessage

def send_email(to, subject, body):
    msg = EmailMessage()
    msg["To"], msg["From"], msg["Subject"] = to, "no-reply@shop.example", subject
    msg.set_content(body)
    with smtplib.SMTP(os.environ.get("SHOP_SMTP_HOST", "localhost")) as s:
        s.send_message(msg)
