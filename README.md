# Reviewly - AI-Powered Code Review Dashboard

Reviewly is a modern, AI-enhanced GitHub pull request review dashboard that transforms the code review experience. Built with React, TypeScript, and Tailwind CSS, it provides an intuitive interface for managing and reviewing pull requests with intelligent AI assistance powered by Claude (Anthropic).

### Homepage

<img width="923" height="676" alt="image" src="https://github.com/user-attachments/assets/0255eeb8-a24c-4fa3-8689-a94e0f18984b" />

### A Dashboard to keep you focused

<img width="1407" height="802" alt="image" src="https://github.com/user-attachments/assets/662d012b-639c-4899-8453-ffca3ebe9f76" />

### Snooze PRs that can wait until tomorrow

<img width="889" height="436" alt="image" src="https://github.com/user-attachments/assets/bbfb94f0-e44c-4983-ac3c-aa48fe3823ef" />


### PR + Edit w/ AI and never lose site of the ball

<img width="1414" height="786" alt="image" src="https://github.com/user-attachments/assets/115f3171-abe1-42d2-8f6a-47fb252cbe05" />


## 🚀 Features

### Smart Review Dashboard
- **Gamified Experience**: Progress tracking, completion celebrations, and "spicy" PR prioritization
- **Intelligent Filtering**: Filter by ready, spicy, completed, and delayed PRs
- **Visual Progress**: Real-time progress bars and completion stats with motivational messaging
- **Priority System**: Automatic prioritization based on PR age, review requests, and urgency

### AI-Powered Code Analysis
- **Claude Integration**: Comprehensive code analysis using Anthropic's Claude AI
- **Smart Suggestions**: Security, performance, style, and bug detection with inline recommendations
- **Risk Assessment**: Overall scoring (0-100), complexity analysis, and security risk evaluation
- **Estimated Review Time**: AI calculates expected review duration

### Advanced Diff Viewer
- **Monaco Editor Integration**: Professional code editing experience with syntax highlighting
- **Side-by-Side Diff**: Clean, readable code comparison for 20+ programming languages
- **Inline AI Suggestions**: Contextual AI recommendations directly in code
- **Collapsible Sections**: Focus on important changes with expandable file views

### GitHub Integration
- **Personal Access Token Auth**: Secure GitHub authentication
- **Real-time Sync**: Live pull request updates and repository management
- **Direct GitHub Links**: Quick access to original PRs and seamless workflow integration

## Security
- This is just a POC.
- Everything currently saves in localStorage. There is no remote saving of api tokens.
- Changes to state are superficial and will reset on refresh.

## 🛠 Tech Stack

- **Frontend**: React 19.1.1 + TypeScript
- **Styling**: Tailwind CSS 4.1.12 with custom animations
- **State Management**: Zustand for lightweight, efficient state management
- **API Integration**: GitHub REST API + Anthropic Claude API
- **Code Editor**: Monaco Editor for professional diff viewing
- **Build Tool**: Vite for fast development and optimized builds
- **Animations**: Framer Motion for smooth transitions and micro-interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- GitHub Personal Access Token with `repo`, `read:user`, and `read:org` scopes
- Anthropic Claude API key (optional, for AI features)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd reviewly
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Setup GitHub Authentication:**
   - Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select required scopes: `repo`, `read:user`, `read:org`
   - Copy the token and enter it in Reviewly's authentication screen

4. **Setup AI Features (Optional):**
   - Get an API key from [Anthropic Console](https://console.anthropic.com)
   - Add the key in the app's settings for AI-powered code analysis

### Usage

1. **Dashboard**: View all your pull requests with smart prioritization
2. **Review PRs**: Click any PR to open the detailed review interface
3. **AI Analysis**: Use the "AI Review" button for intelligent code analysis
4. **Manage Queue**: Mark PRs as complete, delay them, or make them "spicy" for priority
5. **Inline Suggestions**: View AI recommendations directly in the code diff

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # GitHub authentication components
│   ├── code/           # Code analysis and suggestion components
│   ├── dashboard/      # Main dashboard and review management
│   ├── diff/           # Advanced diff viewer with Monaco editor
│   ├── layout/         # App layout and navigation
│   └── ui/            # Reusable UI components and utilities
├── pages/             # Main application pages and routing
├── services/          # API integration (GitHub, AI, caching)
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions and helpers
```

## 🎯 Why Reviewly?

Traditional code review tools are functional but lack modern UX and intelligent assistance. Reviewly bridges this gap by:

1. **Making Reviews Enjoyable**: Gamification and smooth UX turn code review into an engaging activity
2. **Saving Time**: AI-powered insights help reviewers focus on what matters most
3. **Improving Quality**: Structured review process with intelligent suggestions leads to better code
4. **Reducing Context Switching**: Everything you need in one unified, beautiful interface

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis

## 🤝 Contributing

This is an open-source project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is open source and available under the MIT License.
