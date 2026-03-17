# AI Expense Tracker

A full-stack expense tracking app that uses AI to parse natural language input and automatically categorize expenses.

Built by: Vikas Sharma

## Tech Stack

- **Mobile:** React Native, Expo SDK 55, TypeScript, Expo Router
- **Backend:** Node.js, Express 5, TypeScript
- **Database:** SQLite (better-sqlite3)
- **AI:** Groq API (llama-3.3-70b-versatile)

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- Expo CLI (`npx expo`)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your Groq API key to .env
npm run dev
```

Server starts at `http://localhost:3000`.

### Mobile

```bash
cd AiExpense
npm install
npx expo start
# Scan QR code with Expo Go app
```

> **Note:** For physical device testing, update `API_BASE_URL` in `AiExpense/services/api.ts` to your machine's LAN IP.

## Project Structure

```
ai-expense-tracker/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── database/db.ts    # SQLite CRUD operations
│   │   ├── services/aiParser.ts  # Groq AI integration
│   │   ├── routes/expenses.ts    # REST API endpoints
│   │   └── types/index.ts    # Shared interfaces
│   ├── .env.example
│   └── package.json
├── AiExpense/                # React Native Expo app
│   ├── app/
│   │   ├── _layout.tsx       # Root layout
│   │   └── index.tsx         # Main expense tracker screen
│   ├── components/
│   │   ├── ExpenseInput.tsx   # Text input with add button
│   │   ├── SuccessCard.tsx    # Confirmation card after adding
│   │   └── ExpenseItem.tsx    # Expense list item with delete
│   ├── services/api.ts       # Backend API client
│   ├── constants/categories.ts  # Category emoji mapping
│   └── types/index.ts        # Expense interface
└── README.md
```

## AI Prompt Design

The system prompt instructs the LLM to act as an expense parser that:
1. Extracts amount as a number
2. Defaults to INR currency
3. Categorizes into one of 8 fixed categories
4. Generates a clean description
5. Identifies merchant names when mentioned
6. Returns structured JSON only — no explanatory text

**Why this approach:** Constraining the LLM to JSON-only output with explicit category options minimizes parsing failures. Temperature 0 ensures deterministic responses. The error response format (`{ error, amount: null }`) lets the backend distinguish parse failures from valid results without try/catch on the AI response itself.

## AI Tools Used

- **Claude Code (Claude Opus 4.6):** Architecture design, implementation, debugging
- **Groq API (llama-3.3-70b-versatile):** Runtime expense parsing

Most helpful prompt: The system prompt constraining output to exactly one JSON schema with explicit category enumeration — eliminates ambiguity and makes validation trivial.

## What I'd Add With More Time

- [ ] Edit expense functionality
- [ ] Monthly spending summary with charts
- [ ] Offline support with sync
- [ ] Multi-currency conversion
- [ ] Receipt photo scanning with OCR
- [ ] Export to CSV/PDF

## License

MIT — Feel free to use this for your own projects!
