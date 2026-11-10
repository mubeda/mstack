import smtplib

def send(to, body):
    with smtplib.SMTP("localhost") as s:
        s.sendmail("app@example.com", [to], body)
