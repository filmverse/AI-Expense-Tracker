# AI Expense Tracker — Design Spec

## Overview

A full-stack expense tracker where users add expenses in natural language and AI automatically categorizes them. Built as a developer assessment for Grade Technologies.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, better-sqlite3
- **Mobile:** React Native, Expo (managed workflow), TypeScript
- **AI:** Groq API (`llama-3.1-70b-versatile`)
- **Project structure:** Monorepo — `backend/` and `mobile/` in one repo

## Backend

### File Structure

```
backend/
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── src/
    ├── index.ts
    ├── database/
    │   └── db.ts
    ├── services/
    │   └── aiParser.ts
    ├── routes/
    │   └── expenses.ts
    └── types/
        └── index.ts
```

### Database

Single `expenses` table in SQLite:

| Column         | Type          | Description                              |
|----------------|---------------|------------------------------------------|
| id             | INTEGER       | Primary key, auto-increment              |
| amount         | DECIMAL(10,2) | Expense amount                           |
| currency       | VARCHAR(3)    | Currency code, default "INR"             |
| category       | VARCHAR(50)   | Category name                            |
| description    | TEXT          | Clean summary of the expense             |
| merchant       | VARCHAR(100)  | Store/company name, nullable             |
| original_input | TEXT          | Raw user input text                      |
| created_at     | TIMESTAMP     | Auto-set on insert                       |

### AI Parser Service

- Calls Groq API at `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.1-70b-versatile`
- Uses the system prompt from the assessment spec to parse natural language into structured JSON
- Input: raw text string
- Output: `{ amount, currency, category, description, merchant }`
- Validates response schema, defaults to "INR" currency and "Other" category
- Returns error object if amount cannot be extracted

### API Endpoints

| Method | Path               | Description          | Success | Error |
|--------|--------------------|----------------------|---------|-------|
| GET    | /health            | Health check         | 200     | —     |
| POST   | /api/expenses      | Add expense via AI   | 201     | 400   |
| GET    | /api/expenses      | List all, newest first | 200   | 500   |
| DELETE | /api/expenses/:id  | Delete by ID         | 200     | 404   |

Response format: `{ success: boolean, expense/expenses/error/message: ... }`

## Mobile App

### File Structure

```
mobile/
├── package.json
├── app.json
├── App.tsx
└── src/
    ├── screens/
    │   └── ExpenseTrackerScreen.tsx
    ├── components/
    │   ├── ExpenseInput.tsx
    │   ├── SuccessCard.tsx
    │   └── ExpenseItem.tsx
    ├── services/
    │   └── api.ts
    └── types/
        └── index.ts
```

### Screen Layout (top to bottom)

1. **Header** — Title "AI Expense Tracker", subtitle "Add expenses in plain English"
2. **ExpenseInput** — TextInput with placeholder, Add button (disabled when empty/loading), spinner while submitting
3. **SuccessCard** — Green card shown for 3 seconds after successful add. Displays amount, category emoji, description, merchant.
4. **ExpenseList** — FlatList with pull-to-refresh. Each item: category emoji + name, amount in INR, description, relative time, delete button.
5. **Empty state** — "No expenses yet. Add your first one!"

### API Service

Three functions in `api.ts`:
- `addExpense(input: string): Promise<Expense>` — POST /api/expenses
- `getExpenses(): Promise<Expense[]>` — GET /api/expenses
- `deleteExpense(id: number): Promise<void>` — DELETE /api/expenses/:id

Base URL configurable as constant. 10-second timeout.

### Category Emoji Map

| Category          | Emoji |
|-------------------|-------|
| Food & Dining     | 🍔    |
| Transport         | 🚗    |
| Shopping          | 🛒    |
| Entertainment     | 📺    |
| Bills & Utilities | 📄    |
| Health            | 💊    |
| Travel            | ✈️    |
| Other             | 📦    |

### Error Handling

- Alert.alert for API failures and parse errors
- Error message from backend displayed directly to user

### Delete Flow

Tap delete → Alert.alert confirmation → API call → refetch list on success

## Data Flow

### Add Expense

```
User types text
→ ExpenseInput calls api.addExpense(text)
  → POST /api/expenses { input: text }
    → aiParser.parseExpense(text) calls Groq
      → Groq returns { amount, currency, category, description, merchant }
    → Validate response
    → db.createExpense() saves to SQLite
    → Return 201 with expense
  → Show SuccessCard for 3 seconds
  → Refetch expense list
```

### Error

```
User types text without amount
→ Groq returns { error: "...", amount: null }
→ Backend returns 400 { success: false, error: "..." }
→ Mobile shows Alert.alert with error message
```

## Decisions

- **No optimistic updates** — simple refetch after add/delete
- **No caching** — useEffect on mount + pull-to-refresh
- **No auth** — not required
- **No unit tests** — manual testing via assessment checklist
- **No navigation** — single screen app
- **No pagination** — all expenses returned at once

## Out of Scope

- Edit expense
- Offline support
- Multiple screens / navigation
- Authentication
- Pagination
