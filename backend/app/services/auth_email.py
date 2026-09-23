import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import CLIENT_URL, EMAIL_PASS, EMAIL_USER


def _send_email(to: str, subject: str, html: str) -> None:
    if not EMAIL_USER or not EMAIL_PASS:
        raise RuntimeError("Email service not configured")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, [to], msg.as_string())


def send_reset_email(email: str, token: str) -> None:
    link = f"{CLIENT_URL}/reset-password?token={token}"
    html = f"<p>Reset your password: <a href=\"{link}\">{link}</a></p>"
    _send_email(email, "SumItUp Password Reset", html)


def send_verification_email(email: str, token: str) -> None:
    link = f"{CLIENT_URL}/verify-email?token={token}"
    html = f"<p>Verify your email: <a href=\"{link}\">{link}</a></p>"
    _send_email(email, "SumItUp Email Verification", html)


def send_email(to: str, subject: str, html: str) -> None:
    _send_email(to, subject, html)
