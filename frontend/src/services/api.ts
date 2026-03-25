/**
 * FlashMind — API Service
 * Axios client with FULL client-side fallback when backend is unavailable.
 * Everything works standalone — no backend needed for demo.
 */
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const api = axios.create({
  baseURL: '/api',
  timeout: 180000, // Increased to 180s for Llama 3.1 8B CPU processing
  headers: { 'Content-Type': 'application/json' },
});

// -------- Types --------

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  type: 'qa' | 'cloze' | 'mcq' | 'diagram';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[] | null;
  tags: string[];
}

export interface GenerateRequest {
  text: string;
  level: 'school' | 'engineer' | 'mba';
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  num_cards: number;
}

export interface GenerateResponse {
  session_id: string;
  flashcards: Flashcard[];
  source_summary: string;
  level: string;
  difficulty: string;
}

export interface QuizCard {
  id: string;
  front: string;
  type: string;
  options?: string[] | null;
  difficulty: string;
}

export interface QuizAnswerResult {
  card_id: string;
  correct: boolean;
  score: number;
  correct_answer: string;
  feedback: string;
  user_selected_option?: string;
}

export interface QuizSessionResult {
  session_id: string;
  total_cards: number;
  correct: number;
  score_pct: number;
  streak: number;
  best_streak: number;
  weak_cards: string[];
  results: QuizAnswerResult[];
}

export interface ExplainResponse {
  explanation: string;
  level: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  level: 'school' | 'engineer' | 'mba';
  history: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  history: ChatMessage[];
}

// ================================================
// CLIENT-SIDE SESSION STORE (localStorage-backed)
// ================================================
const STORAGE_KEYS = {
  sessions: 'flashmind_sessions',
  progress: 'flashmind_progress',
  quizHistory: 'flashmind_quiz_history',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { }
}

interface LocalSession {
  flashcards: Flashcard[];
  level: string;
  difficulty: string;
  summary: string;
  createdAt: number;
}

// Load persisted data on startup
const _localSessionsObj: Record<string, LocalSession> = loadFromStorage(STORAGE_KEYS.sessions, {});
const _localSessions: Map<string, LocalSession> = new Map(Object.entries(_localSessionsObj));
const _localProgress: Array<{ session_id: string; score_pct: number; timestamp: number }> = loadFromStorage(STORAGE_KEYS.progress, []);

function persistSessions() {
  saveToStorage(STORAGE_KEYS.sessions, Object.fromEntries(_localSessions));
}

function persistProgress() {
  saveToStorage(STORAGE_KEYS.progress, _localProgress);
}

export interface QuizHistoryEntry {
  session_id: string;
  timestamp: number;
  total_cards: number;
  correct: number;
  score_pct: number;
  best_streak: number;
  results: QuizAnswerResult[];
  questions: { front: string; options?: string[] | null }[];
}

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ================================================
// CLIENT-SIDE MOCK FLASHCARD GENERATOR
// ================================================
function extractConcepts(text: string): Array<{ concept: string; detail: string }> {
  const sentences = text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const concepts: Array<{ concept: string; detail: string }> = [];

  for (const sent of sentences.slice(0, 25)) {
    const words = sent.split(/\s+/);
    // Find capitalized words or key phrases
    const caps = words.filter(w => w.length > 2 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase());
    const concept = caps.length > 0 ? caps.slice(0, 3).join(' ') : words.slice(0, 4).join(' ');
    concepts.push({ concept, detail: sent });
  }

  return concepts;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMockFlashcards(req: GenerateRequest): Flashcard[] {
  const concepts = extractConcepts(req.text);
  if (concepts.length === 0) {
    // If no sentences found, create cards from chunks of text
    const chunks = req.text.match(/.{20,100}/g) || [req.text.substring(0, 200)];
    for (const chunk of chunks.slice(0, 5)) {
      concepts.push({ concept: chunk.split(' ').slice(0, 3).join(' '), detail: chunk.trim() });
    }
  }

  const cards: Flashcard[] = [];
  const diffs: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

  for (let i = 0; i < Math.min(req.num_cards, concepts.length); i++) {
    const c = concepts[i];
    const diff = req.difficulty !== 'medium' ? req.difficulty : diffs[i % diffs.length];

    const templates = [
      `What is the primary function or definition of ${c.concept}?`,
      `Identify the key characteristic of ${c.concept}.`,
      `How would you explain the concept of ${c.concept}?`,
      `Which statement accurately reflects the nature of ${c.concept}?`,
      `What is the main idea behind ${c.concept}?`
    ];
    let front = templates[i % templates.length];
    let back = c.detail;
    
    const distractors = [
      `Not related to ${c.concept}`,
      `The opposite of ${c.concept}`,
      `None of the above`,
    ];
    let options = shuffle([c.detail, ...distractors]);

    cards.push({
      id: uid(),
      front,
      back,
      type: 'mcq',
      difficulty: diff,
      options,
      tags: [req.subject, c.concept.substring(0, 20)],
    });
  }

  // If we need more cards than concepts, create variations
  while (cards.length < req.num_cards && concepts.length > 0) {
    const c = concepts[cards.length % concepts.length];
    
    // Create an MCQ variation
    const distractors = [
      `A misunderstanding of ${c.detail.substring(0, 20)}`,
      `The opposite idea`,
      `Not enough context provided`,
    ];
    
    cards.push({
      id: uid(),
      front: `What is the most accurate summary of ${c.concept}?`,
      back: c.detail,
      type: 'mcq',
      difficulty: req.difficulty,
      options: shuffle([c.detail, ...distractors]),
      tags: [req.subject],
    });
    if (cards.length >= req.num_cards) break;
  }

  return cards;
}

// ================================================
// FUZZY ANSWER SCORING (client-side)
// ================================================
function scoreAnswer(userAnswer: string, correctAnswer: string): { correct: boolean; score: number } {
  const ua = userAnswer.trim().toLowerCase();
  const ca = correctAnswer.trim().toLowerCase();

  if (ua === ca) return { correct: true, score: 3 };
  return { correct: false, score: -1 };
}

// ================================================
// PUBLIC API FUNCTIONS (with fallback)
// ================================================

// -------- Upload (file upload needs backend - show clear message) --------

export const uploadPdf = async (file: File) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/upload/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { text: string; filename: string };
  } catch {
    console.log('[FlashMind] Backend unavailable — extracting PDF text client-side');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }
      
      if (!fullText.trim()) {
        throw new Error('No readable text found in PDF. It might be a scanned image.');
      }
      
      return { text: fullText, filename: file.name };
    } catch (err: any) {
      throw new Error(`Failed to read PDF: ${err.message || 'Unknown error'}`);
    }
  }
};

export const uploadImage = async (file: File) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { text: string; filename: string };
  } catch (err: any) {
    const msg = err?.response?.data?.detail || err?.message || 'OCR failed';
    throw new Error(`Image OCR Error: ${msg}. (Make sure backend is running and dependencies are installed)`);
  }
};

export const uploadVoice = async (file: File) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/upload/voice', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { text: string; filename: string };
  } catch (err: any) {
    const msg = err?.response?.data?.detail || err?.message || 'Transcription failed';
    throw new Error(`Voice Upload Error: ${msg}. (Make sure backend is running and dependencies are installed)`);
  }
};

// -------- Generate (FULL client-side fallback) --------

export const generateFlashcards = async (req: GenerateRequest): Promise<GenerateResponse> => {
  // Try backend first
  try {
    const { data } = await api.post('/generate/', req);
    // Save to local store as well
    const resp = data as GenerateResponse;
    _localSessions.set(resp.session_id, {
      flashcards: resp.flashcards,
      level: resp.level,
      difficulty: resp.difficulty,
      summary: resp.source_summary,
      createdAt: Date.now() / 1000,
    });
    persistSessions();
    return resp;
  } catch {
    // FALLBACK: generate client-side
    console.log('[FlashMind] Backend unavailable — using client-side generation');
    const cards = generateMockFlashcards(req);
    const sessionId = uid();
    const summary = req.text.split(/[.!?]/).filter(s => s.trim().length > 10).slice(0, 2).join('. ').substring(0, 200);

    _localSessions.set(sessionId, {
      flashcards: cards,
      level: req.level,
      difficulty: req.difficulty,
      summary: summary || 'Generated flashcards',
      createdAt: Date.now() / 1000,
    });
    persistSessions();

    return {
      session_id: sessionId,
      flashcards: cards,
      source_summary: summary,
      level: req.level,
      difficulty: req.difficulty,
    };
  }
};

export const explainCard = async (card: Flashcard, level: string): Promise<ExplainResponse> => {
  try {
    const { data } = await api.post('/generate/explain', { card, level });
    return data as ExplainResponse;
  } catch {
    // Client-side explanation fallback
    const explanations: Record<string, string> = {
      school: `🎓 **Simple Explanation:**\n\n**Question:** ${card.front}\n\n**Answer:** ${card.back}\n\nThink of it like this — imagine you're explaining it to a friend. The key idea is simple: once you understand the basics, everything clicks together! 🎯\n\n**Tip:** Try to connect this with something you already know.`,
      engineer: `⚙️ **Technical Explanation:**\n\n**Q:** ${card.front}\n\n**A:** ${card.back}\n\n**Deep Dive:** This is a core concept. Understanding the underlying principles helps build robust mental models. Consider edge cases and how this interacts with related concepts in the system.\n\n**Key Takeaway:** Focus on the "why" behind this concept.`,
      mba: `📊 **Business Context:**\n\n**Concept:** ${card.front}\n\n**Key Insight:** ${card.back}\n\n**Application:** In business strategy, this drives decision-making and competitive advantage. Think about how leading companies leverage this in operations and market positioning.\n\n**Framework:** Consider this through the lens of Porter's Five Forces or SWOT analysis.`,
    };
    return {
      explanation: explanations[level] || explanations['engineer'],
      level,
    };
  }
};

// -------- Chat (FMAI) --------

export const chatWithAI = async (req: ChatRequest): Promise<ChatResponse> => {
  try {
    const { data } = await api.post('/chat', req);
    return data as ChatResponse;
  } catch {
    // Client-side fallback for demo
    console.log('[FlashMind] Backend unavailable — using client-side mock chat');
    const aiResponse = `I'm your FMAI assistant! (Note: Local LLM is currently disconnected). You asked: "${req.message}". To use the real Qwen2.5 model, please ensure Ollama is running!`;
    
    return {
      response: aiResponse,
      history: [...req.history, { role: 'user', content: req.message }, { role: 'assistant', content: aiResponse }]
    };
  }
};

// -------- Quiz (FULL client-side fallback) --------

export const startQuiz = async (sessionId: string, timed = true, timePerCard = 30) => {
  // Try backend first
  try {
    const { data } = await api.post('/quiz/start', {
      session_id: sessionId,
      timed,
      time_per_card: timePerCard,
    });
    return data as { session_id: string; total_cards: number; cards: QuizCard[] };
  } catch {
    // Client-side fallback
    const session = _localSessions.get(sessionId);
    if (!session) throw new Error('Session not found. Please generate flashcards first.');
    return {
      session_id: sessionId,
      total_cards: session.flashcards.length,
      cards: session.flashcards.map(c => ({
        id: c.id,
        front: c.front,
        type: c.type,
        options: c.options,
        difficulty: c.difficulty,
      })),
    };
  }
};

export const submitAnswer = async (sessionId: string, cardId: string, userAnswer: string, timeTaken = 0) => {
  try {
    const { data } = await api.post('/quiz/answer', {
      card_id: cardId,
      user_answer: userAnswer,
      time_taken: timeTaken,
    }, { params: { session_id: sessionId } });
    return data as QuizAnswerResult;
  } catch {
    // Client-side grading
    const session = _localSessions.get(sessionId);
    const card = session?.flashcards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    const { correct, score } = scoreAnswer(userAnswer, card.back);
    return {
      card_id: cardId,
      correct,
      score,
      correct_answer: card.back,
      feedback: correct
        ? (score >= 0.9 ? '🎉 Correct! Great job!' : '✅ Close enough! Well done!')
        : `❌ Not quite. The answer is: ${card.back}`,
    };
  }
};

export const rateCard = async (sessionId: string, cardId: string, rating: number) => {
  try {
    const { data } = await api.post('/quiz/rate', null, {
      params: { session_id: sessionId, card_id: cardId, rating },
    });
    return data;
  } catch {
    const intervals: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };
    return { card_id: cardId, rating, next_review_days: intervals[rating] || 4 };
  }
};

export const getQuizResults = async (sessionId: string): Promise<QuizSessionResult> => {
  try {
    const { data } = await api.get(`/quiz/results/${sessionId}`);
    return data as QuizSessionResult;
  } catch {
    return {
      session_id: sessionId,
      total_cards: 0,
      correct: 0,
      score_pct: 0,
      streak: 0,
      best_streak: 0,
      weak_cards: [],
      results: [],
    };
  }
};

export const getSessions = async () => {
  try {
    const { data } = await api.get('/quiz/sessions');
    return data as Array<{
      id: string;
      created_at: number;
      level: string;
      difficulty: string;
      num_cards: number;
      source_summary: string;
    }>;
  } catch {
    // Return local sessions
    return Array.from(_localSessions.entries()).map(([id, s]) => ({
      id,
      created_at: s.createdAt,
      level: s.level,
      difficulty: s.difficulty,
      num_cards: s.flashcards.length,
      source_summary: s.summary,
    }));
  }
};

export const getProgress = async () => {
  try {
    const { data } = await api.get('/quiz/progress');
    return data as Array<{ session_id: string; score_pct: number; timestamp: number }>;
  } catch {
    return _localProgress;
  }
};

// -------- Export (client-side only — no backend needed) --------

export const exportSession = (sessionId: string, format: 'json' | 'csv' | 'anki') => {
  const session = _localSessions.get(sessionId);
  if (!session) {
    // Try backend route
    window.open(`/api/export/${sessionId}?format=${format}`, '_blank');
    return;
  }

  const cards = session.flashcards;
  let content = '';
  let mimeType = '';
  let ext = '';

  if (format === 'json') {
    content = JSON.stringify(cards, null, 2);
    mimeType = 'application/json';
    ext = 'json';
  } else if (format === 'csv') {
    const rows = [['Front', 'Back', 'Type', 'Difficulty', 'Tags'].join(',')];
    for (const c of cards) {
      rows.push([`"${c.front}"`, `"${c.back}"`, c.type, c.difficulty, `"${c.tags.join('; ')}"`].join(','));
    }
    content = rows.join('\n');
    mimeType = 'text/csv';
    ext = 'csv';
  } else {
    content = cards.map(c => `${c.front}\t${c.back}`).join('\n');
    mimeType = 'text/tab-separated-values';
    ext = 'txt';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashmind_${sessionId}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

// Save progress locally (called by QuizMode) — now persisted to localStorage
export const saveLocalProgress = (sessionId: string, scorePct: number) => {
  _localProgress.push({ session_id: sessionId, score_pct: scorePct, timestamp: Date.now() / 1000 });
  persistProgress();
};

// Quiz History — save and retrieve full quiz results for review
export const saveQuizHistory = (entry: QuizHistoryEntry) => {
  const history: QuizHistoryEntry[] = loadFromStorage(STORAGE_KEYS.quizHistory, []);
  history.unshift(entry); // newest first
  if (history.length > 20) history.length = 20; // keep last 20
  saveToStorage(STORAGE_KEYS.quizHistory, history);
};

export const getQuizHistory = (): QuizHistoryEntry[] => {
  return loadFromStorage(STORAGE_KEYS.quizHistory, []);
};

export default api;
