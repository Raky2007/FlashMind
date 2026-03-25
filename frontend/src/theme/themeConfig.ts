/**
 * FlashMind — Antd v5 Theme Configuration
 * Premium Apple/Stripe Aesthetic
 */
import type { ThemeConfig } from 'antd';

const fontFamily = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#6366F1',         // Indigo
    colorPrimaryHover: '#4F46E5',
    colorInfo: '#8B5CF6',            // Violet
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorText: '#010816',
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
      fontWeight: 600,
      primaryColor: '#003366',       // Deep navy text on gold buttons
      borderRadius: 12,
    },
    Card: { 
      borderRadiusLG: 24,
      colorBgContainer: 'rgba(255, 255, 255, 0.65)', // Glassmorphism base
    },
    Input: { controlHeight: 48, borderRadius: 12 },
    Select: { controlHeight: 48, borderRadius: 12 },
    Modal: { borderRadiusLG: 24 },
    Segmented: {
      itemColor: '#5A7E9E',
      itemHoverColor: '#003366',
      itemSelectedColor: '#003366',
      itemSelectedBg: '#FFFFFF',
    }
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#6366F1',
    colorPrimaryHover: '#4F46E5',
    colorBgContainer: '#0F172A',
    colorBgLayout: '#020617',
    colorText: '#F1F5F9',
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
      fontWeight: 600,
      primaryColor: '#001A33',
      borderRadius: 12,
    },
    Card: { borderRadiusLG: 24 },
    Input: { controlHeight: 48, borderRadius: 12 },
    Select: { controlHeight: 48, borderRadius: 12 },
    Modal: { borderRadiusLG: 24 },
  },
};