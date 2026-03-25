"""
FlashMind — In-memory session store
Simple dict-based storage for hackathon / local demo use.
"""
from app.models import SessionData
import time

_sessions: dict[str, SessionData] = {}
_progress_history: list[dict] = []  # [{session_id, score_pct, timestamp}]


def save_session(session: SessionData) -> str:
    _sessions[session.id] = session
    return session.id


def get_session(session_id: str) -> SessionData | None:
    return _sessions.get(session_id)


def list_sessions() -> list[SessionData]:
    return sorted(_sessions.values(), key=lambda s: s.created_at, reverse=True)


def delete_session(session_id: str) -> bool:
    return _sessions.pop(session_id, None) is not None


def add_progress(session_id: str, score_pct: float):
    _progress_history.append({
        "session_id": session_id,
        "score_pct": score_pct,
        "timestamp": time.time(),
    })


def get_progress() -> list[dict]:
    return _progress_history


def clear_all():
    _sessions.clear()
    _progress_history.clear()
