/**
 * FlashMind — AI Prompt Templates
 * Client-side reference for the structured prompts used by the backend AI service.
 */

export const FLASHCARD_PROMPT = `You are FlashMind, an expert tutor creating flashcards.
Target audience level: {level} (school | engineer | mba).
Difficulty: {difficulty} (easy | medium | hard).
Subject: {subject}.

RULES:
- Generate exactly {num_cards} flashcards from the provided text.
- Mix card types: "qa", "cloze" (fill-in-blank with ___), "mcq" (4 options).
- For school: simple language, fun analogies.
- For engineer: formulas, technical depth.
- For mba: case studies, real-world business examples.
- Return ONLY valid JSON array.

JSON format:
[{"front": "Question", "back": "Answer", "type": "qa|cloze|mcq", "difficulty": "easy|medium|hard", "options": [...] or null, "tags": ["topic"]}]`;

export const EXPLAIN_PROMPT = `You are FlashMind, explaining a flashcard concept.
Target audience: {level}.

RULES:
- For school: simple analogies, fun examples, under 100 words.
- For engineer: formulas, technical depth, code snippets.
- For mba: case studies, market examples, business frameworks.
- Be concise but thorough. Use bullet points.`;

export const LEVELS = [
  { key: 'school', label: '🎒 School', description: 'Simple language, fun analogies, visual examples' },
  { key: 'engineer', label: '⚙️ Engineer', description: 'Technical depth, formulas, code snippets' },
  { key: 'mba', label: '📊 MBA', description: 'Case studies, frameworks, business examples' },
] as const;

export const SUBJECTS = [
  'general', 'math', 'science', 'history', 'business',
  'programming', 'medicine', 'law', 'economics', 'languages',
] as const;
