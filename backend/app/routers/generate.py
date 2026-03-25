"""
FlashMind — Generate Router
Flashcard generation & AI explanations.
"""
from fastapi import APIRouter
from app.models import (
    GenerateRequest, GenerateResponse, ExplainRequest, ExplainResponse,
)
from app import ai_service, session_store
from app.models import SessionData

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("/", response_model=GenerateResponse)
async def generate_flashcards(req: GenerateRequest):
    """Generate flashcards from input text."""
    cards = await ai_service.generate_flashcards(req)
    summary = ai_service.summarize_text(req.text)

    # Save session
    session = SessionData(
        level=req.level,
        difficulty=req.difficulty,
        flashcards=cards,
        source_text=req.text[:2000],
        source_summary=summary,
    )
    session_store.save_session(session)

    return GenerateResponse(
        session_id=session.id,
        flashcards=cards,
        source_summary=summary,
        level=req.level,
        difficulty=req.difficulty,
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain_card(req: ExplainRequest):
    """Generate AI explanation for a flashcard."""
    explanation = await ai_service.generate_explanation(req)
    return ExplainResponse(explanation=explanation, level=req.level)
