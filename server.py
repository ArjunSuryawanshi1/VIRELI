import json
import os
import base64
import hashlib
import hmac
import re
import secrets
import sqlite3
import smtplib
import time
from email.message import EmailMessage
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = int(os.environ.get("PORT", "8001"))
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
AUTH_DB_PATH = Path(os.environ.get("VIRELI_AUTH_DB_PATH", ROOT / "vireli_auth.sqlite3"))
SESSION_COOKIE_NAME = "vireli_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14
EMAIL_CODE_TTL_SECONDS = 60 * 10
EMAIL_RESEND_COOLDOWN_SECONDS = 60
EMAIL_REQUEST_WINDOW_SECONDS = 60 * 15
EMAIL_REQUEST_LIMIT = 5
EMAIL_VERIFY_LIMIT = 6
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
EMAIL_REQUEST_LOG = {}


def get_session_secret():
    secret = os.environ.get("VIRELI_SESSION_SECRET", "").strip()
    if secret:
        return secret.encode("utf-8")
    return b"vireli-dev-session-secret-change-me"


def base64url_encode(raw):
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def base64url_decode(value):
    padded = value + ("=" * ((4 - len(value) % 4) % 4))
    return base64.urlsafe_b64decode(padded.encode("utf-8"))


def sign_session_payload(payload):
    encoded_payload = base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(get_session_secret(), encoded_payload.encode("utf-8"), hashlib.sha256).digest()
    return f"{encoded_payload}.{base64url_encode(signature)}"


def verify_session_token(token):
    try:
        encoded_payload, encoded_signature = str(token or "").split(".", 1)
        expected_signature = hmac.new(
            get_session_secret(),
            encoded_payload.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        actual_signature = base64url_decode(encoded_signature)
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
        payload = json.loads(base64url_decode(encoded_payload).decode("utf-8"))
    except (ValueError, json.JSONDecodeError, TypeError):
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return payload


def get_database_connection():
    AUTH_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(AUTH_DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_sub TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            picture TEXT DEFAULT '',
            username TEXT UNIQUE,
            password_hash TEXT,
            password_salt TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT NOT NULL
        )
        """
    )
    user_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(users)").fetchall()
    }
    for column_name, definition in {
        "username": "TEXT",
        "password_hash": "TEXT",
        "password_salt": "TEXT",
    }.items():
        if column_name not in user_columns:
            connection.execute(f"ALTER TABLE users ADD COLUMN {column_name} {definition}")
    connection.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)"
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS email_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            used_at INTEGER,
            attempts INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        )
        """
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)"
    )
    connection.commit()
    return connection


def row_to_user(row):
    google_sub = row["google_sub"]
    auth_mode = "email" if str(google_sub).startswith("email:") else "google-gis"
    if str(google_sub).startswith("vireli:"):
        auth_mode = "vireli-account"
    return {
        "id": row["id"],
        "googleSub": google_sub,
        "email": row["email"],
        "name": row["name"],
        "username": row["username"] or "",
        "picture": row["picture"] or "",
        "authMode": auth_mode,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "lastLoginAt": row["last_login_at"],
    }


def upsert_google_user(id_info):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    google_sub = str(id_info.get("sub") or "").strip()
    email = str(id_info.get("email") or "").strip()
    name = str(id_info.get("name") or email.split("@")[0] or "VIRELI user").strip()
    picture = str(id_info.get("picture") or "").strip()

    if not google_sub or not email:
        raise ValueError("Google profile is missing required fields")

    with get_database_connection() as connection:
        existing = connection.execute(
            "SELECT * FROM users WHERE google_sub = ?",
            (google_sub,),
        ).fetchone()
        if existing:
            connection.execute(
                """
                UPDATE users
                SET email = ?, name = ?, picture = ?, updated_at = ?, last_login_at = ?
                WHERE google_sub = ?
                """,
                (email, name, picture, now, now, google_sub),
            )
        else:
            email_user = connection.execute(
                "SELECT * FROM users WHERE email = ? AND google_sub LIKE 'email:%'",
                (email,),
            ).fetchone()
            if email_user:
                connection.execute(
                    """
                    UPDATE users
                    SET google_sub = ?, email = ?, name = ?, picture = ?, updated_at = ?, last_login_at = ?
                    WHERE id = ?
                    """,
                    (google_sub, email, name, picture, now, now, email_user["id"]),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO users (google_sub, email, name, picture, created_at, updated_at, last_login_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (google_sub, email, name, picture, now, now, now),
                )
        connection.commit()
        user = connection.execute(
            "SELECT * FROM users WHERE google_sub = ?",
            (google_sub,),
        ).fetchone()
    return row_to_user(user)


def upsert_email_user(email):
    normalized_email = normalize_email(email)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    email_subject = "email:" + hashlib.sha256(normalized_email.encode("utf-8")).hexdigest()
    name = normalized_email.split("@")[0] or "VIRELI user"

    with get_database_connection() as connection:
        existing = connection.execute(
            "SELECT * FROM users WHERE email = ? OR google_sub = ? ORDER BY id LIMIT 1",
            (normalized_email, email_subject),
        ).fetchone()
        if existing:
            connection.execute(
                """
                UPDATE users
                SET email = ?, name = COALESCE(NULLIF(name, ''), ?), updated_at = ?, last_login_at = ?
                WHERE id = ?
                """,
                (normalized_email, name, now, now, existing["id"]),
            )
            user_id = existing["id"]
        else:
            connection.execute(
                """
                INSERT INTO users (google_sub, email, name, picture, created_at, updated_at, last_login_at)
                VALUES (?, ?, ?, '', ?, ?, ?)
                """,
                (email_subject, normalized_email, name, now, now, now),
            )
            user_id = connection.execute("SELECT last_insert_rowid()").fetchone()[0]
        connection.commit()
        user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return row_to_user(user)


def normalize_username(username):
    return " ".join(str(username or "").split()).strip().lower()


def validate_vireli_account(username, password):
    normalized_username = normalize_username(username)
    if not normalized_username:
        return False, "Enter a username."
    if len(normalized_username) < 3:
        return False, "Use at least 3 characters for your username."
    if len(normalized_username) > 32:
        return False, "Use 32 characters or fewer for your username."
    if not re.match(r"^[a-z0-9._-]+$", normalized_username):
        return False, "Use only letters, numbers, dots, dashes, or underscores."
    if len(str(password or "")) < 8:
        return False, "Use at least 8 characters for your password."
    return True, ""


def hash_password(password, salt=None):
    password_salt = salt or secrets.token_urlsafe(24)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        str(password or "").encode("utf-8"),
        password_salt.encode("utf-8"),
        120_000,
    ).hex()
    return password_hash, password_salt


def verify_password(password, password_hash, password_salt):
    if not password_hash or not password_salt:
        return False
    submitted_hash, _ = hash_password(password, password_salt)
    return hmac.compare_digest(submitted_hash, password_hash)


def create_vireli_user(username, password):
    valid, error = validate_vireli_account(username, password)
    if not valid:
        return False, HTTPStatus.BAD_REQUEST, {"error": error}

    normalized_username = normalize_username(username)
    password_hash, password_salt = hash_password(password)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    account_subject = "vireli:" + hashlib.sha256(normalized_username.encode("utf-8")).hexdigest()

    try:
        with get_database_connection() as connection:
            existing = connection.execute(
                "SELECT id FROM users WHERE username = ?",
                (normalized_username,),
            ).fetchone()
            if existing:
                return False, HTTPStatus.CONFLICT, {"error": "That username is already taken."}

            connection.execute(
                """
                INSERT INTO users (
                    google_sub, email, name, picture, username, password_hash,
                    password_salt, created_at, updated_at, last_login_at
                )
                VALUES (?, '', ?, '', ?, ?, ?, ?, ?, ?)
                """,
                (
                    account_subject,
                    normalized_username,
                    normalized_username,
                    password_hash,
                    password_salt,
                    now,
                    now,
                    now,
                ),
            )
            connection.commit()
            user_id = connection.execute("SELECT last_insert_rowid()").fetchone()[0]
            row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    except sqlite3.IntegrityError:
        return False, HTTPStatus.CONFLICT, {"error": "That username is already taken."}

    return True, HTTPStatus.OK, {"authenticated": True, "user": row_to_user(row)}


def check_vireli_username(username):
    normalized_username = normalize_username(username)
    valid, error = validate_vireli_account(normalized_username, "temporary-password")
    if not valid:
        return False, HTTPStatus.BAD_REQUEST, {"available": False, "error": error}

    with get_database_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM users WHERE username = ?",
            (normalized_username,),
        ).fetchone()

    if existing:
        return False, HTTPStatus.CONFLICT, {"available": False, "error": "That username is already taken."}

    return True, HTTPStatus.OK, {"available": True, "username": normalized_username}


def login_vireli_user(username, password):
    normalized_username = normalize_username(username)
    with get_database_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE username = ?",
            (normalized_username,),
        ).fetchone()

        if not row or not verify_password(password, row["password_hash"], row["password_salt"]):
            return False, HTTPStatus.UNAUTHORIZED, {"error": "That username or password is not correct."}

        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        connection.execute(
            "UPDATE users SET updated_at = ?, last_login_at = ? WHERE id = ?",
            (now, now, row["id"]),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()

    return True, HTTPStatus.OK, {"authenticated": True, "user": row_to_user(row)}


def change_vireli_password(user_id, current_password, new_password):
    if len(str(new_password or "")) < 8:
        return False, HTTPStatus.BAD_REQUEST, {"error": "Use at least 8 characters for your new password."}

    with get_database_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not row or not row["username"]:
            return False, HTTPStatus.BAD_REQUEST, {"error": "Password changes are only available for VIRELI accounts."}

        if not verify_password(current_password, row["password_hash"], row["password_salt"]):
            return False, HTTPStatus.UNAUTHORIZED, {"error": "Current password is not correct."}

        password_hash, password_salt = hash_password(new_password)
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        connection.execute(
            """
            UPDATE users
            SET password_hash = ?, password_salt = ?, updated_at = ?
            WHERE id = ?
            """,
            (password_hash, password_salt, now, row["id"]),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()

    return True, HTTPStatus.OK, {"ok": True, "user": row_to_user(row)}


def get_user_by_id(user_id):
    try:
        numeric_user_id = int(user_id)
    except (TypeError, ValueError):
        return None

    with get_database_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (numeric_user_id,)).fetchone()
    return row_to_user(row) if row else None


def verify_google_credential(credential):
    client_id = os.environ.get("VIRELI_GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise RuntimeError("VIRELI_GOOGLE_CLIENT_ID is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
    except ImportError as error:
        raise RuntimeError("Install google-auth to enable Google sign-in") from error

    id_info = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        client_id,
    )
    issuer = id_info.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise ValueError("Invalid Google token issuer")
    if id_info.get("aud") != client_id:
        raise ValueError("Invalid Google token audience")
    if int(id_info.get("exp", 0)) < int(time.time()):
        raise ValueError("Expired Google token")
    return id_info


def normalize_email(email):
    return " ".join(str(email or "").split()).lower()


def is_valid_email(email):
    return bool(EMAIL_PATTERN.match(normalize_email(email)))


def hash_verification_code(code, salt):
    return hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()


def generate_verification_code():
    return f"{secrets.randbelow(1_000_000):06d}"


def check_email_request_limit(email):
    now = int(time.time())
    records = [
        timestamp
        for timestamp in EMAIL_REQUEST_LOG.get(email, [])
        if now - timestamp < EMAIL_REQUEST_WINDOW_SECONDS
    ]
    if records and now - records[-1] < EMAIL_RESEND_COOLDOWN_SECONDS:
        return False, EMAIL_RESEND_COOLDOWN_SECONDS - (now - records[-1])
    if len(records) >= EMAIL_REQUEST_LIMIT:
        return False, EMAIL_REQUEST_WINDOW_SECONDS - (now - records[0])
    records.append(now)
    EMAIL_REQUEST_LOG[email] = records
    return True, 0


def store_email_verification(email, code):
    salt = secrets.token_urlsafe(18)
    now = int(time.time())
    expires_at = now + EMAIL_CODE_TTL_SECONDS
    code_hash = hash_verification_code(code, salt)

    with get_database_connection() as connection:
        connection.execute(
            """
            UPDATE email_verifications
            SET used_at = ?
            WHERE email = ? AND used_at IS NULL
            """,
            (now, email),
        )
        connection.execute(
            """
            INSERT INTO email_verifications (email, code_hash, salt, expires_at, used_at, attempts, created_at)
            VALUES (?, ?, ?, ?, NULL, 0, ?)
            """,
            (email, code_hash, salt, expires_at, now),
        )
        connection.commit()


def invalidate_email_verifications(email):
    now = int(time.time())
    with get_database_connection() as connection:
        connection.execute(
            """
            UPDATE email_verifications
            SET used_at = ?
            WHERE email = ? AND used_at IS NULL
            """,
            (now, normalize_email(email)),
        )
        connection.commit()


def verify_email_code(email, code):
    normalized_email = normalize_email(email)
    clean_code = re.sub(r"\D", "", str(code or ""))

    if len(clean_code) != 6:
        return False, "incorrect", None

    now = int(time.time())
    with get_database_connection() as connection:
        record = connection.execute(
            """
            SELECT * FROM email_verifications
            WHERE email = ? AND used_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (normalized_email,),
        ).fetchone()

        if not record:
            return False, "incorrect", None
        if int(record["expires_at"]) < now:
            connection.execute("UPDATE email_verifications SET used_at = ? WHERE id = ?", (now, record["id"]))
            connection.commit()
            return False, "expired", None
        if int(record["attempts"]) >= EMAIL_VERIFY_LIMIT:
            connection.execute("UPDATE email_verifications SET used_at = ? WHERE id = ?", (now, record["id"]))
            connection.commit()
            return False, "incorrect", None

        submitted_hash = hash_verification_code(clean_code, record["salt"])
        if not hmac.compare_digest(submitted_hash, record["code_hash"]):
            connection.execute(
                "UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?",
                (record["id"],),
            )
            connection.commit()
            return False, "incorrect", None

        connection.execute("UPDATE email_verifications SET used_at = ? WHERE id = ?", (now, record["id"]))
        connection.commit()

    return True, "", upsert_email_user(normalized_email)


def build_verification_email(email, code):
    from_address = os.environ.get("VIRELI_EMAIL_FROM", "").strip() or os.environ.get("VIRELI_SMTP_USERNAME", "").strip()
    message = EmailMessage()
    message["Subject"] = "Your VIRELI verification code"
    message["From"] = from_address or "VIRELI <no-reply@vireli.local>"
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Your verification code is:",
                "",
                code,
                "",
                "This code expires in 10 minutes.",
                "",
                "Didn't request this? You can ignore this email.",
            ]
        )
    )
    message.add_alternative(
        f"""
        <div style="font-family: Manrope, Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h1 style="font-size: 22px; margin: 0 0 12px;">VIRELI</h1>
          <p>Your verification code is:</p>
          <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; margin: 16px 0;">{code}</div>
          <p>This code expires in 10 minutes.</p>
          <p style="color: #6b7280;">Didn't request this? You can ignore this email.</p>
        </div>
        """,
        subtype="html",
    )
    return message


def send_verification_email(email, code):
    dev_mode = os.environ.get("VIRELI_EMAIL_DEV_MODE", "").strip().lower() == "true"
    host = os.environ.get("VIRELI_SMTP_HOST", "").strip()
    username = os.environ.get("VIRELI_SMTP_USERNAME", "").strip()
    password = os.environ.get("VIRELI_SMTP_PASSWORD", "").strip()
    from_address = os.environ.get("VIRELI_EMAIL_FROM", "").strip() or username
    port = int(os.environ.get("VIRELI_SMTP_PORT", "587"))
    use_tls = os.environ.get("VIRELI_SMTP_TLS", "true").strip().lower() != "false"

    if dev_mode and not host:
        print(f"[VIRELI email dev mode] Verification code for {email}: {code}", flush=True)
        return {"sent": True, "devCode": code}

    if not host or not from_address:
        raise RuntimeError("Email service is not configured")

    message = build_verification_email(email, code)
    if from_address:
        message.replace_header("From", from_address)

    with smtplib.SMTP(host, port, timeout=20) as smtp:
        if use_tls:
            smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)

    return {"sent": True}


def start_email_verification(email):
    normalized_email = normalize_email(email)
    if not is_valid_email(normalized_email):
        return False, HTTPStatus.BAD_REQUEST, {"error": "Enter a valid email address."}

    allowed, retry_after = check_email_request_limit(normalized_email)
    if not allowed:
        return False, HTTPStatus.TOO_MANY_REQUESTS, {
            "error": "Please wait before requesting another code.",
            "retryAfter": max(1, int(retry_after)),
        }

    code = generate_verification_code()
    store_email_verification(normalized_email, code)
    try:
        send_verification_email(normalized_email, code)
    except RuntimeError as error:
        invalidate_email_verifications(normalized_email)
        return False, HTTPStatus.SERVICE_UNAVAILABLE, {"error": str(error)}
    except (OSError, smtplib.SMTPException) as error:
        invalidate_email_verifications(normalized_email)
        return False, HTTPStatus.SERVICE_UNAVAILABLE, {"error": "Verification email could not be sent."}

    return True, HTTPStatus.OK, {
        "ok": True,
        "email": normalized_email,
        "message": "A verification code has been sent.",
        "expiresIn": EMAIL_CODE_TTL_SECONDS,
        "resendCooldown": EMAIL_RESEND_COOLDOWN_SECONDS,
    }


def build_fallback_reply(prompt, response_type):
    clean_prompt = " ".join(str(prompt or "").split())
    if len(clean_prompt) > 120:
        clean_prompt = clean_prompt[:117] + "..."

    if response_type == "mental-health":
        return (
            "That sounds hard. Take one slow breath, unclench your shoulders, "
            "and pick one small next step. If you might hurt yourself or you are "
            "not safe, tell a trusted adult or contact crisis support now."
        )

    if response_type == "homework":
        return (
            f"For \"{clean_prompt}\", first find what the question is asking. "
            "Then list the facts you have, choose the rule or evidence you need, "
            "and try one step before checking your work."
        )

    return (
        f"For \"{clean_prompt}\", start with the clearest true sentence. "
        "Then decide what you need next: an action, a reset, or someone to talk to."
    )


def build_system_prompt(response_type):
    mode_instructions = {
        "mental-health": (
            "Mental Health mode: validate briefly, suggest one grounding step, "
            "and give one safe next action. Do not act like a therapist or doctor."
        ),
        "homework": (
            "Homework mode: explain the topic first, then give clear steps. "
            "Teach the process instead of only giving final answers."
        ),
        "conversation": (
            "Conversation mode: respond naturally to the user's exact words. "
            "Avoid robotic phrases like 'I am analyzing'."
        ),
    }

    return (
        "You are VIRELI, an AI student planner for high school students. "
        "Write short, direct, easy-to-read answers. Be supportive without being "
        "clinical. Focus on what the student should work on and when. Use any "
        "provided planner context before giving general advice. If the user mentions self-harm, danger, or not being "
        "safe, tell them to contact a trusted adult and crisis support such as "
        "988, or emergency services for immediate danger. "
        + mode_instructions.get(response_type, mode_instructions["conversation"])
    )


def build_user_prompt(payload):
    recent_messages = payload.get("recentMessages")
    if not isinstance(recent_messages, list):
        recent_messages = []

    context_lines = [
        f"Response type: {payload.get('responseType') or 'conversation'}",
        f"Mood: {payload.get('mood') or 'ok'}",
        f"Time mode: {payload.get('timeMode') or 'day'}",
        f"Recent user prompt: {payload.get('recentUserPrompt') or ''}",
        f"Recent assistant response: {payload.get('recentAssistantResponse') or ''}",
        "Recent messages:",
    ]

    for message in recent_messages[-6:]:
        role = message.get("role", "user")
        content = " ".join(str(message.get("content", "")).split())
        context_lines.append(f"- {role}: {content[:240]}")

    planner_context = payload.get("plannerContext")
    if isinstance(planner_context, dict):
        context_lines.append("Planner context:")
        for assignment in planner_context.get("openAssignments", [])[:8]:
            context_lines.append(
                "- Assignment: "
                f"{assignment.get('title', '')} | "
                f"{assignment.get('subject', '')} | "
                f"due {assignment.get('dueDate', '') or 'none'} | "
                f"scheduled {assignment.get('scheduledDate', '') or 'none'} {assignment.get('scheduledTime', '') or ''} | "
                f"{assignment.get('estimatedMinutes', '')} min"
            )
        for window in planner_context.get("freeWindows", [])[:5]:
            context_lines.append(f"- Free window: {window.get('label', '')} ({window.get('minutes', '')} min)")

    context_lines.extend(
        [
            "",
            "Current user prompt:",
            str(payload.get("prompt") or ""),
        ]
    )
    return "\n".join(context_lines)


def extract_response_text(api_payload):
    if isinstance(api_payload.get("output_text"), str):
        return api_payload["output_text"].strip()

    for output_item in api_payload.get("output", []):
      for content_item in output_item.get("content", []):
          text = content_item.get("text")
          if isinstance(text, str) and text.strip():
              return text.strip()

    return ""


def call_openai(payload, model):
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    request_body = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": build_system_prompt(payload.get("responseType")),
            },
            {
                "role": "user",
                "content": build_user_prompt(payload),
            },
        ],
        "max_output_tokens": 360,
    }

    request = Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=30) as response:
        response_payload = json.loads(response.read().decode("utf-8"))

    reply = extract_response_text(response_payload)
    if not reply:
        raise RuntimeError("OpenAI response did not include text")

    return reply


def get_model_candidates():
    primary = os.environ.get("VIRELI_OPENAI_MODEL", "gpt-5.5").strip()
    fallback = os.environ.get("VIRELI_OPENAI_MODEL_FALLBACK", "gpt-5.4").strip()
    candidates = []
    for model in [primary, fallback]:
        if model and model not in candidates:
            candidates.append(model)
    return candidates or ["gpt-5.5", "gpt-5.4"]


class VireliRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, payload, extra_headers=None):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        for header, value in (extra_headers or {}).items():
            self.send_header(header, value)
        self.end_headers()
        self.wfile.write(encoded)

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(content_length).decode("utf-8") or "{}")

    def get_session_user(self):
        cookies = SimpleCookie(self.headers.get("Cookie", ""))
        session_cookie = cookies.get(SESSION_COOKIE_NAME)
        if not session_cookie:
            return None
        session_payload = verify_session_token(session_cookie.value)
        if not session_payload:
            return None
        return get_user_by_id(session_payload.get("userId"))

    def build_session_cookie_header(self, user_id):
        now = int(time.time())
        token = sign_session_payload(
            {
                "userId": user_id,
                "iat": now,
                "exp": now + SESSION_MAX_AGE_SECONDS,
            }
        )
        cookie = SimpleCookie()
        cookie[SESSION_COOKIE_NAME] = token
        cookie[SESSION_COOKIE_NAME]["path"] = "/"
        cookie[SESSION_COOKIE_NAME]["max-age"] = str(SESSION_MAX_AGE_SECONDS)
        cookie[SESSION_COOKIE_NAME]["httponly"] = True
        cookie[SESSION_COOKIE_NAME]["samesite"] = "Lax"
        if os.environ.get("VIRELI_COOKIE_SECURE", "").strip().lower() == "true":
            cookie[SESSION_COOKIE_NAME]["secure"] = True
        return cookie.output(header="").strip()

    def build_clear_session_cookie_header(self):
        cookie = SimpleCookie()
        cookie[SESSION_COOKIE_NAME] = ""
        cookie[SESSION_COOKIE_NAME]["path"] = "/"
        cookie[SESSION_COOKIE_NAME]["max-age"] = "0"
        cookie[SESSION_COOKIE_NAME]["httponly"] = True
        cookie[SESSION_COOKIE_NAME]["samesite"] = "Lax"
        return cookie.output(header="").strip()

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/api/config":
            self.send_json(
                HTTPStatus.OK,
                {
                    "googleClientId": os.environ.get("VIRELI_GOOGLE_CLIENT_ID", "").strip(),
                },
            )
            return

        if route == "/api/auth/me":
            user = self.get_session_user()
            self.send_json(
                HTTPStatus.OK,
                {
                    "authenticated": bool(user),
                    "user": user,
                },
            )
            return

        super().do_GET()

    def do_POST(self):
        route = self.path.split("?", 1)[0]

        if route == "/api/auth/google":
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            credential = str(payload.get("credential") or "").strip()
            if not credential:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Google credential is required"})
                return

            try:
                id_info = verify_google_credential(credential)
                user = upsert_google_user(id_info)
            except (RuntimeError, ValueError) as error:
                self.send_json(HTTPStatus.UNAUTHORIZED, {"error": str(error)})
                return

            self.send_json(
                HTTPStatus.OK,
                {
                    "authenticated": True,
                    "user": user,
                },
                {"Set-Cookie": self.build_session_cookie_header(user["id"])},
            )
            return

        if route == "/api/auth/vireli/check-username":
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            ok, status, response_payload = check_vireli_username(payload.get("username"))
            self.send_json(status, response_payload)
            return

        if route in ("/api/auth/vireli/register", "/api/auth/vireli/login"):
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            username = payload.get("username")
            password = payload.get("password")
            if route == "/api/auth/vireli/register":
                ok, status, response_payload = create_vireli_user(username, password)
            else:
                ok, status, response_payload = login_vireli_user(username, password)

            extra_headers = {}
            user = response_payload.get("user")
            if ok and user:
                extra_headers["Set-Cookie"] = self.build_session_cookie_header(user["id"])
            self.send_json(status, response_payload, extra_headers)
            return

        if route == "/api/auth/vireli/change-password":
            user = self.get_session_user()
            if not user:
                self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Sign in before changing your password."})
                return
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            ok, status, response_payload = change_vireli_password(
                user["id"],
                payload.get("currentPassword"),
                payload.get("newPassword"),
            )
            self.send_json(status, response_payload)
            return

        if route in ("/api/auth/email/start", "/api/auth/email/resend"):
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            email = normalize_email(payload.get("email"))
            _, status, response_payload = start_email_verification(email)
            if route == "/api/auth/email/resend" and status == HTTPStatus.OK:
                response_payload["message"] = "A new code has been sent."
            self.send_json(status, response_payload)
            return

        if route == "/api/auth/email/verify":
            try:
                payload = self.read_json_body()
            except (ValueError, json.JSONDecodeError):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            email = normalize_email(payload.get("email"))
            code = str(payload.get("code") or "").strip()
            if not is_valid_email(email):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Enter a valid email address."})
                return

            verified, reason, user = verify_email_code(email, code)
            if not verified:
                if reason == "expired":
                    self.send_json(
                        HTTPStatus.GONE,
                        {"error": "This code has expired. Send a new code."},
                    )
                else:
                    self.send_json(
                        HTTPStatus.UNAUTHORIZED,
                        {"error": "That code isn’t correct. Try again."},
                    )
                return

            self.send_json(
                HTTPStatus.OK,
                {
                    "authenticated": True,
                    "user": user,
                },
                {"Set-Cookie": self.build_session_cookie_header(user["id"])},
            )
            return

        if route == "/api/auth/logout":
            self.send_json(
                HTTPStatus.OK,
                {"authenticated": False},
                {"Set-Cookie": self.build_clear_session_cookie_header()},
            )
            return

        if route != "/api/ask-vireli":
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        try:
            payload = self.read_json_body()
        except (ValueError, json.JSONDecodeError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
            return

        prompt = str(payload.get("prompt") or "").strip()
        response_type = payload.get("responseType") or "conversation"
        if not prompt:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Prompt is required"})
            return

        errors = []
        for model in get_model_candidates():
            try:
                reply = call_openai(payload, model)
                self.send_json(
                    HTTPStatus.OK,
                    {"reply": reply, "source": "api", "model": model},
                )
                return
            except (HTTPError, URLError, RuntimeError, TimeoutError) as error:
                errors.append(f"{model}: {error}")

        self.send_json(
            HTTPStatus.OK,
            {
                "reply": build_fallback_reply(prompt, response_type),
                "source": "local",
                "model": "local-fallback",
                "error": "; ".join(errors[-2:]),
            },
        )


def run():
    server = ThreadingHTTPServer(("", DEFAULT_PORT), VireliRequestHandler)
    print(f"VIRELI server running at http://localhost:{DEFAULT_PORT}/")
    server.serve_forever()


if __name__ == "__main__":
    run()
