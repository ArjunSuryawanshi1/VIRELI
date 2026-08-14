import json
import os
import base64
import hashlib
import hmac
import sqlite3
import time
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
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    return connection


def row_to_user(row):
    return {
        "id": row["id"],
        "googleSub": row["google_sub"],
        "email": row["email"],
        "name": row["name"],
        "picture": row["picture"] or "",
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
