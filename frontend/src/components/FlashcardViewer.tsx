/**
 * FlashMind — Flashcard Viewer Component
 * Premium Redesign using Glassmorphism & Navy/Gold palette
 */
import React, { useState, useCallback } from 'react';
import { Button, Tag, Space, Typography, Tooltip, Card as AntCard } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  BulbOutlined,
  SoundOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Flashcard, ExplainResponse } from '../services/api';
import { explainCard } from '../services/api';

const { Text, Title } = Typography;

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  level: string;
  sessionId: string;
}

const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ flashcards, level }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const card = flashcards[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setExplanation(null);
    }
  }, [currentIndex, flashcards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setExplanation(null);
    }
  }, [currentIndex]);

  const handleExplain = async () => {
    setLoadingExplain(true);
    try {
      const resp: ExplainResponse = await explainCard(card, level);
      setExplanation(resp.explanation);
    } catch {
      setExplanation('Could not generate explanation. Make sure the backend is running.');
    }
    setLoadingExplain(false);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!card) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Top Meta Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Space size={12}>
          <Tag color="indigo" bordered={false} style={{ borderRadius: 10, padding: '4px 12px', fontWeight: 700, textTransform: 'uppercase', background: 'var(--accent)', color: 'white' }}>
            {card.difficulty}
          </Tag>
          <Tag bordered={false} style={{ borderRadius: 10, padding: '4px 12px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
            {card.type.toUpperCase()}
          </Tag>
        </Space>
        <Text style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 18, opacity: 0.8 }}>
          {currentIndex + 1} <span style={{ opacity: 0.3 }}>/</span> {flashcards.length}
        </Text>
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="flashcard-container"
        onClick={() => setFlipped(!flipped)}
        style={{ height: 520, cursor: 'pointer', perspective: 2000 }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
        >
          {/* Front Side */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '36px 40px', background: 'var(--glass-bg)', backdropFilter: 'blur(24px)',
            borderRadius: 32, border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)',
            textAlign: 'center', overflowY: 'auto'
          }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, marginBottom: 20, color: 'var(--accent)', opacity: 0.8, flexShrink: 0 }}>
              IDENTIFY CONCEPT
            </Text>
            <Title level={3} style={{ margin: '0 0 20px 0', fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.03em', flexShrink: 0 }}>{card.front}</Title>

            
            {card.type === 'mcq' && card.options && (
              <div style={{ marginTop: 8, textAlign: 'left', width: '100%', flexShrink: 0 }}>
                {card.options.map((opt, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', margin: '8px 0', borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.08)',
                    fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                    wordBreak: 'break-word', lineHeight: 1.4
                  }}>
                    <span style={{ fontWeight: 900, color: 'var(--accent)', marginRight: 12 }}>{String.fromCharCode(64 + i + 1)}</span>
                    {opt}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: 'auto', paddingTop: 16, flexShrink: 0 }}>
              <div style={{ padding: '8px 16px', borderRadius: 20, background: 'rgba(0,0,0,0.03)', fontSize: 12, fontWeight: 700, opacity: 0.5 }}>
                CLICK CARD TO REVEAL
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div style={{
            position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 40, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 32, transform: 'rotateY(180deg)',
            textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, marginBottom: 24, color: 'var(--accent)' }}>
              CORE EXPLANATION
            </Text>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{card.back}</Title>
            <div style={{ marginTop: 32, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', fontSize: 12, fontWeight: 700, opacity: 0.6, color: 'white' }}>
              TAP TO FLIP BACK
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <Button
          size="large"
          icon={<LeftOutlined />}
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{ borderRadius: 12, height: 48 }}
        >
          Previous
        </Button>

        <Space size={16}>
          <Tooltip title="Listen">
            <Button
              size="large"
              shape="circle"
              icon={<SoundOutlined />}
              onClick={(e) => { e.stopPropagation(); handleSpeak(flipped ? card.back : card.front); }}
              style={{ background: 'rgba(0, 51, 102, 0.05)', border: 'none', color: '#003366' }}
            />
          </Tooltip>
          <Tooltip title="AI Help">
            <Button
              size="large"
              shape="circle"
              icon={<BulbOutlined />}
              onClick={(e) => { e.stopPropagation(); handleExplain(); }}
              loading={loadingExplain}
              type={explanation ? 'primary' : 'default'}
              style={explanation ? { boxShadow: '0 8px 16px rgba(255, 215, 0, 0.3)' } : {}}
            />
          </Tooltip>
        </Space>

        <Button
          size="large"
          type="primary"
          icon={<RightOutlined />}
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
          style={{ borderRadius: 12, height: 48, padding: '0 32px' }}
        >
          Next
        </Button>
      </div>

      {/* Explanation Window */}
      <AnimatePresence>
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ marginTop: 32 }}
          >
            <AntCard bordered={false} style={{ borderRadius: 24, background: 'rgba(0, 51, 102, 0.03)', border: '1px solid rgba(0, 51, 102, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                  <InfoCircleOutlined style={{ color: 'var(--accent-secondary)' }} />
                  <Text strong style={{ color: '#003366' }}>AI Masterclass ({level})</Text>
                </Space>
                <Button size="small" type="text" icon={<SoundOutlined />} onClick={() => handleSpeak(explanation)}>Listen</Button>
              </div>
              <Text style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{explanation}</Text>
            </AntCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardViewer;

