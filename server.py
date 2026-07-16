import json
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = int(os.environ.get("PORT", "8001"))
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


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
        "You are VIRELI, a calm AI student companion for high school students. "
        "Write short, direct, easy-to-read answers. Be supportive without being "
        "clinical. Help with homework, school pressure, planning, motivation, "
        "and reflection. If the user mentions self-harm, danger, or not being "
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

    def send_json(self, status, payload):
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_POST(self):
        if self.path != "/api/ask-vireli":
            self.send_error(HTTPStatus.NOT_FOUND, "Not found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length).decode("utf-8") or "{}")
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
