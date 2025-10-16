# Overview

SaveUp is a gamified savings and investments web application designed to help young people build financial discipline through engaging, game-like features. The app focuses on automated micro-savings through transaction round-ups, social leaderboards, achievement badges, and AI-powered financial insights. It addresses the problem of traditional banking feeling boring by making saving money fun and socially competitive.

## Recent Changes

**September 11, 2025** - Challenges Section & Enhanced Animations Completed:
- ✅ Created dedicated challenges screen with attractive three-section layout (Active, Templates, Completed)
- ✅ Implemented challenge template cards with pre-filled quick creation for common savings goals
- ✅ Added comprehensive challenge management system with progress tracking and status indicators
- ✅ Enhanced smooth screen transitions with transform/opacity animations instead of display toggling
- ✅ Added micro-animations throughout the app including hover effects, button interactions, and navigation
- ✅ Implemented shimmer effect on progress bars and pulsing animations for active challenges
- ✅ Enhanced bottom navigation with animated indicators and improved visual feedback
- ✅ Fixed screen transition system to support proper animation flow between pages
- ✅ Added empty state designs for challenges sections with engaging visuals

**Previous Changes (September 11, 2025)** - Replit Environment Setup:
- ✅ Created secure Node.js HTTP server (server.js) with proper path validation and security headers
- ✅ Configured workflow to serve frontend on port 5000 with 0.0.0.0 host binding
- ✅ Added CORS headers and cache control for Replit iframe compatibility
- ✅ Implemented Permissions-Policy for camera access to support QR scanning
- ✅ Fixed directory traversal vulnerability with proper path normalization
- ✅ Configured deployment for autoscale mode using Node.js server
- ⚠️ Known Issue: QR scanner (Html5Qrcode library) needs to be vendored locally for production use
- ⚠️ Production Security: CSP headers, SRI for external scripts, and CORS restrictions needed for production deployment

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Single Page Application**: Built with vanilla HTML, CSS, and JavaScript
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox
- **Component-Based Structure**: JavaScript class-based architecture with modular functionality
- **Theme System**: Built-in dark/light mode toggle with CSS custom properties
- **Real-time Updates**: Dynamic DOM manipulation for live data updates

## Design Patterns
- **State Management**: Centralized app state in JavaScript class constructor
- **Event-Driven Architecture**: Event listeners for user interactions and theme changes
- **Modular CSS**: CSS custom properties (variables) for consistent theming
- **Progressive Enhancement**: Core functionality works without JavaScript

## Core Features Architecture
- **Gamification System**: Streak tracking, badge system, and challenge mechanics
- **Social Features**: Leaderboard system for peer comparison
- **Micro-Savings Logic**: Automated round-up calculations and savings tracking
- **Analytics Dashboard**: Spending categorization and financial insights
- **Payment System**: UPI deep link payments, QR scanning, and payment request generation
- **Camera Integration**: Browser-based QR code scanning with camera switching
- **Payment Processing**: Form validation, error handling, and transaction tracking

## Data Structure
- **User Profile**: Savings totals, streaks, badges, and challenge progress
- **Leaderboard Data**: Peer rankings with savings amounts and achievements
- **Challenge System**: Goal-based saving targets with progress tracking
- **Spending Analytics**: Categorized expense data with percentage breakdowns

# External Dependencies

## Third-Party Libraries
- **Google Fonts**: Inter font family for modern typography
- **Font Awesome**: Icon library for UI elements and badges
- **html5-qrcode**: Mobile QR code scanner with camera support
- **QRCode.js**: QR code generation library for payment requests
- **CDN Delivery**: External CSS and font resources via CDN

## Implemented Integrations
- **UPI Integration**: Direct UPI deep link payments (upi://pay) without external APIs
- **QR Code Scanner**: Browser-based camera scanning for payment QR codes
- **Payment Processing**: UPI payment forms with validation and deep link generation
- **Savings Integration**: Automatic round-up calculations and activity tracking
- **QR Generation**: Payment request QR codes for receiving money

## Future Integrations
- **Banking APIs**: For real-time transaction data and account connectivity
- **AI Services**: For personalized financial advice and spending analysis
- **Authentication Services**: Two-factor authentication for secure transfers
- **Investment Platforms**: Integration with SIP, FD, and ETF providers

## Browser APIs
- **Local Storage**: For theme preferences and user data persistence
- **Web Speech API**: For voice command functionality (referenced in code)
- **Responsive Design**: CSS media queries for cross-device compatibility