# 📈 PickMyStock

**PickMyStock** is a modern, data-driven Indian stock research and recommendation platform designed for NSE & BSE equities. It combines technical chart analysis, fundamental health indicators, deterministic scoring models, and an AI research assistant to give investors clear, actionable market insights.

---

## 🚀 Key Features

- **📊 Market Overview & Top Movers**: Track top gainers, losers, and most active stocks across Indian exchanges in real time.
- **📈 Interactive Financial Charts**: Candlestick and volume visualization powered by TradingView Lightweight Charts.
- **📑 Fundamental & Ratio Analysis**: Detailed balance sheet, income statement, P/E, P/B, ROE, ROCE, and debt-to-equity metrics.
- **🎯 Algorithmic Recommendation Engine**: Short-term and long-term multi-factor scoring with transparent positive/negative factor breakdowns and risk disclosures.
- **⭐ Watchlist Management**: Custom watchlists to track your favorite Indian stocks.
- **🤖 AI Research Assistant**: Interactive assistant with contextual market queries and news sentiment analysis.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend (`/server`)
- **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) with TypeScript (`tsx`)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (compatible with Neon or local PostgreSQL)
- **Validation**: [Zod](https://zod.dev/)
- **Data Source**: BharatStock API integration with fallback sample data

---

## 📁 Project Structure

```text
PickMyStock/
├── client/                 # React Vite frontend application
│   ├── src/
│   │   ├── components/     # UI components (Navbar, Footer, etc.)
│   │   ├── features/       # Domain-specific components (charts, search, etc.)
│   │   ├── pages/          # Dashboard, StockDetail, Watchlist, Methodology
│   │   └── lib/            # API client and helper utilities
│   └── package.json
├── server/                 # Express REST API backend
│   ├── prisma/             # Prisma schema and seed scripts
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # Stock, watchlist, and agent endpoints
│   │   ├── services/       # Market data providers and recommendation logic
│   │   └── config/         # Environment variables & runtime config
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database (or a free [Neon](https://neon.tech/) instance)

---

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment variables and configure them
cp .env.example .env

# Generate Prisma client and push database schema
npm run prisma:generate
npm run prisma:migrate

# (Optional) Seed initial stock data
npm run prisma:seed

# Start backend development server (defaults to port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Copy environment variables (if needed)
cp .env.example .env

# Start frontend development server (defaults to port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🔑 Environment Configuration

### Server (`server/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `BHARATSTOCK_API_KEY` | API key for live NSE/BSE market data | Optional (fallback seed data) |
| `AI_PROVIDER` | AI provider (`gemini`, `openai`, `anthropic`, or `none`) | `none` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Client (`client/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL or proxy path | `/api` |

---

## 📄 License

This project is licensed under the MIT License.
