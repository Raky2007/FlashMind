/**
 * FlashMind — Upload Form Component
 */
import React, { useState } from 'react';
import { Upload, Input, Select, Button, Card, Space, message, Segmented, InputNumber, Typography, Row, Col, Divider } from 'antd';
import {
  CloudUploadOutlined,
  FileTextOutlined,
  CameraOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  BookOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { uploadPdf, uploadImage, uploadVoice, generateFlashcards, type GenerateResponse } from '../services/api';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface UploadFormProps {
  onGenerated: (response: GenerateResponse) => void;
}

const LEVELS = [
  { label: '🎒 School', value: 'school', icon: <BookOutlined /> },
  { label: '⚙️ Engineer', value: 'engineer', icon: <RocketOutlined /> },
  { label: '📊 MBA', value: 'mba', icon: <ThunderboltOutlined /> },
];

const SUBJECTS = [
  'general', 'math', 'science', 'history', 'business',
  'programming', 'medicine', 'law', 'economics', 'languages',
];

const UploadForm: React.FC<UploadFormProps> = ({ onGenerated }) => {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<string>('engineer');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [subject, setSubject] = useState('general');
  const [numCards, setNumCards] = useState(10);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<string>('pdf');
  const [timer, setTimer] = useState(0);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      let result;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        result = await uploadPdf(file);
      } else if (['png', 'jpg', 'jpeg', 'bmp', 'webp'].includes(ext || '')) {
        result = await uploadImage(file);
      } else if (['wav', 'mp3', 'm4a', 'ogg', 'webm', 'flac'].includes(ext || '')) {
        result = await uploadVoice(file);
      } else {
        message.error('Unsupported file type');
        setLoading(false);
        return false;
      }
      setText(result.text);
      message.success(`Extracted text from ${result.filename}`);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.detail || 'Upload failed';
      message.warning(msg);
      setUploadMode('text');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      message.warning('Please enter or upload some text first!');
      return;
    }
    setLoading(true);
    setTimer(0);
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    try {
      const response = await generateFlashcards({
        text: text.trim(),
        level: level as any,
        difficulty: difficulty as any,
        subject,
        num_cards: numCards,
      });
      message.success(`Generated ${response.flashcards.length} flashcards in ${timer}s! 🎉`);
      onGenerated(response);
    } catch (err: any) {
      message.error(err?.message || err?.response?.data?.detail || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <Card className="fm-card" bordered={false} style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <Title level={3} style={{ marginBottom: 32, textAlign: 'center', fontWeight: 700 }}>
          What are we learning today?
        </Title>

        {/* Input mode selector */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Segmented
            value={uploadMode}
            onChange={(val) => setUploadMode(val as string)}
            options={[
              { label: 'Text', value: 'text', icon: <FileTextOutlined /> },
              { label: 'PDF', value: 'pdf', icon: <FileTextOutlined /> },
              { label: 'Image', value: 'image', icon: <CameraOutlined /> },
              { label: 'Voice', value: 'voice', icon: <AudioOutlined /> },
            ]}
            size="large"
            style={{ padding: '6px', background: 'rgba(0, 51, 102, 0.05)' }}
          />
        </div>

        {/* Input area */}
        {uploadMode === 'text' ? (
          <TextArea
            id="text-input"
            rows={8}
            placeholder="Paste your notes, textbook excerpt, or any study material here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ marginBottom: 28, fontSize: 15, lineHeight: 1.7, borderRadius: 12, padding: 20 }}
            showCount
            maxLength={5000}
          />
        ) : (
          <div style={{ marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
            <Upload.Dragger
              id="file-upload"
              accept={
                uploadMode === 'pdf' ? '.pdf' :
                uploadMode === 'image' ? '.png,.jpg,.jpeg,.bmp,.webp' :
                '.wav,.mp3,.m4a,.ogg,.webm,.flac'
              }
              beforeUpload={handleFileUpload}
              showUploadList={false}
              style={{ background: 'rgba(99, 102, 241, 0.03)', border: '2px dashed var(--accent)', borderRadius: 20 }}
            >
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 64, marginBottom: 20, color: 'var(--accent)' }}>
                  <CloudUploadOutlined />
                </p>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Drop your {uploadMode === 'pdf' ? 'PDF' : uploadMode === 'image' ? 'Image' : 'Audio'} here
                </p>
                <Text type="secondary" style={{ fontSize: 15 }}>or click to explore your files</Text>
              </div>
            </Upload.Dragger>
          </div>
        )}

        {text && uploadMode !== 'text' && (
          <Card size="small" style={{ marginBottom: 32, background: 'rgba(255,255,255,0.5)', borderRadius: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>EXTRACTED TEXT</Text>
            <div style={{ maxHeight: 250, overflow: 'auto', marginTop: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {text}
            </div>
          </Card>
        )}

        <Divider style={{ borderColor: 'var(--border)', margin: '8px 0 24px' }} />

        {/* Settings */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              Level
            </Text>
            <Select
              id="level-select"
              value={level}
              onChange={setLevel}
              style={{ width: '100%' }}
              options={LEVELS.map(l => ({ label: l.label, value: l.value }))}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              Difficulty
            </Text>
            <Select
              id="difficulty-select"
              value={difficulty}
              onChange={setDifficulty}
              style={{ width: '100%' }}
              options={[
                { label: 'Easy', value: 'easy' },
                { label: 'Medium', value: 'medium' },
                { label: 'Hard', value: 'hard' },
              ]}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              Subject
            </Text>
            <Select
              id="subject-select"
              value={subject}
              onChange={setSubject}
              style={{ width: '100%' }}
              options={SUBJECTS.map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
            />
          </Col>
        </Row>

        {/* Bottom action row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <Space size={12}>
            <Text style={{ fontWeight: 600, fontSize: 15 }}>Cards to generate:</Text>
            <InputNumber
              id="num-cards-input"
              min={5}
              max={30}
              value={numCards}
              onChange={(val) => setNumCards(val || 10)}
              style={{ width: 80, borderRadius: 8 }}
            />
          </Space>
          
          <div style={{ textAlign: 'right' }}>
            <Button
              id="generate-btn"
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
              loading={loading}
              disabled={!text.trim() && uploadMode === 'text'}
              style={{ minWidth: 200, height: 48, borderRadius: 12, fontWeight: 600 }}
            >
              {loading ? 'Generating...' : 'Generate Magic'}
            </Button>
            {loading && (
              <div style={{ 
                marginTop: 12, 
                color: 'var(--accent)', 
                fontWeight: 700, 
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <ThunderboltOutlined spin />
                Analyzing with AI... {timer}s
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UploadForm;