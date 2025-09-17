# CryptoCrowe Brand Style Guide

![CryptoCrowe Logo](logo.svg)

## 🎨 Brand Identity

### Mission Statement
"Democratizing cryptocurrency trading through intelligent automation and cutting-edge technology."

### Brand Values
- **Innovation**: Pioneering advanced trading solutions
- **Reliability**: Trusted by traders worldwide
- **Accessibility**: Making crypto trading simple for everyone
- **Security**: Bank-grade protection for user assets

### Brand Personality
- **Professional** yet approachable
- **Tech-savvy** but not intimidating
- **Trustworthy** and transparent
- **Modern** and forward-thinking

---

## 🎨 Visual Identity

### Logo Usage

#### Primary Logo
- **Full Logo**: Crow icon + "CryptoCrowe" text
- **Minimum Size**: 120px width
- **Clear Space**: Equal to the height of the "C" in CryptoCrowe

#### Logo Variations
```
1. Full Color (Primary)
   - Use on dark backgrounds
   - RGB: Icon with gradient, white text

2. Monochrome
   - Use for single-color printing
   - Black or white only

3. Icon Only
   - Use for app icons, favicons
   - Minimum size: 32px

4. Wordmark Only
   - Use when icon is too small
   - Maintain color hierarchy
```

### Color Palette

#### Primary Colors
```css
/* Ocean Blue - Primary Brand Color */
--primary: #4a9eca;
--primary-rgb: 74, 158, 202;
--primary-dark: #1e5f8e;
--primary-light: #4dd0e1;

/* Success Green - Profit/Positive */
--success: #10b981;
--success-rgb: 16, 185, 129;
--success-light: #34d399;
--success-dark: #059669;
```

#### Secondary Colors
```css
/* Danger Red - Loss/Negative */
--danger: #ef4444;
--danger-rgb: 239, 68, 68;
--danger-light: #f87171;
--danger-dark: #dc2626;

/* Warning Amber - Caution/Alert */
--warning: #f59e0b;
--warning-rgb: 245, 158, 11;
--warning-light: #fbbf24;
--warning-dark: #d97706;
```

#### Neutral Colors
```css
/* Dark Theme Base */
--dark: #1f2937;
--darker: #0a0a0a;
--darkest: #000000;

/* Light Grays */
--light: #f3f4f6;
--lighter: #f9fafb;
--white: #ffffff;

/* Text Colors */
--text-primary: #ffffff;
--text-secondary: #94a3b8;
--text-muted: #64748b;
```

#### Gradient Definitions
```css
/* Brand Gradient */
--gradient-primary: linear-gradient(135deg, #1e5f8e 0%, #4dd0e1 100%);

/* Success Gradient */
--gradient-success: linear-gradient(135deg, #059669 0%, #34d399 100%);

/* Premium Gradient */
--gradient-premium: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
```

### Typography

#### Font Stack
```css
/* Primary Font - Interface */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - Numbers/Code */
font-family: 'JetBrains Mono', 'Monaco', 'Courier New', monospace;
```

#### Type Scale
```css
/* Headings */
--h1: 3.5rem;    /* 56px - Hero headlines */
--h2: 2.25rem;   /* 36px - Page titles */
--h3: 1.5rem;    /* 24px - Section headers */
--h4: 1.125rem;  /* 18px - Card titles */
--h5: 1rem;      /* 16px - Subsection headers */
--h6: 0.875rem;  /* 14px - Small headers */

/* Body */
--body-lg: 1.125rem;  /* 18px - Large body text */
--body: 1rem;         /* 16px - Regular body text */
--body-sm: 0.875rem;  /* 14px - Small body text */
--caption: 0.75rem;   /* 12px - Captions/labels */

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```

---

## 💬 Voice & Tone

### Writing Principles

#### Be Clear
- Use simple, direct language
- Avoid jargon unless necessary
- Define technical terms

#### Be Confident
- Show expertise without arrogance
- Use active voice
- Make decisive statements

#### Be Helpful
- Anticipate user needs
- Provide actionable guidance
- Include examples

### Messaging Examples

#### Welcome Messages
✅ **Do**: "Welcome to CryptoCrowe! Let's get you trading in minutes."
❌ **Don't**: "Greetings, user. Initialize your trading interface."

#### Error Messages
✅ **Do**: "Connection timeout. We'll retry in 5 seconds."
❌ **Don't**: "Error 504: Gateway timeout exception occurred."

#### Success Messages
✅ **Do**: "Order placed! BTC buy for $1,000 at market price."
❌ **Don't**: "Transaction ID #7489302 successfully processed."

---

## 🎯 UI Components

### Buttons

#### Primary Button
```css
.btn-primary {
    background: var(--gradient-primary);
    color: var(--white);
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
}
```

#### Secondary Button
```css
.btn-secondary {
    background: transparent;
    border: 2px solid var(--primary);
    color: var(--primary-light);
    padding: 10px 22px;
    border-radius: 8px;
}
```

### Cards

#### Standard Card
```css
.card {
    background: rgba(31, 41, 55, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
}
```

#### Hover State
```css
.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(77, 208, 225, 0.2);
    border-color: var(--primary);
}
```

### Form Elements

#### Input Fields
```css
.input {
    background: rgba(17, 24, 39, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 16px;
    color: var(--white);
}

.input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(77, 208, 225, 0.1);
}
```

### Spacing System

```css
/* Base unit: 8px */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
```

---

## 📱 Responsive Design

### Breakpoints
```css
--mobile: 480px;
--tablet: 768px;
--laptop: 1024px;
--desktop: 1280px;
--wide: 1536px;
```

### Grid System
```css
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--space-md);
}

.grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

---

## 🎭 Iconography

### Icon Style
- **Style**: Outlined, 2px stroke
- **Size**: 24px default, 16px small, 32px large
- **Library**: Font Awesome 6 Pro

### Common Icons
```
Trading: 📈 fa-chart-line
Portfolio: 💼 fa-briefcase
Settings: ⚙️ fa-cog
Wallet: 👛 fa-wallet
Bot: 🤖 fa-robot
Security: 🔒 fa-lock
Success: ✅ fa-check-circle
Error: ❌ fa-times-circle
Warning: ⚠️ fa-exclamation-triangle
Info: ℹ️ fa-info-circle
```

---

## 🎬 Animations

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Standard Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 1000ms;
```

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

/* Pulse */
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
```

---

## 📊 Data Visualization

### Chart Colors
```css
/* Candlestick */
--candle-up: #10b981;
--candle-down: #ef4444;

/* Volume */
--volume-bar: #4a9eca;
--volume-opacity: 0.3;

/* Grid Lines */
--grid-color: rgba(255, 255, 255, 0.05);
```

### Chart Typography
- **Axis Labels**: 12px, --text-muted
- **Values**: 14px, 'JetBrains Mono'
- **Titles**: 16px, --text-primary

---

## 🏗️ Layout Patterns

### Dashboard Layout
```
┌─────────────────────────────────┐
│          Header/Nav             │
├─────────────────────────────────┤
│  Stats  │  Stats  │  Stats      │
├─────────┴─────────┴─────────────┤
│ Markets │  Chart  │  Order Form │
│  List   │         │             │
├─────────┴─────────┴─────────────┤
│         Activity Feed           │
└─────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────┐
│    Header    │
├──────────────┤
│    Stats     │
├──────────────┤
│    Chart     │
├──────────────┤
│   Markets    │
├──────────────┤
│  Order Form  │
└──────────────┘
```

---

## 🔗 Marketing Assets

### Social Media
- **Twitter/X**: @CryptoCrowe
- **Telegram**: t.me/cryptocrowe
- **Discord**: discord.gg/cryptocrowe

### Brand Hashtags
- #CryptoCrowe
- #AutomatedTrading
- #TradeSmart
- #CroweBots

### Email Signature
```html
<div style="font-family: Inter, sans-serif;">
    <img src="logo.png" width="40" height="40" alt="CryptoCrowe">
    <h3 style="color: #4dd0e1; margin: 10px 0;">CryptoCrowe</h3>
    <p style="color: #94a3b8;">Automated Crypto Trading Platform</p>
    <a href="https://crowe-crypto.fly.dev" style="color: #4a9eca;">crowe-crypto.fly.dev</a>
</div>
```

---

## 📋 Usage Guidelines

### Do's ✅
- Use consistent colors across all materials
- Maintain proper logo clear space
- Follow the type scale for hierarchy
- Use animations sparingly and purposefully
- Keep messaging clear and actionable

### Don'ts ❌
- Don't stretch or distort the logo
- Don't use off-brand colors
- Don't mix font families unnecessarily
- Don't overuse animations
- Don't use technical jargon without context

---

## 🎯 Implementation Checklist

- [ ] Logo files in all formats (SVG, PNG, ICO)
- [ ] Color variables in CSS/SCSS
- [ ] Typography system implemented
- [ ] Component library documented
- [ ] Animation library created
- [ ] Icon set standardized
- [ ] Email templates designed
- [ ] Social media templates created
- [ ] Error/success message standards
- [ ] Accessibility guidelines followed

---

## 📞 Brand Contact

**Brand Guidelines Manager**: brand@cryptocrowe.com
**Last Updated**: September 2024
**Version**: 1.0.0

© 2024 CryptoCrowe. All rights reserved.