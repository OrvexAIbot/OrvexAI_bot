<div align="center">
  <img src="./orvex.png" alt="Orvex Logo" width="200"/>

  # Orvex AI

  **Autonomous AI Trading Agent for Solana**

  [![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20Opus%204.5-FF6B35?style=for-the-badge)](https://www.anthropic.com/claude)
  [![Built with React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
  [![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

  [🚀 Launch Bot](https://t.me/orvexai_bot) • [🌐 Website](https://orvexai.com) • [📖 Documentation](#features)

  ---
</div>

## 📊 Overview

**Orvex** is an advanced AI-powered trading agent that autonomously scans the Solana blockchain to identify high-velocity breakout opportunities before they happen. Leveraging **Claude Opus 4.5** by Anthropic, Orvex analyzes complex on-chain patterns, wallet behaviors, and market narratives to deliver actionable trading signals directly to your Telegram.

Unlike traditional volume bots or manual research, Orvex operates 24/7 with sub-50ms latency, monitoring every Raydium pool, Pump.fun graduation, and insider wallet movement in real-time.

---

## ✨ Key Features

### 🧠 **Claude Opus 4.5 Intelligence**
- Advanced natural language reasoning applied to blockchain data
- Contextual understanding of market narratives and whale behavior
- Distinguishes genuine accumulation from wash trading and fake volume

### ⚡ **Real-Time Solana Monitoring**
- Direct RPC node connection for instant data access
- Scans thousands of new liquidity pools per minute
- Tracks Pump.fun migrations and Raydium pair creation

### 📈 **Predictive Breakout Detection**
- Identifies accumulation patterns that historically precede 100x gains
- Analyzes holder distribution, liquidity depth, and volume divergence
- Machine learning models trained on successful past breakouts

### 🎯 **Instant Telegram Alerts**
- Zero dashboard friction—signals delivered directly to your phone
- Includes contract address, confidence score, and entry recommendations
- Optional auto-execution with 1% performance fee

### 🔒 **Free to Use**
- No subscriptions or credit cards required
- Pay only 1% on bot-executed trades (manual trades are free)
- Unlimited access to all scanning and analysis features

---

## 🏗️ Architecture

### Frontend (This Repository)
```
React 19 + TypeScript
├─ Vite Build System
├─ Framer Motion (Animations)
├─ GSAP + ScrollTrigger (Scroll Effects)
├─ Three.js (3D Background)
├─ React Router (Navigation)
└─ Tailwind CSS (Styling)
```

### AI Agent Backend
- **Claude Opus 4.5** for chain analysis and signal generation
- **Solana Web3.js** for blockchain data ingestion
- **Jupiter Aggregator API** for liquidity analysis
- **Telegram Bot API** for alert distribution

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OrvexAIbot/OrvexAI_bot.git
   cd OrvexAI_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This generates an optimized production bundle in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📦 Deployment

This project is optimized for deployment on **Vercel**, **Netlify**, or any static hosting platform.

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Vite configuration
4. Deploy with one click

### Deploy to Netlify

```bash
npm run build
```

Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

---

## 🎨 Project Structure

```
.
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── AlertCard.tsx
│   ├── TelegramMockup.tsx
│   └── NetworkBackground.tsx
├── pages/              # Route pages
│   ├── Home.tsx
│   ├── Capabilities.tsx
│   ├── Examples.tsx
│   └── Waitlist.tsx
├── bot/                # Telegram bot backend (separate service)
├── public/             # Static assets
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── constants.tsx       # Feature definitions and example data
├── types.ts            # TypeScript type definitions
└── vite.config.ts      # Vite configuration
```

---

## 🤖 Using the Telegram Bot

1. Open Telegram and search for **@orvexai_bot**
2. Start a conversation with `/start`
3. Connect your Solana wallet (optional, for auto-execution)
4. Begin receiving real-time trading signals

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 19.2 |
| **Build Tool** | Vite 6.2 |
| **Language** | TypeScript 5.8 |
| **Styling** | Tailwind CSS |
| **Animation** | Framer Motion, GSAP |
| **3D Graphics** | Three.js |
| **Routing** | React Router DOM 7 |
| **AI Model** | Claude Opus 4.5 (Anthropic) |
| **Blockchain** | Solana (Web3.js) |
| **Hosting** | Vercel (Recommended) |

---

## 📊 Performance Metrics

- **Uptime**: 99.9% (24/7 monitoring)
- **Latency**: <50ms processing speed
- **Coverage**: All Solana DEXs and liquidity pools
- **Signal Accuracy**: Continuously improving through machine learning

---

## 🔐 Security & Privacy

- **Non-custodial**: Your private keys never leave your device
- **Opt-in execution**: All trades require explicit confirmation
- **Open source frontend**: Full transparency in our web interface
- **Encrypted communication**: All Telegram messages use end-to-end encryption

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Contact & Support

- **Telegram Bot**: [@orvexai_bot](https://t.me/orvexai_bot)
- **Website**: [orvexai.com](https://orvexai.com)
- **GitHub Issues**: [Report a bug](https://github.com/OrvexAIbot/OrvexAI_bot/issues)

---

<div align="center">
  <sub>Built with ❤️ by the Orvex Team</sub>
  <br/>
  <sub>Powered by Claude Opus 4.5 • Running on Solana</sub>
</div>
