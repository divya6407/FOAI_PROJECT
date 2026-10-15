"""
services/gemini_client.py
─────────────────────────────────────────────────────────────────────────────
Gemini API wrapper.
  - extract_intent(question) -> {"intent": "...", "params": {...}}
  - generate_answer(question, data) -> str
─────────────────────────────────────────────────────────────────────────────
"""
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    from google import genai
    client = genai.Client(api_key=GEMINI_API_KEY)
    GEMINI_AVAILABLE = bool(GEMINI_API_KEY)
except Exception:
    client = None
    GEMINI_AVAILABLE = False

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


# ─── Intent extraction prompt ─────────────────────────────────────────────────

INTENT_PROMPT = """\
You are an intent classifier for a college timetable assistant.
Classify the user's question into exactly one of these intents and extract relevant parameters.
Return ONLY a JSON object — no markdown, no explanation, no code fences.

Intents:
  TODAY_TIMETABLE   — asking about today's schedule
  FREE_ROOM         — asking about available/free rooms
  ROOM_DETAILS      — asking about a specific room's details
  CLASS_DETAILS     — asking about a specific class, subject, or batch schedule
  UNKNOWN           — anything else

Few-shot examples:
Q: "What classes are happening today?"
A: {"intent": "TODAY_TIMETABLE", "params": {}}

Q: "Are there any free rooms in Block A tomorrow at period 3?"
A: {"intent": "FREE_ROOM", "params": {"date": "tomorrow", "time": "3", "block": "A"}}

Q: "Tell me about room TL4"
A: {"intent": "ROOM_DETAILS", "params": {"roomId": "TL4"}}

Q: "When does Web Programming batch WP-A meet?"
A: {"intent": "CLASS_DETAILS", "params": {"subject": "Web Programming", "batch": "WP-A"}}

Q: "What is the meaning of life?"
A: {"intent": "UNKNOWN", "params": {}}

Now classify:
Q: "{question}"
A:"""


ANSWER_PROMPT = """\
You are a helpful college timetable assistant. A student or faculty member asked:
"{question}"

Here is the REAL data retrieved from the database for this query:
{data}

Answer using ONLY the provided data. Never invent or assume any scheduling information.
If the data is empty or says no results, tell the user that clearly.
Keep your answer concise, friendly, and in plain English (1-3 sentences).
"""


def _strip_fences(text: str) -> str:
    """Remove markdown code fences if Gemini wraps JSON in them."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def extract_intent(question: str) -> dict:
    """
    Call Gemini to extract intent + params from the user's question.
    Falls back to UNKNOWN on any error.
    """
    if not GEMINI_AVAILABLE or client is None:
        return {"intent": "UNKNOWN", "params": {}}

    prompt = INTENT_PROMPT.replace("{question}", question)
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL, contents=prompt
        )
        raw = _strip_fences(response.text or "")
        parsed = json.loads(raw)
        if "intent" not in parsed:
            return {"intent": "UNKNOWN", "params": {}}
        return parsed
    except Exception as e:
        print(f"[Gemini] extract_intent error: {e}")
        return {"intent": "UNKNOWN", "params": {}}


async def generate_answer(question: str, data: any) -> str:
    """
    Given the real DB data, ask Gemini to phrase a grounded answer.
    Falls back to a plain data dump on error.
    """
    if not GEMINI_AVAILABLE or client is None:
        if data:
            return f"Here is the data I found: {json.dumps(data, default=str)}"
        return "I couldn't connect to the AI service. Please try again later."

    data_str = json.dumps(data, default=str, indent=2) if data else "No data found."
    prompt = ANSWER_PROMPT.replace("{question}", question).replace("{data}", data_str)
    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL, contents=prompt
        )
        return (response.text or "").strip()
    except Exception as e:
        print(f"[Gemini] generate_answer error: {e}")
        if data:
            return f"Here is the data I found: {json.dumps(data, default=str)}"
        return "No information found for your query."
