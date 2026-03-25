/**
 * FlashMind — FMAI Chat Component
 * Premium Redesign using Glassmorphism & Navy/Gold palette
 */
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Avatar, Card as AntCard, Space, Typography, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ThunderboltFilled } from '@ant-design/icons';
import { chatWithAI, ChatMessage } from '../services/api';

const { Text, Title } = Typography;

interface FMAIChatProps {
  level: 'school' | 'engineer' | 'mba';
}

const FMAIChat: React.FC<FMAIChatProps> = ({ level }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newHistory);

    try {
      const result = await chatWithAI({
        message: userMsg,
        level: level,
        history: messages,
      });
      setMessages(result.history);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fm-ai-container" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="fm-card" style={{
        height: '70vh', display: 'flex', flexDirection: 'column',
        background: 'var(--glass-bg)', backdropFilter: 'blur(24px)',
        borderRadius: 24, border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <Space size={16}>
            <Avatar size="large" icon={<ThunderboltFilled />} style={{ backgroundColor: 'var(--accent)', color: '#fff' }} />
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>FMAI Assistant</Title>
              <Text style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Intelligent Learning Co-pilot</Text>
            </div>
          </Space>
        </div>

        {/* Messages area — scrollable */}
        <div className="chat-messages" ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 60, opacity: 0.5 }}>
              <RobotOutlined style={{ fontSize: 64, color: 'var(--accent-secondary)', marginBottom: 24 }} />
              <Title level={4} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>How can I help you learn?</Title>
              <Text style={{ fontSize: 16 }}>Ask me to explain concepts, summarize notes, or solve problems.</Text>
            </div>
          )}
          
          <List
            dataSource={messages}
            renderItem={(msg) => (
              <List.Item style={{ border: 'none', padding: '12px 0', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', display: 'flex', gap: 16,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  <Avatar icon={msg.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />} 
                    style={{ backgroundColor: msg.role === 'assistant' ? 'var(--bg-primary)' : 'var(--accent)', color: msg.role === 'assistant' ? 'var(--accent)' : '#fff', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none' }} 
                  />
                  <div style={{
                    padding: '16px 20px', borderRadius: 20,
                    background: msg.role === 'assistant' ? 'rgba(255, 255, 255, 0.4)' : 'var(--accent)',
                    color: msg.role === 'assistant' ? 'var(--text-primary)' : '#fff',
                    fontWeight: 600, fontSize: 15, lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                    boxShadow: msg.role === 'user' ? '0 8px 20px var(--accent-glow)' : 'none'
                  }}>
                    {msg.content}
                  </div>
                </div>
              </List.Item>
            )}
          />
          {loading && (
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <Avatar icon={<RobotOutlined />} style={{ background: 'var(--accent)' }} />
              <div style={{ padding: '16px 24px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Spin size="small" />
                <Text italic style={{ opacity: 0.6 }}>FMAI is thinking...</Text>
              </div>
            </div>
          )}
        </div>

        {/* Input area — always visible at bottom */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid var(--border)', 
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ 
                borderRadius: 12, 
                border: '1px solid var(--border)', 
                padding: '12px 16px', 
                fontSize: 15,
                background: 'rgba(255,255,255,0.5)',
                flex: 1
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim()}
              loading={loading}
              style={{ height: 48, width: 48, borderRadius: 12, flexShrink: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FMAIChat;

