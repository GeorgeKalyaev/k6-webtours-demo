#!/usr/bin/env python3
"""
Одно письмо через SMTP Яндекса (для проверки учётки и доставки).
Не коммить пароли. Только переменные окружения или .env локально.

Требования: Python 3.9+

Переменные окружения:
  YANDEX_SMTP_USER   — полный ящик отправителя, например you@yandex.ru
  YANDEX_SMTP_PASSWORD — пароль приложения (не обычный пароль от почты)
  SMTP_TO            — получатель (по умолчанию из аргумента или тот же, что USER)

Пример (PowerShell):
  $env:YANDEX_SMTP_USER="you@yandex.ru"
  $env:YANDEX_SMTP_PASSWORD="xxxxxxxx"
  python scripts/send_smtp_yandex.py recipient@yandex.ru

Документация Яндекса: включить IMAP/SMTP и создать «Пароль приложения».
"""

from __future__ import annotations

import argparse
import os
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime, timezone

YANDEX_SMTP_HOST = "smtp.yandex.ru"
YANDEX_SMTP_PORT = 465  # SSL


def main() -> None:
    parser = argparse.ArgumentParser(description="Send one email via Yandex SMTP")
    parser.add_argument(
        "to",
        nargs="?",
        default=os.environ.get("SMTP_TO"),
        help="Recipient email (or set SMTP_TO)",
    )
    parser.add_argument(
        "--subject",
        default=None,
        help="Subject line (default: auto)",
    )
    args = parser.parse_args()

    user = os.environ.get("YANDEX_SMTP_USER", "").strip()
    password = os.environ.get("YANDEX_SMTP_PASSWORD", "")
    to_addr = (args.to or "").strip()

    if not user or not password:
        raise SystemExit(
            "Задай YANDEX_SMTP_USER и YANDEX_SMTP_PASSWORD (пароль приложения Яндекса)."
        )
    if not to_addr:
        raise SystemExit("Укажи получателя: аргументом или SMTP_TO.")

    subject = args.subject or (
        f"k6-webtours-demo SMTP test {datetime.now(timezone.utc).isoformat(timespec='seconds')}"
    )
    body = (
        "Тестовое сообщение из скрипта scripts/send_smtp_yandex.py\n"
        f"UTC: {datetime.now(timezone.utc).isoformat()}\n"
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_addr
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(YANDEX_SMTP_HOST, YANDEX_SMTP_PORT, context=context) as smtp:
        smtp.login(user, password)
        smtp.send_message(msg)

    print(f"OK: sent to {to_addr} from {user}")


if __name__ == "__main__":
    main()
