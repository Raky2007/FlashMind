/**
 * FlashMind — Interactive Landing Page
 * Dynamic character scramble effect with "Go FlashMind" CTA.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Typography } from 'antd';
import { ThunderboltFilled, ArrowRightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

interface LandingPageProps {
  onEnter: () => void;
}

const CHARS = '+= -/ < > == >* & % $ # @ !'.split(' ');

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };

    class Particle {
      x: number;
      y: number;
      char: string;
      fontSize: number;
      speed: number;
      opacity: number;
      color: string;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        this.fontSize = 12 + Math.random() * 24;
        this.speed = 0.5 + Math.random() * 2;
        this.opacity = 0.1 + Math.random() * 0.5;
        this.color = `hsla(${230 + Math.random() * 40}, 80%, 70%, ${this.opacity})`;
      }

      update(w: number, h: number) {
        this.y -= this.speed;
        if (this.y < -50) {
          this.y = h + 50;
          this.x = Math.random() * w;
        }

        // Mouse interaction: push away
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const angle = Math.atan2(dy, dx);
          const force = (150 - dist) / 150;
          this.x += Math.cos(angle) * force * 5;
          this.y += Math.sin(angle) * force * 5;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.font = `${this.fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(this.char, this.x, this.y);
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleGo = () => {
    setIsExiting(true);
    setTimeout(onEnter, 800);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div 
          className="landing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <canvas ref={canvasRef} className="landing-canvas" />
          
          <div className="landing-content">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{ textAlign: 'center', position: 'relative' }}
            >
              <div className="landing-hero-container">
                <div className="hero-text hero-solid">Ready to supercharge</div>
                <div className="hero-text hero-outline">your learning?</div>
                <div className="hero-beam"></div>
              </div>

              <Text className="landing-description">
                Leverage advanced AI to instantly generate flashcards, quizzes, and study guides from any text, document, or audio.
              </Text>
               <br />
              <motion.button 
                className="landing-premium-btn"
                onClick={handleGo}
                whileHover={{ scale: 1.05, translateY: -4 }}
                whileTap={{ scale: 0.98, translateY: 2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <span className="btn-text">Go to FlashMind</span>
                <ArrowRightOutlined className="btn-arrow" />
                <motion.div 
                  className="btn-glow"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </motion.button>
            </motion.div>
          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandingPage;
