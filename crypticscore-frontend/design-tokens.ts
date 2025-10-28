import crypto from 'crypto';

// Calculate deterministic seed for design system
const projectName = "CrypticScore";
const network = "sepolia";
const yearMonth = "202510";
const contractName = "RatingManager.sol";
const seedString = `${projectName}${network}${yearMonth}${contractName}`;
const seed = crypto.createHash('sha256').update(seedString).digest('hex');

// Based on seed, design system selected: Glassmorphism + Color Scheme G (Red/Pink/Orange)
export const designTokens = {
  system: "Glassmorphism",
  seed: seed,
  
  colors: {
    light: {
      primary: '#EF4444',      // Red
      secondary: '#EC4899',    // Pink
      accent: '#F97316',       // Orange
      background: '#F9FAFB',   // Very light gray
      surface: '#FFFFFF',      // White
      surfaceGlass: 'rgba(255, 255, 255, 0.8)',  // Semi-transparent white
      text: '#111827',         // Dark gray
      textSecondary: '#6B7280',// Medium gray
      border: '#E5E7EB',      // Light border
      success: '#10B981',      // Green
      warning: '#F59E0B',      // Amber
      error: '#EF4444',        // Red
      info: '#3B82F6',         // Blue
    },
    dark: {
      primary: '#F87171',      // Light red
      secondary: '#F472B6',    // Light pink
      accent: '#FB923C',       // Light orange
      background: '#111827',   // Very dark gray
      surface: '#1F2937',      // Dark gray
      surfaceGlass: 'rgba(31, 41, 55, 0.8)',  // Semi-transparent dark
      text: '#F9FAFB',         // Very light gray
      textSecondary: '#9CA3AF',// Medium light gray
      border: '#374151',       // Dark border
      success: '#34D399',      // Light green
      warning: '#FBBF24',      // Light amber
      error: '#F87171',        // Light red
      info: '#60A5FA',         // Light blue
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'] as string[],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'] as string[],
    },
    scale: 1.25,
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.25rem',      // 20px
      xl: '1.563rem',     // 25px
      '2xl': '1.953rem',  // 31px
      '3xl': '2.441rem',  // 39px
      '4xl': '3.052rem',  // 49px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  spacing: {
    unit: 8, // Base spacing unit: 8px
    scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',      // 4px
    md: '0.5rem',       // 8px
    lg: '0.75rem',      // 12px (chosen for this project)
    xl: '1rem',         // 16px
    '2xl': '1.5rem',    // 24px
    full: '9999px',
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',    // chosen for this project
    xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    // Glassmorphism-specific shadows
    glass: '0 8px 32px rgba(31, 38, 135, 0.15)',
  },
  
  borders: {
    width: {
      hairline: '0.5px',
      thin: '1px',      // chosen for this project
      medium: '1.5px',
      thick: '2px',
    },
  },
  
  transitions: {
    duration: {
      fast: 100,
      standard: 200,    // chosen for this project
      slow: 300,
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  layout: 'tabs', // Chosen layout mode: tabs navigation
  
  density: {
    compact: {
      padding: { sm: '0.25rem 0.5rem', md: '0.5rem 1rem', lg: '0.75rem 1.5rem' },
      gap: '0.5rem',
      height: { button: '2rem', input: '2.25rem' },
    },
    comfortable: {
      padding: { sm: '0.5rem 1rem', md: '1rem 1.5rem', lg: '1.25rem 2rem' },
      gap: '1rem',
      height: { button: '2.5rem', input: '2.75rem' },
    },
  },
  
  // Glassmorphism-specific properties
  glass: {
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(12px)',
      xl: 'blur(16px)',
    },
    opacity: {
      light: 0.7,
      medium: 0.8,
      heavy: 0.9,
    },
  },
  
  // Gradient backgrounds for glassmorphism
  gradients: {
    primary: 'linear-gradient(135deg, #EF4444 0%, #EC4899 50%, #F97316 100%)',
    secondary: 'linear-gradient(135deg, #EC4899 0%, #F97316 100%)',
    accent: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    subtle: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    mobile: '0px',       // < 768px
    tablet: '768px',     // 768px - 1024px
    desktop: '1024px',   // > 1024px
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type DesignTokens = typeof designTokens;

