"""
FlashMind — AI Service
Ollama integration with mock fallback for demo without GPU.
Structured prompts for flashcard generation & explanations.
"""
import json
import random
import re
from app.models import (
    Flashcard, CardType, Difficulty, UserLevel,
    GenerateRequest, GenerateResponse, ExplainRequest, ChatRequest
)

# ---------- Ollama client (lazy import) ----------
_ollama_available: bool | None = None
_MODEL = "phi3"  # 3.8B model - much faster than llama3.1 on CPU


def _check_ollama() -> bool:
    global _ollama_available
    if _ollama_available is not None:
        return _ollama_available
    
    try:
        import ollama as _ol
        _ol.list()
        _ollama_available = True
    except Exception:
        _ollama_available = False
    return _ollama_available


# ---------- Prompt templates ----------

FLASHCARD_SYSTEM_PROMPT = """You are FlashMind, an expert tutor. Create exactly {num_cards} high-quality multiple-choice questions from the provided text.
Target audience level: {level}.
Difficulty: {difficulty}.
Subject: {subject}.

STRICT RULES:
1. Return ONLY a valid JSON object with a "flashcards" array.
   Format: {{"flashcards": [{{"front": "Question?", "back": "Answer", "options": ["Choice1", "Choice2", "Choice3", "Choice4"], "type": "mcq", "difficulty": "{difficulty}", "tags": []}}, ...]}}
2. FOCUS ONLY on the exact facts provided in the text.
3. The "front" field MUST be a brief QUESTION starting with a question word (What, How, Which, Why, Who) and ending in "?".
4. The "back" field MUST be the correct, concise answer string.
5. In "options", provide 4 UNIQUE and relevant answers. DO NOT use single letters like "A", "B", "C" or "All of the above".
6. Generate exactly {num_cards} cards.

LEVEL-SPECIFIC INSTRUCTIONS:
- For School: Use very simple language, fun examples, and focus on basic definitions.
- For Engineer: Use technical terminology, focus on architecture, logic, and implementation details.
- For MBA: Focus on business value, ROI, strategy, and high-level concepts.

DIFFICULTY-SPECIFIC INSTRUCTIONS:
- For Easy: Focus on direct facts and "what is" questions.
- For Medium: Focus on "how" and "why" things work together.
- For Hard: Focus on edge cases, complex relationships, and subtle details.
"""

EXPLAIN_SYSTEM_PROMPT = """You are FlashMind, explaining a flashcard concept.
Target audience: {level}.

RULES:
- For school: use simple analogies, fun examples, keep it under 100 words.
- For engineer: include formulas, technical depth, code snippets if relevant.
- For mba: use case studies, market examples, business frameworks.
- Be concise but thorough. Use bullet points.
- Do NOT use markdown bolding (like **text**).
"""

CHAT_SYSTEM_PROMPT = """You are FMAI, the official AI assistant for FlashMind.
Your goal is to help users understand their study material deeply but simply.
Target audience level: {level}.

RULES:
- Be helpful, encouraging, and use a friendly tone.
- Keep explanations SIMPLE and easy to grasp, regardless of the complexity of the topic.
- Provide DETAILED responses (don't be too brief), but break them into SHORT sentences.
- Use PLENTY OF WHITE SPACE. Every 2-3 sentences should be a new paragraph.
- Use simple analogies often to explain difficult concepts.
- You MAY use markdown bolding (**text**) for key terms to make them stand out.
- For school: Use very basic words and fun examples.
- For engineer: Explain the 'why' and 'how' clearly but concisely.
- For mba: Focus on practical application and strategic impact.
- Always ensure there is a double line break between paragraphs for maximum readability.
"""


# ---------- Ollama generation ----------

async def _generate_with_ollama(system_prompt: str, user_text: str) -> str:
    """Call Ollama API for text generation."""
    print(f"[AI] Calling Ollama model: {_MODEL}...")
    try:
        import ollama
        response = ollama.chat(
            model=_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            options={"temperature": 0.1, "num_predict": 4096},
            format="json",
        )
        return response["message"]["content"]
    except Exception as e:
        print(f"[AI] Ollama error: {e}")
        return ""


def _parse_flashcards_json(raw: str) -> list[dict]:
    """Extract JSON object from AI response (handles markdown fences)."""
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`")
    # Find JSON object or array
    match_obj = re.search(r"\{.*\}", cleaned, re.DOTALL)
    match_arr = re.search(r"\[.*\]", cleaned, re.DOTALL)
    
    try:
        data = None
        if match_obj:
            data = json.loads(match_obj.group())
        elif match_arr:
            data = json.loads(match_arr.group())
            
        if isinstance(data, dict):
            # Case 1: Standard wrapper object {"flashcards": [...]}
            if "flashcards" in data and isinstance(data["flashcards"], list):
                return data["flashcards"]
            # Case 2: Single card object {"front": "...", "back": "..."}
            if "front" in data and "back" in data:
                return [data]
        elif isinstance(data, list):
            # Case 3: Raw list of cards [...]
            return data
            
    except json.JSONDecodeError:
        pass
    return []


# ---------- Mock fallback generator ----------

_MOCK_TEMPLATES = {
    "mcq": [
        ("Identify the key characteristic of {concept}.", "{detail}"),
        ("What is the primary function or definition of {concept}?", "{detail}"),
        ("Which statement accurately reflects the nature of {concept}?", "{detail}"),
        ("How would you explain the concept of {concept}?", "{detail}"),
        ("What is the main idea behind {concept}?", "{detail}"),
    ],
}


def _extract_concepts(text: str) -> list[dict]:
    """Extract key concepts from text using simple heuristics."""
    sentences = [s.strip() for s in re.split(r'[.!?\n]', text) if len(s.strip()) > 20]
    concepts = []
    for sent in sentences[:20]:
        words = sent.split()
        # Take capitalized words or first noun-phrase as concept
        concept_words = [w for w in words if w[0].isupper() and len(w) > 2] if words else []
        concept = " ".join(concept_words[:3]) if concept_words else " ".join(words[:3])
        concepts.append({
            "concept": concept,
            "detail": sent,
            "subject": "general",
        })
    return concepts


def _generate_mock_flashcards(req: GenerateRequest) -> list[Flashcard]:
    """Generate flashcards without AI — uses text extraction heuristics."""
    concepts = _extract_concepts(req.text)
    if not concepts:
        concepts = [{"concept": "Key Concept", "detail": req.text[:200], "subject": req.subject}]

    cards: list[Flashcard] = []
    difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]
    card_types = [CardType.MCQ]

    for i, concept in enumerate(concepts[:req.num_cards]):
        ct = card_types[i % len(card_types)]
        diff = difficulties[i % len(difficulties)] if req.difficulty == Difficulty.MEDIUM else req.difficulty
        templates = _MOCK_TEMPLATES["mcq"]
        tmpl = templates[i % len(templates)]

        front = tmpl[0].format(**concept)
        back = tmpl[1].format(**concept)

        options = [back, f"Not related to {concept['concept']}", "None of the above", "All of the above"]
        random.shuffle(options)

        cards.append(Flashcard(
            front=front,
            back=back,
            type=ct,
            difficulty=diff,
            options=options,
            tags=[req.subject, concept.get("concept", "")[:20]],
        ))

    return cards


# ---------- Public API ----------

async def generate_flashcards(req: GenerateRequest) -> list[Flashcard]:
    """Generate flashcards from text — tries Ollama, falls back to mock."""
    if _check_ollama():
        system_prompt = FLASHCARD_SYSTEM_PROMPT.format(
            level=req.level.value,
            difficulty=req.difficulty.value,
            subject=req.subject,
            num_cards=req.num_cards + 2, # Smaller buffer for speed
        )
        raw = await _generate_with_ollama(system_prompt, req.text[:10000])
        parsed = _parse_flashcards_json(raw)
        if parsed:
            cards = []
            for item in parsed[:min(req.num_cards * 2, len(parsed))]:
                try:
                    front = str(item.get("front", "")).strip()
                    back = str(item.get("back", "")).strip()
                    
                    # Clean up common AI prefixes in answer
                    for prefix in ["Answer:", "The answer is:", "Correct answer:"]:
                        if back.lower().startswith(prefix.lower()):
                            back = back[len(prefix):].strip()
                    
                    if not front or not back:
                        continue
                        
                    raw_options = item.get("options", [])
                    if not isinstance(raw_options, list):
                        raw_options = []
                    
                    options = [str(o).strip() for o in raw_options if str(o).strip()]
                    
                    # Fail-safe: Detect and remove forbidden lazy options/single letters
                    forbidden = ["all of the above", "none of the above", "correct", "incorrect", "not related to"]
                    options = [o for o in options if len(o) > 1 and not any(f in o.lower() for f in forbidden)]

                    # Programmatic fail-safe: Ensure correct answer is in options
                    if back not in options:
                        options.append(back)
                        
                    # Pad options if there are too few (but avoid the forbidden ones)
                    if len(options) < 4:
                        # Try to find other potential answers from previous cards if needed
                        # For now, just add meaningful placeholders if the AI failed
                        extra_distractors = ["Option not provided", "Unknown", "Inapplicable", "Data missing"]
                        for dist in extra_distractors:
                            if len(options) >= 4: break
                            if dist not in options: options.append(dist)
                        
                    # Deduplicate and ensure exactly 4 options
                    options = list(dict.fromkeys(options))
                    if len(options) > 4:
                        wrong_options = [o for o in options if o != back]
                        random.shuffle(wrong_options)
                        options = [back] + wrong_options[:3]
                        
                    random.shuffle(options)

                    # Safe Enum conversions
                    try:
                        ct = CardType(item.get("type", "mcq"))
                    except ValueError:
                        ct = CardType.MCQ
                        
                    try:
                        diff = Difficulty(item.get("difficulty", req.difficulty.value))
                    except ValueError:
                        diff = req.difficulty

                    cards.append(Flashcard(
                        front=front,
                        back=back,
                        type=ct,
                        difficulty=diff,
                        options=options,
                        tags=item.get("tags", [req.subject]),
                    ))
                except (ValueError, KeyError, AttributeError):
                    continue
            if cards:
                # Prioritize cards that follow the question mark rule
                good_cards = [c for c in cards if c.front.strip().endswith('?')]
                other_cards = [c for c in cards if not c.front.strip().endswith('?')]
                final_cards = (good_cards + other_cards)[:req.num_cards]
                return final_cards

    # Fallback to mock
    print(f"[AI] Falling back to mock generator (Ollama available: {_check_ollama()})")
    return _generate_mock_flashcards(req)


async def generate_explanation(req: ExplainRequest) -> str:
    """Generate explanation for a flashcard concept."""
    if _check_ollama():
        system_prompt = EXPLAIN_SYSTEM_PROMPT.format(level=req.level.value)
        user_msg = (
            f"Flashcard question: {req.card.front}\n"
            f"Answer: {req.card.back}\n\n"
            f"Explain this concept in detail for a {req.level.value} audience."
        )
        result = await _generate_with_ollama(system_prompt, user_msg)
        if result.strip():
            return result.strip()

    # Mock explanation fallback
    explanations = {
        UserLevel.SCHOOL: (
            f"🎓 **Simple Explanation:**\n\n"
            f"Think of it like this — {req.card.front}\n\n"
            f"The answer is: **{req.card.back}**\n\n"
            f"Imagine you're explaining this to a friend. "
            f"It's like when you learn a new game — the rules seem hard at first, "
            f"but once you understand the basics, everything clicks! 🎯"
        ),
        UserLevel.ENGINEER: (
            f"⚙️ **Technical Explanation:**\n\n"
            f"**Q:** {req.card.front}\n\n"
            f"**A:** {req.card.back}\n\n"
            f"**Deep Dive:** This concept is fundamental in the domain. "
            f"Understanding the underlying principles helps in building robust systems. "
            f"Consider how this applies to real-world engineering problems and system design."
        ),
        UserLevel.MBA: (
            f"📊 **Business Context:**\n\n"
            f"**Concept:** {req.card.front}\n\n"
            f"**Key Insight:** {req.card.back}\n\n"
            f"**Real-world Application:** In business strategy, this concept drives "
            f"decision-making and competitive advantage. Think about how leading companies "
            f"leverage this in their operations and market positioning."
        ),
    }
    return explanations.get(req.level, explanations[UserLevel.ENGINEER])


def summarize_text(text: str, max_len: int = 200) -> str:
    """Create a brief summary of input text."""
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
    summary = '. '.join(sentences[:3])
    return (summary[:max_len] + '...') if len(summary) > max_len else summary


async def chat_with_ai(req: ChatRequest) -> tuple[str, list[dict]]:
    """General chat with FMAI assistant."""
    history = req.history or []
    
    if _check_ollama():
        system_prompt = CHAT_SYSTEM_PROMPT.format(level=req.level.value)
        
        # Build messages for Ollama
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": req.message})
        
        try:
            import ollama
            response = ollama.chat(
                model=_MODEL,
                messages=messages,
                options={"temperature": 0.7, "num_predict": 1024},
            )
            ai_msg = response["message"]["content"]
            
            # Update history
            new_history = history + [
                {"role": "user", "content": req.message},
                {"role": "assistant", "content": ai_msg}
            ]
            return ai_msg, new_history
        except Exception as e:
            print(f"[AI] Chat error: {e}")

    # Fallback/Error response
    fallback_msg = (
        "I'm sorry, I'm having trouble connecting to my brain (Ollama) right now. "
        "Please ensure Ollama is running locally with the qwen2.5:0.5b model!"
    )
    return fallback_msg, history + [
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": fallback_msg}
    ]
