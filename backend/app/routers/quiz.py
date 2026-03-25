"""
FlashMind — Quiz Router
Interactive quiz mode with grading, streaks, and spaced repetition ratings.
"""
from difflib import SequenceMatcher
from fastapi import APIRouter, HTTPException
from app.models import (
    QuizStartRequest, QuizAnswer, QuizAnswerResult,
    QuizSessionResult, SessionData,
)
from app import session_store

router = APIRouter(prefix="/quiz", tags=["quiz"])

# Active quiz state (in-memory)
_active_quizzes: dict[str, dict] = {}


def _score_answer(user_answer: str, correct_answer: str) -> tuple[bool, float]:
    """Score answer using exact matching for MCQ."""
    ua = user_answer.strip().lower()
    ca = correct_answer.strip().lower()

    if ua == ca:
        return True, 3.0
    return False, -1.0


@router.post("/start")
async def start_quiz(req: QuizStartRequest):
    """Start a quiz session from saved flashcards."""
    session = session_store.get_session(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found. Generate flashcards first.")
    if not session.flashcards:
        raise HTTPException(400, "No flashcards in this session.")

    _active_quizzes[req.session_id] = {
        "answers": [],
        "streak": 0,
        "best_streak": 0,
        "timed": req.timed,
        "time_per_card": req.time_per_card,
    }

    return {
        "session_id": req.session_id,
        "total_cards": len(session.flashcards),
        "timed": req.timed,
        "time_per_card": req.time_per_card,
        "cards": [
            {"id": c.id, "front": c.front, "type": c.type, "options": c.options, "difficulty": c.difficulty}
            for c in session.flashcards
        ],
    }


@router.post("/answer", response_model=QuizAnswerResult)
async def submit_answer(session_id: str, answer: QuizAnswer):
    """Submit an answer for a quiz card and get grading."""
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    quiz = _active_quizzes.get(session_id)
    if not quiz:
        raise HTTPException(400, "Quiz not started. Call /quiz/start first.")

    # Find the card
    card = next((c for c in session.flashcards if c.id == answer.card_id), None)
    if not card:
        raise HTTPException(404, f"Card {answer.card_id} not found.")

    correct, score = _score_answer(answer.user_answer, card.back)

    # Update streak
    if correct:
        quiz["streak"] += 1
        quiz["best_streak"] = max(quiz["best_streak"], quiz["streak"])
        feedback = "🎉 Correct! Great job!" if score >= 0.9 else "✅ Close enough! Well done!"
    else:
        quiz["streak"] = 0
        feedback = f"❌ Not quite. The answer is: {card.back}"

    result = QuizAnswerResult(
        card_id=answer.card_id,
        correct=correct,
        score=score,
        correct_answer=card.back,
        feedback=feedback,
    )
    quiz["answers"].append(result)

    return result


@router.post("/rate")
async def rate_card(session_id: str, card_id: str, rating: int):
    """Rate a card 1-5 for spaced repetition scheduling."""
    if rating < 1 or rating > 5:
        raise HTTPException(400, "Rating must be 1-5.")

    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    session.ratings[card_id] = rating
    session_store.save_session(session)

    # Calculate next review interval
    intervals = {1: 1, 2: 2, 3: 4, 4: 7, 5: 14}  # days
    next_review_days = intervals.get(rating, 4)

    return {"card_id": card_id, "rating": rating, "next_review_days": next_review_days}


@router.get("/results/{session_id}", response_model=QuizSessionResult)
async def get_results(session_id: str):
    """Get quiz results and performance summary."""
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    quiz = _active_quizzes.get(session_id)
    if not quiz:
        raise HTTPException(400, "No quiz data found.")

    answers: list[QuizAnswerResult] = quiz["answers"]
    correct_count = sum(1 for a in answers if a.correct)
    total = len(answers)
    total_score = sum(a.score for a in answers)
    
    # We will use score_pct to represent the total points for this version of the quiz
    score_pct = total_score

    weak_cards = [a.card_id for a in answers if not a.correct]

    # Save progress
    session_store.add_progress(session_id, score_pct)

    return QuizSessionResult(
        session_id=session_id,
        total_cards=len(session.flashcards),
        correct=correct_count,
        score_pct=round(score_pct, 1),
        streak=quiz["streak"],
        best_streak=quiz["best_streak"],
        weak_cards=weak_cards,
        results=answers,
    )


@router.get("/sessions")
async def list_quiz_sessions():
    """List all saved sessions."""
    sessions = session_store.list_sessions()
    return [
        {
            "id": s.id,
            "created_at": s.created_at,
            "level": s.level,
            "difficulty": s.difficulty,
            "num_cards": len(s.flashcards),
            "source_summary": s.source_summary,
        }
        for s in sessions
    ]


@router.get("/progress")
async def get_progress():
    """Get progress history for dashboard charts."""
    return session_store.get_progress()
