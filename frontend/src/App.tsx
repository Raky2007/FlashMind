/**
 * FlashMind — App Shell
 * Main application with tab navigation, dark mode toggle, Antd theming.
 */
import React, { useState, useCallback } from 'react';
import { ConfigProvider, Layout, Switch, Space, Typography, theme, Button } from 'antd';
import {
  BulbOutlined,
  BulbFilled,
  ThunderboltFilled,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { lightTheme, darkTheme } from './theme/themeConfig';
import UploadForm from './components/UploadForm';
import FlashcardViewer from './components/FlashcardViewer';
import QuizMode from './components/QuizMode';
import FMAIChat from './components/FMAIChat';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import type { GenerateResponse, QuizSessionResult } from './services/api';

const { Content } = Layout;
const { Text, Title } = Typography;

type TabKey = 'create' | 'study' | 'quiz' | 'fmai' | 'dashboard';

// Premium page transition settings
const pageTransition = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -15, scale: 0.98 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('create');
  const [generatedData, setGeneratedData] = useState<GenerateResponse | null>(null);
  const [quizResults, setQuizResults] = useState<QuizSessionResult | null>(null);
  const [showLanding, setShowLanding] = useState(true);

  const handleGenerated = useCallback((response: GenerateResponse) => {
    setGeneratedData(response);
    setQuizResults(null);  // Reset stale quiz data
    setActiveTab('study');
  }, []);

  const handleQuizComplete = useCallback((results: QuizSessionResult) => {
    setQuizResults(results);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const tabs: { key: TabKey; label: string; emoji: string }[] = [
    { key: 'create', label: 'Create', emoji: '✨' },
    { key: 'study', label: 'Study', emoji: '📖' },
    { key: 'quiz', label: 'Quiz', emoji: '🧠' },
    { key: 'fmai', label: 'FMAI', emoji: '⚡' },
    { key: 'dashboard', label: 'Dashboard', emoji: '📊' },
  ];

  return (
    <ConfigProvider
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            <LandingPage onEnter={() => setShowLanding(false)} />
          </motion.div>
        ) : (
          <Layout className="app-layout">
            
            {/* Premium Animated Background */}
            <div className="nebula-bg">
              <div className="nebula-item nebula-1"></div>
              <div className="nebula-item nebula-2"></div>
              <div className="nebula-item nebula-3"></div>
            </div>

            {/* Dark Mode Particles (Enhanced) */}
            {isDark && (
              <div className="particles-container">
                {[...Array(25)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle" 
                    style={{
                      left: `${Math.random() * 100}vw`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${10 + Math.random() * 15}s`,
                      opacity: Math.random() * 0.5 + 0.2
                    }} 
                  />
                ))}
              </div>
            )}

            {/* Navbar */}
            <nav className="navbar">
              <a href="#home" className="navbar-logo" onClick={(e) => { e.preventDefault(); setActiveTab('create'); }}>
                <ThunderboltFilled style={{ color: '#FFD700' }} className="app-logo-icon" />
                <span>Flash<span className="brand-text">Mind</span></span>
              </a>

              <div className="nav-links">
                {tabs.map(tab => (
                  <a
                    key={tab.key}
                    href={`#${tab.key}`}
                    className={activeTab === tab.key ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab.key);
                    }}
                  >
                    {tab.label}
                  </a>
                ))}
              </div>

              <div className="nav-actions">
                <Switch
                  id="dark-mode-toggle"
                  checked={isDark}
                  onChange={toggleTheme}
                  checkedChildren={<BulbFilled />}
                  unCheckedChildren={<BulbOutlined />}
                  style={{ background: isDark ? '#003366' : '#7DA7D9' }}
                />
              </div>
            </nav>

            {/* Content */}
            <Content className="app-content">
              <AnimatePresence mode="wait">
                {activeTab === 'create' && (
                  <motion.div key="create" {...pageTransition}>
                    <UploadForm onGenerated={handleGenerated} />
                  </motion.div>
                )}

                {activeTab === 'study' && (
                  <motion.div key="study" {...pageTransition}>
                    {generatedData ? (
                      <FlashcardViewer
                        flashcards={generatedData.flashcards}
                        level={generatedData.level}
                        sessionId={generatedData.session_id}
                      />
                    ) : (
                      <EmptyState tab="study" onAction={() => setActiveTab('create')} />
                    )}
                  </motion.div>
                )}

                {activeTab === 'quiz' && (
                  <motion.div key="quiz" {...pageTransition}>
                    {generatedData ? (
                      <QuizMode sessionId={generatedData.session_id} flashcards={generatedData.flashcards} onComplete={handleQuizComplete} />
                    ) : (
                      <EmptyState tab="quiz" onAction={() => setActiveTab('create')} />
                    )}
                  </motion.div>
                )}

                {activeTab === 'fmai' && (
                  <motion.div key="fmai" {...pageTransition}>
                    <FMAIChat level={(generatedData?.level as any) || 'engineer'} />
                  </motion.div>
                )}

                {activeTab === 'dashboard' && (
                  <motion.div key="dashboard" {...pageTransition}>
                    <Dashboard />
                  </motion.div>
                )}
              </AnimatePresence>
            </Content>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              padding: '24px 0',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              position: 'relative',
              zIndex: 1
            }}>
              FlashMind — AI-Powered Learning ⚡ Privacy-first • No paid APIs • 100% local
            </div>
          </Layout>
        )}
      </AnimatePresence>
    </ConfigProvider>
  );
};

// Reusable empty state component
const EmptyState = ({ tab, onAction }: { tab: string; onAction: () => void }) => (
  <div style={{ textAlign: 'center', padding: '120px 20px', position: 'relative', zIndex: 1 }}>
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ fontSize: 84, marginBottom: 32, filter: 'drop-shadow(0 20px 40px rgba(99, 102, 241, 0.2))' }}
    >
      {tab === 'study' ? '📖' : '🧠'}
    </motion.div>
    <Title level={2} style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
      {tab === 'study' ? 'Ready to deep dive?' : 'Challenge your intellect.'}
    </Title>
    <Text style={{ fontSize: 18, color: 'var(--text-secondary)', display: 'block', marginBottom: 48, maxWidth: 400, margin: '8px auto 48px', lineHeight: 1.6 }}>
      {tab === 'study' 
        ? 'Your personalized learning path is waiting. Generate flashcards to begin.' 
        : 'Put your knowledge to the test. Create a session to start the quiz.'}
    </Text>
    <Button
      type="primary"
      size="large"
      onClick={onAction}
      id="generate-btn"
      style={{ height: 64, padding: '0 48px', fontSize: 18, borderRadius: 16 }}
    >
      ✨ Create Flashcards
    </Button>
  </div>
);

export default App;