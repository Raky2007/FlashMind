/**
 * FlashMind — Antd v5 Theme Configuration
 * Premium Apple/Stripe Aesthetic
 */
import type { ThemeConfig } from 'antd';

const fontFamily = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4F46E5',         // Deeper Indigo
    colorPrimaryHover: '#4338CA',
    colorInfo: '#7C3AED',            // Violet
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F9FAFB',
    colorText: '#0F172A',            // Deep Slate
    colorTextSecondary: '#475569',
    colorBorder: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 20,
    fontFamily: fontFamily,
    fontSize: 15,
    controlHeight: 48,
  },
  components: {
    Button: { 
      controlHeight: 48, 
      fontWeight: 700,
      borderRadius: 12,
      // Premium dark buttons with gold/white text
      primaryColor: '#FFFFFF',
    },
    Card: { 
      borderRadiusLG: 24,
      colorBgContainer: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
    },
    Input: { controlHeight: 48, borderRadius: 12 },
    Select: { controlHeight: 48, borderRadius: 12 },
    Modal: { borderRadiusLG: 24 },
    Segmented: {
      itemColor: '#475569',
      itemHoverColor: '#0F172A',
      itemSelectedColor: '#0F172A',
      itemSelectedBg: '#FFFFFF',
    }
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#6366F1',
    colorPrimaryHover: '#818CF8',
    colorBgContainer: '#0F172A',
    colorBgLayout: '#020617',
    colorText: '#F8FAFC',
    colorTextSecondary: '#94A3B8',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    fontFamily: fontFamily,
    fontSize: 15,
    controlHeight: 48,
  },
  components: {
    Button: { 
      controlHeight: 48, 
      fontWeight: 700,
      borderRadius: 12,
    },
    Card: { 
      borderRadiusLG: 24,
      colorBgContainer: 'rgba(15, 23, 42, 0.8)',
    },
    Input: { controlHeight: 48, borderRadius: 12 },
    Select: { controlHeight: 48, borderRadius: 12 },
    Modal: { borderRadiusLG: 24 },
  },
};