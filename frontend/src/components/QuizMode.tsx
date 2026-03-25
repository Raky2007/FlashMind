/**
 * FlashMind — Quiz Mode Component
 * Premium Redesign using Glassmorphism & Navy/Gold palette
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card as AntCard, Typography, Progress, Tag, Space, Rate, message } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flashcard, QuizAnswerResult, QuizSessionResult } from '../services/api';
import { startQuiz, submitAnswer, rateCard, saveLocalProgress, saveQuizHistory } from '../services/api';

export interface ExtendedQuizAnswerResult extends QuizAnswerResult {
  user_selected_option?: string;
}

const { Text, Title } = Typography;

interface QuizModeProps {
  sessionId: string;
  flashcards: Flashcard[];
  onComplete: (results: QuizSessionResult) => void;
}

type QuizState = 'ready' | 'playing' | 'answered' | 'complete';

const QuizMode: React.FC<QuizModeProps> = ({ sessionId, flashcards, onComplete }) => {
  const [state, setState] = useState<QuizState>('ready');
  const [quizCards, setQuizCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [lastResult, setLastResult] = useState<ExtendedQuizAnswerResult | null>(null);
  const [allResults, setAllResults] = useState<ExtendedQuizAnswerResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const currentCard = quizCards[currentIndex];

  useEffect(() => {
    if (state === 'playing' && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (state === 'playing' && timer === 0) {
      doSubmitAnswer();
    }
    return () => clearTimeout(timerRef.current);
  }, [state, timer]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startQuiz(sessionId, true, 30);
      setQuizCards(flashcards);
      setState('playing');
      setTimer(30);
      setCurrentIndex(0);
      setCorrectCount(0);
      setTotalScore(0);
      setStreak(0);
      setBestStreak(0);
      setAllResults([]);
      startTimeRef.current = Date.now();
    } catch {
      setQuizCards(flashcards);
      setState('playing');
      setTimer(30);
      setCurrentIndex(0);
      setCorrectCount(0);
      setTotalScore(0);
      setStreak(0);
      setBestStreak(0);
      setAllResults([]);
      startTimeRef.current = Date.now();
    }
    setLoading(false);
  };

  const doSubmitAnswer = async () => {
    if (!currentCard) return;
    clearTimeout(timerRef.current);

    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    setLoading(true);
    try {
      const resultObj = await submitAnswer(sessionId, currentCard.id, answer || '(no answer)', timeTaken);
      const result: ExtendedQuizAnswerResult = { ...resultObj, user_selected_option: answer };
      setLastResult(result);
      setAllResults(prev => [...prev, result]);
      setState('answered');
      setTotalScore(s => s + result.score);
      if (result.correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak(b => Math.max(b, newStreak));
        setCorrectCount(c => c + 1);
      } else {
        setStreak(0);
      }
    } catch {
      const ua = (answer || '').trim().toLowerCase();
      const ca = currentCard.back.trim().toLowerCase();
      const correct = ua === ca;
      const result: ExtendedQuizAnswerResult = {
        card_id: currentCard.id,
        correct,
        score: correct ? 3 : -1,
        correct_answer: currentCard.back,
        feedback: correct ? '✅ Correct! (+3 points)' : `❌ Incorrect. The answer is: ${currentCard.back}`,
        user_selected_option: answer,
      };
      setLastResult(result);
      setAllResults(prev => [...prev, result]);
      setState('answered');
      setTotalScore(s => s + result.score);
      if (correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak(b => Math.max(b, newStreak));
        setCorrectCount(c => c + 1);
      } else {
        setStreak(0);
      }
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < quizCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setLastResult(null);
      setState('playing');
      setTimer(30);
      startTimeRef.current = Date.now();
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setState('complete');
    const scorePct = quizCards.length > 0 ? Math.round((correctCount / quizCards.length) * 100 * 10) / 10 : 0;
    saveLocalProgress(sessionId, scorePct);
    
    // Save full quiz history for review
    saveQuizHistory({
      session_id: sessionId,
      timestamp: Date.now() / 1000,
      total_cards: quizCards.length,
      correct: correctCount,
      score_pct: scorePct,
      best_streak: bestStreak,
      results: allResults,
      questions: quizCards.map(c => ({ front: c.front, options: c.options })),
    });

    const results: QuizSessionResult = {
      session_id: sessionId,
      total_cards: quizCards.length,
      correct: correctCount,
      score_pct: scorePct,
      streak,
      best_streak: bestStreak,
      weak_cards: allResults.filter(r => !r.correct).map(r => r.card_id),
      results: allResults,
    };
    onComplete(results);
  };

  const handleRate = async (rating: number) => {
    if (!currentCard) return;
    try { await rateCard(sessionId, currentCard.id, rating); } catch { }
  };

  const handleMCQSelect = (option: string) => {
    if (state === 'playing') setAnswer(option);
  };

  const handleRestart = () => {
    setState('ready');
    setCurrentIndex(0);
    setAnswer('');
    setLastResult(null);
    setAllResults([]);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTimer(30);
  };

  if (state === 'ready') {
    return (
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '80px auto' }}>
        <div style={{ fontSize: 80, marginBottom: 24, opacity: 0.9 }}>🧠</div>
        <Title level={2} style={{ fontWeight: 800, color: '#003366', marginBottom: 16 }}>Ready for the Challenge?</Title>
        <Text style={{ fontSize: 18, color: 'var(--text-secondary)', display: 'block', marginBottom: 40, lineHeight: 1.6 }}>
          Test your mastery over {flashcards.length} questions. 
          <br />30 seconds per card. Let's see your high score!
        </Text>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleStart}
          loading={loading}
          id="generate-btn"
          style={{ height: 64, padding: '0 48px', fontSize: 18, borderRadius: 16 }}
        >
          Start Quiz
        </Button>
      </div>
    );
  }

  if (state === 'complete') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <AntCard bordered={false} style={{ textAlign: 'center', padding: 40, background: 'var(--glass-bg)', backdropFilter: 'blur(24px)', borderRadius: 32, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>{totalScore > 0 ? '🏆' : '💪'}</div>
          <Title level={2} style={{ fontWeight: 800, marginBottom: 8 }}>Quiz Complete!</Title>
          <div style={{ margin: '32px 0' }}>
            <Title level={1} style={{ color: totalScore > 0 ? 'var(--accent-secondary)' : '#FF4D4F', margin: 0, fontSize: 56 }}>
              {totalScore > 0 ? '+' : ''}{totalScore} pts
            </Title>
            <Text style={{ fontSize: 18, fontWeight: 600, opacity: 0.5 }}>FINAL SCORE</Text>
          </div>
          
          <Space size={40} style={{ marginBottom: 40 }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>{correctCount} / {quizCards.length}</Title>
              <Text type="secondary">Correct</Text>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}><FireOutlined style={{ color: '#FF4D4F' }} /> {bestStreak}</Title>
              <Text type="secondary">Best Streak</Text>
            </div>
          </Space>

          <Divider style={{ margin: '40px 0' }} />

          <div style={{ textAlign: 'left' }}>
            <Title level={4} style={{ marginBottom: 24 }}>Review your answers</Title>
            {allResults.map((res, i) => {
              const card = quizCards.find(c => c.id === res.card_id);
              return (
                <AntCard key={i} size="small" style={{ marginBottom: 16, borderRadius: 16, border: `1px solid ${res.correct ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.2)'}`, background: res.correct ? 'rgba(82, 196, 26, 0.02)' : 'rgba(255, 77, 79, 0.02)' }}>
                  <Text strong style={{ display: 'block', fontSize: 15, color: '#003366', marginBottom: 12 }}>{i + 1}. {card?.front}</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">Your Answer:</Text>
                      <Text strong style={{ color: res.correct ? '#52C41A' : '#FF4D4F' }}>{res.user_selected_option || '(None)'}</Text>
                    </Space>
                    {!res.correct && (
                      <Space direction="vertical" size={2}>
                        <Text type="secondary">Correct Answer:</Text>
                        <Text strong style={{ color: '#003366' }}>{res.correct_answer}</Text>
                      </Space>
                    )}
                    <Tag color={res.score > 0 ? 'green' : 'red'} style={{ borderRadius: 6 }}>{res.score > 0 ? '+' : ''}{res.score} pts</Tag>
                  </div>
                </AntCard>
              );
            })}
          </div>

          <Button size="large" icon={<ReloadOutlined />} onClick={handleRestart} style={{ marginTop: 32, borderRadius: 12, height: 50, padding: '0 32px' }}>Try Again</Button>
        </AntCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Progress
        percent={((currentIndex + (state === 'answered' ? 1 : 0)) / quizCards.length) * 100}
        showInfo={false}
        strokeColor={{ '0%': 'var(--accent-secondary)', '100%': 'var(--accent)' }}
        style={{ marginBottom: 24 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Space size={16}>
          <div style={{ padding: '10px 18px', borderRadius: 14, background: timer > 10 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(239, 68, 68, 0.1)', color: timer > 10 ? 'var(--accent)' : '#EF4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
            <ClockCircleOutlined /> {timer}s
          </div>
          <Text style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: 16 }}>{currentIndex + 1} <span style={{ opacity: 0.3 }}>/</span> {quizCards.length}</Text>
        </Space>
        
        <Space size={16}>
          <div style={{ padding: '10px 18px', borderRadius: 14, background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)', color: 'white', fontWeight: 800, boxShadow: '0 4px 12px var(--accent-glow)' }}>
             {totalScore} pts
          </div>
          {streak > 1 && (
            <Tag color="orange" style={{ padding: '4px 12px', borderRadius: 20, border: 'none', fontWeight: 700 }}>
              <FireOutlined /> {streak} STREAK
            </Tag>
          )}
        </Space>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <AntCard bordered={false} className="fm-card" style={{ padding: 12 }}>
            <div style={{ marginBottom: 32 }}>
              <Tag bordered={false} style={{ borderRadius: 8, fontWeight: 800, marginBottom: 20, background: 'var(--accent)', color: 'white', textTransform: 'uppercase', padding: '4px 12px' }}>{currentCard?.difficulty}</Tag>
              <Title level={2} style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em' }}>{currentCard?.front}</Title>
            </div>

            {currentCard?.type === 'mcq' && currentCard?.options ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {currentCard.options.map((opt, i) => (
                  <Button
                    key={i}
                    onClick={() => handleMCQSelect(opt)}
                    disabled={state === 'answered'}
                    style={{
                      height: 'auto', padding: '18px 24px', borderRadius: 18, textAlign: 'left',
                      border: answer === opt ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: answer === opt ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                      fontSize: 16, fontWeight: answer === opt ? 800 : 600, color: 'var(--text-primary)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.5,
                      boxShadow: answer === opt ? '0 8px 24px rgba(99, 102, 241, 0.15)' : 'none'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%' }}>
                      <span style={{ fontWeight: 900, color: 'var(--accent)', flexShrink: 0 }}>{String.fromCharCode(64 + i + 1)}</span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {state === 'answered' && opt === lastResult?.correct_answer && <CheckCircleOutlined style={{ color: 'var(--brand-success)', fontSize: 20, flexShrink: 0 }} />}
                      {state === 'answered' && answer === opt && !lastResult?.correct && <CloseCircleOutlined style={{ color: '#EF4444', fontSize: 20, flexShrink: 0 }} />}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onPressEnter={() => state === 'playing' && answer.trim() && doSubmitAnswer()}
                disabled={state === 'answered'}
                style={{ height: 60, borderRadius: 16, fontSize: 18, border: '2px solid transparent', background: 'rgba(0, 51, 102, 0.05)' }}
              />
            )}

            {state === 'answered' && lastResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 32, padding: 24, borderRadius: 20, background: lastResult.correct ? 'rgba(82, 196, 26, 0.05)' : 'rgba(255, 77, 79, 0.05)', border: `1px solid ${lastResult.correct ? '#52C41A' : '#FF4D4F'}` }}>
                <Text strong style={{ fontSize: 18, color: lastResult.correct ? '#237804' : '#a8071a', display: 'block', marginBottom: 8 }}>{lastResult.feedback}</Text>
                {!lastResult.correct && <Text style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>The answer is: <strong style={{color: '#003366'}}>{lastResult.correct_answer}</strong></Text>}
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>CARD RATING</Text>
                  <Rate defaultValue={3} onChange={handleRate} />
                </Space>
              </motion.div>
            )}
          </AntCard>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
        {state === 'playing' ? (
          <Button type="primary" size="large" onClick={doSubmitAnswer} loading={loading} disabled={!answer.trim()} style={{ height: 50, padding: '0 40px', borderRadius: 12 }}>Submit Answer</Button>
        ) : (
          <Button type="primary" size="large" onClick={handleNext} style={{ height: 50, padding: '0 40px', borderRadius: 12 }}>{currentIndex === quizCards.length - 1 ? 'Finish & Review' : 'Next Question'}</Button>
        )}
      </div>
    </div>
  );
};

const Divider = ({ style }: { style?: React.CSSProperties }) => <div style={{ height: 1, background: 'var(--border)', ...style }} />;

export default QuizMode;

