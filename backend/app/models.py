"""
FlashMind — Pydantic models & schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
import time


class UserLevel(str, Enum):
    SCHOOL = "school"
    ENGINEER = "engineer"
    MBA = "mba"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class CardType(str, Enum):
    QA = "qa"
    CLOZE = "cloze"
    MCQ = "mcq"
    DIAGRAM = "diagram"


class Flashcard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    front: str
    back: str
    type: CardType = CardType.QA
    difficulty: Difficulty = Difficulty.MEDIUM
    options: Optional[list[str]] = None  # For MCQ type
    tags: list[str] = []


class GenerateRequest(BaseModel):
    text: str
    level: UserLevel = UserLevel.ENGINEER
    difficulty: Difficulty = Difficulty.MEDIUM
    subject: str = "general"
    num_cards: int = Field(default=10, ge=5, le=30)


class GenerateResponse(BaseModel):
    session_id: str
    flashcards: list[Flashcard]
    source_summary: str = ""
    level: UserLevel
    difficulty: Difficulty


class ExplainRequest(BaseModel):
    card: Flashcard
    level: UserLevel = UserLevel.ENGINEER


class ExplainResponse(BaseModel):
    explanation: str
    level: UserLevel


class QuizStartRequest(BaseModel):
    session_id: str
    timed: bool = True
    time_per_card: int = 30  # seconds


class QuizAnswer(BaseModel):
    card_id: str
    user_answer: str
    time_taken: float = 0.0  # seconds


class QuizAnswerResult(BaseModel):
    card_id: str
    correct: bool
    score: float  # 0.0 - 1.0 (semantic match score)
    correct_answer: str
    feedback: str


class QuizSessionResult(BaseModel):
    session_id: str
    total_cards: int
    correct: int
    score_pct: float
    streak: int
    best_streak: int
    weak_cards: list[str]
    results: list[QuizAnswerResult]


class SessionData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])
    created_at: float = Field(default_factory=time.time)
    level: UserLevel = UserLevel.ENGINEER
    difficulty: Difficulty = Difficulty.MEDIUM
    flashcards: list[Flashcard] = []
    quiz_results: list[QuizAnswerResult] = []
    ratings: dict[str, int] = {}  # card_id -> 1-5 star rating
    source_text: str = ""
    source_summary: str = ""


class UploadResponse(BaseModel):
    text: str
    filename: str = ""
    language: str = "en"


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    level: UserLevel = UserLevel.ENGINEER
    history: Optional[list[dict]] = []  # List of {"role": "user"|"assistant", "content": "..."}


class ChatResponse(BaseModel):
    response: str
    history: list[dict]
