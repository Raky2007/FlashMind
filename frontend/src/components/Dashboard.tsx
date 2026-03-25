/**
 * FlashMind — Dashboard Component
 * Premium Redesign with Quiz History
 */
import React, { useState, useEffect } from 'react';
import { Card as AntCard, Table, Button, Space, Tag, Typography, Empty, Statistic, Row, Col, Dropdown, message, Collapse, List } from 'antd';
import {
  DownloadOutlined,
  FireOutlined,
  TrophyOutlined,
  LineChartOutlined,
  HistoryOutlined,
  ThunderboltFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { getSessions, getProgress, exportSession, getQuizHistory } from '../services/api';
import type { QuizHistoryEntry } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Filler);

const { Text, Title } = Typography;

interface Session {
  id: string;
  created_at: number;
  level: string;
  difficulty: string;
  num_cards: number;
  source_summary: string;
}

interface ProgressEntry {
  session_id: string;
  score_pct: number;
  timestamp: number;
}

const NUDGES = [
  { icon: '🔥', text: "Keep the streak alive! You're on a roll." },
  { icon: '🧠', text: 'Every review makes your memory stronger!' },
  { icon: '🎯', text: 'Consistency beats intensity. Keep going!' },
  { icon: '📈', text: 'Your brain is growing with each session!' },
  { icon: '⭐', text: 'Great job! Next review in 2 days for best retention.' },
];

const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessData, progData] = await Promise.all([getSessions(), getProgress()]);
      setSessions(sessData);
      setProgress(progData);
    } catch { }
    setQuizHistory(getQuizHistory());
    setLoading(false);
  };

  const nudge = NUDGES[Math.floor(Math.random() * NUDGES.length)];

  const chartData = {
    labels: progress.map((_, i) => `S${i + 1}`),
    datasets: [
      {
        label: 'Score %',
        data: progress.map(p => p.score_pct),
        fill: true,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#FFFFFF',
        pointHoverRadius: 8,
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#003366',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      y: { min: 0, max: 100, ticks: { stepSize: 20, callback: (v: any) => `${v}%` }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const totalSessions = sessions.length;
  const avgScore = progress.length > 0
    ? Math.round(progress.reduce((a, b) => a + b.score_pct, 0) / progress.length)
    : 0;
  const totalCards = sessions.reduce((a, b) => a + b.num_cards, 0);
  const currentStreak = Math.min(sessions.length, 5);

  const handleExport = (sessionId: string, format: 'json' | 'csv' | 'anki') => {
    exportSession(sessionId, format);
    message.success(`Exporting as ${format.toUpperCase()}...`);
  };

  const downloadQuizHistory = (entry: QuizHistoryEntry) => {
    const data = {
      date: new Date(entry.timestamp * 1000).toLocaleString(),
      score: `${entry.score_pct}%`,
      correct: `${entry.correct}/${entry.total_cards}`,
      best_streak: entry.best_streak,
      questions: entry.questions.map((q, i) => ({
        question: q.front,
        your_answer: entry.results[i]?.user_selected_option || '(no answer)',
        correct_answer: entry.results[i]?.correct_answer || '',
        is_correct: entry.results[i]?.correct || false,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_${new Date(entry.timestamp * 1000).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Quiz history downloaded!');
  };

  const columns = [
    {
      title: 'Topic Summary',
      dataIndex: 'source_summary',
      key: 'summary',
      width: 200,
      ellipsis: true,
      render: (text: string) => <Text style={{ color: '#003366', fontWeight: 600, fontSize: 13 }}>{text ? (text.length > 60 ? text.slice(0, 60) + '…' : text) : 'Flashcard Set'}</Text>,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag bordered={false} style={{ borderRadius: 6, fontWeight: 600, padding: '2px 10px', background: 'rgba(0, 51, 102, 0.05)', color: '#003366' }}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      render: (ts: number) => <Text type="secondary">{new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>,
    },
    {
      title: 'Actions',
      key: 'export',
      render: (_: any, record: Session) => (
        <Dropdown
          menu={{
            items: [
              { key: 'json', label: '📄 Export JSON', onClick: () => handleExport(record.id, 'json') },
              { key: 'csv', label: '📊 Export CSV', onClick: () => handleExport(record.id, 'csv') },
              { key: 'anki', label: '🃏 Export Anki', onClick: () => handleExport(record.id, 'anki') },
            ],
          }}
          placement="bottomRight"
        >
          <Button type="text" shape="circle" icon={<DownloadOutlined style={{ color: '#003366' }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div style={{
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        borderRadius: 32, padding: '40px', marginBottom: 32, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        <Space size={24}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,215,0,0.2)', display: 'grid', placeItems: 'center' }}>
            <ThunderboltFilled style={{ fontSize: 32, color: '#FFD700' }} />
          </div>
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back, Scholar!</Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 500 }}>{nudge.text}</Text>
          </div>
        </Space>
        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
           <div style={{ opacity: 0.8, fontSize: 12, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>CURRENT STREAK</div>
           <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
             <FireOutlined style={{ color: '#FFD700' }} /> {currentStreak} Days
           </div>
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {[
          { title: 'Total Sessions', value: totalSessions, sub: 'Study rounds', icon: <HistoryOutlined />, color: '#003366' },
          { title: 'Average Score', value: avgScore, suffix: '%', sub: 'Performance', icon: <TrophyOutlined />, color: '#52C41A' },
          { title: 'Flashcards', value: totalCards, sub: 'Mastered', icon: <LineChartOutlined />, color: '#FFD700' },
        ].map((stat, i) => (
          <Col xs={24} sm={8} key={i}>
            <AntCard bordered={false} style={{ borderRadius: 24, padding: 8, background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
              <Statistic
                title={<span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>{stat.title}</span>}
                value={stat.value}
                suffix={<span style={{ fontSize: 16 }}>{stat.suffix}</span>}
                valueStyle={{ color: '#003366', fontWeight: 800, fontSize: 32 }}
              />
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.5, fontWeight: 600 }}>{stat.sub.toUpperCase()}</div>
            </AntCard>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={14}>
          <AntCard bordered={false} title={<span style={{ fontWeight: 700, color: '#003366' }}>Learning Momentum</span>} style={{ borderRadius: 24, minHeight: 400, background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
            {progress.length > 0 ? (
              <div style={{ height: 300 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <Empty style={{ marginTop: 80 }} description="Complete a quiz to see your momentum! 📈" />
            )}
          </AntCard>
        </Col>
        <Col xs={24} lg={10}>
          <AntCard bordered={false} title={<span style={{ fontWeight: 700, color: '#003366' }}>Recent Sessions</span>} style={{ borderRadius: 24, minHeight: 400, background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <Table
              dataSource={sessions.slice(0, 5)}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              tableLayout="fixed"
              scroll={{ x: '100%' }}
              locale={{ emptyText: <Empty description="No sessions found." /> }}
            />
          </AntCard>
        </Col>
      </Row>

      {/* Quiz History Section */}
      <AntCard 
        bordered={false} 
        title={<span style={{ fontWeight: 700, color: '#003366' }}><HistoryOutlined /> Quiz History</span>} 
        style={{ borderRadius: 24, background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}
      >
        {quizHistory.length > 0 ? (
          <Collapse
            ghost
            items={quizHistory.map((entry, idx) => ({
              key: idx,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 12 }}>
                  <Space size={16}>
                    <Tag color={entry.score_pct >= 70 ? 'green' : entry.score_pct >= 40 ? 'orange' : 'red'} style={{ fontWeight: 700, fontSize: 14, padding: '4px 12px', borderRadius: 8 }}>
                      {entry.score_pct}%
                    </Tag>
                    <Text strong style={{ color: '#003366' }}>
                      {entry.correct}/{entry.total_cards} correct
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {new Date(entry.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Space>
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<DownloadOutlined />} 
                    onClick={(e) => { e.stopPropagation(); downloadQuizHistory(entry); }}
                  >
                    Download
                  </Button>
                </div>
              ),
              children: (
                <List
                  size="small"
                  dataSource={entry.questions.map((q, i) => ({ ...q, result: entry.results[i] }))}
                  renderItem={(item, i) => (
                    <List.Item style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {item.result?.correct 
                            ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 18, marginTop: 2 }} />
                            : <CloseCircleOutlined style={{ color: '#EF4444', fontSize: 18, marginTop: 2 }} />
                          }
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 14, color: '#003366' }}>Q{i + 1}: {item.front}</Text>
                            <div style={{ marginTop: 6 }}>
                              <Text style={{ fontSize: 13 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Your answer: </span>
                                <span style={{ fontWeight: 600, color: item.result?.correct ? '#52C41A' : '#EF4444' }}>
                                  {item.result?.user_selected_option || '(no answer)'}
                                </span>
                              </Text>
                              {!item.result?.correct && (
                                <div>
                                  <Text style={{ fontSize: 13 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Correct: </span>
                                    <span style={{ fontWeight: 600, color: '#52C41A' }}>{item.result?.correct_answer}</span>
                                  </Text>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ),
            }))}
          />
        ) : (
          <Empty description="Complete a quiz to see your history here! 🧠" style={{ padding: '40px 0' }} />
        )}
      </AntCard>
    </motion.div>
  );
};

export default Dashboard;
