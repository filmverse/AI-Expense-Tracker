# AI Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI expense tracker with natural language parsing — Node.js/Express/SQLite backend + React Native/Expo mobile app + Groq AI.

**Architecture:** Monorepo with `backend/` (Express + better-sqlite3 + Groq API) and `mobile/` (Expo SDK 55 managed workflow). Backend parses natural language via Groq, stores in SQLite, exposes REST API. Mobile is a single-screen app that calls the backend.

**Tech Stack:** Node.js, Express, TypeScript, better-sqlite3, Groq API (llama-3.1-70b-versatile), React Native, Expo SDK 55, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-17-ai-expense-tracker-design.md`

---

## File Map

### Backend (`backend/`)

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies: express, cors, better-sqlite3, dotenv, typescript, ts-node, @types/* |
| `tsconfig.json` | TypeScript config targeting ES2020, CommonJS modules |
| `.env` | `GROQ_API_KEY=gsk_...` (gitignored) |
| `.env.example` | `GROQ_API_KEY=your_groq_api_key_here` |
| `src/types/index.ts` | Expense, ParsedExpense, CreateExpenseInput interfaces |
| `src/database/db.ts` | SQLite init, createExpense, getAllExpenses, deleteExpense |
| `src/services/aiParser.ts` | parseExpense() — calls Groq, validates response |
| `src/routes/expenses.ts` | Express router: POST/GET/DELETE /api/expenses |
| `src/index.ts` | Express server setup, cors, routes, port 3000 |

### Mobile (`mobile/`)

| File | Responsibility |
|------|---------------|
| `package.json` | Expo SDK 55 dependencies |
| `app.json` | Expo config |
| `App.tsx` | Entry point, renders ExpenseTrackerScreen |
| `src/types/index.ts` | Expense interface |
| `src/constants.ts` | Category emoji map (shared across components) |
| `src/services/api.ts` | addExpense, getExpenses, deleteExpense — HTTP calls |
| `src/components/ExpenseInput.tsx` | TextInput + Add button + loading spinner |
| `src/components/SuccessCard.tsx` | Green card shown 3s after adding expense |
| `src/components/ExpenseItem.tsx` | Single expense row with delete button |
| `src/screens/ExpenseTrackerScreen.tsx` | Main screen composing all components |

### Root

| File | Responsibility |
|------|---------------|
| `.gitignore` | node_modules, .env, *.db |
| `README.md` | Setup instructions, tech stack, demo link |

---

## Chunk 1: Backend Foundation

### Task 1: Project scaffolding and root config

**Files:**
- Create: `.gitignore`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env`
- Create: `backend/.env.example`

- [ ] **Step 1: Create root `.gitignore`**

```gitignore
node_modules/
dist/
.env
*.db
.expo/
```

- [ ] **Step 2: Initialize backend package.json**

```bash
cd ~/Projects/ai-expense-tracker/backend
npm init -y
```

Then update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "start": "ts-node src/index.ts"
  }
}
```

- [ ] **Step 3: Install backend dependencies**

```bash
cd ~/Projects/ai-expense-tracker/backend
npm install express cors better-sqlite3 dotenv
npm install -D typescript ts-node @types/node @types/express @types/cors @types/better-sqlite3
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 5: Create .env and .env.example**

`.env.example`:
```
GROQ_API_KEY=your_groq_api_key_here
```

`.env` (gitignored — never committed):
```
GROQ_API_KEY=<actual key>
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore backend/package.json backend/package-lock.json backend/tsconfig.json backend/.env.example
git commit -m "feat: scaffold backend project with Express + TypeScript"
```

---

### Task 2: Shared types

**Files:**
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: Create type definitions**

```typescript
export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
}

export interface Expense extends ParsedExpense {
  id: number;
  original_input: string;
  created_at: string;
}

export interface CreateExpenseInput extends ParsedExpense {
  original_input: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  expense?: T;
  expenses?: T[];
  error?: string;
  message?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/types/index.ts
git commit -m "feat: add shared TypeScript interfaces"
```

---

### Task 3: Database layer

**Files:**
- Create: `backend/src/database/db.ts`

- [ ] **Step 1: Implement SQLite database module**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { Expense, CreateExpenseInput } from '../types';

const DB_PATH = path.join(__dirname, '..', '..', 'expenses.db');

let db: Database.Database;

export function initDatabase(): void {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      merchant TEXT,
      original_input TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export function createExpense(input: CreateExpenseInput): Expense {
  const stmt = db.prepare(`
    INSERT INTO expenses (amount, currency, category, description, merchant, original_input)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.amount,
    input.currency,
    input.category,
    input.description,
    input.merchant,
    input.original_input
  );

  return getExpenseById(result.lastInsertRowid as number)!;
}

function getExpenseById(id: number): Expense | undefined {
  const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
  return stmt.get(id) as Expense | undefined;
}

export function getAllExpenses(): Expense[] {
  const stmt = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC');
  return stmt.all() as Expense[];
}

export function deleteExpense(id: number): boolean {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/database/db.ts
git commit -m "feat: add SQLite database layer with CRUD operations"
```

---

### Task 4: AI parser service

**Files:**
- Create: `backend/src/services/aiParser.ts`

- [ ] **Step 1: Implement Groq AI parser**

```typescript
import { ParsedExpense } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-70b-versatile';

const SYSTEM_PROMPT = `You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract the amount as a number (no currency symbols)
2. Default currency is INR unless explicitly mentioned (USD, EUR, etc.)
3. Categorize into EXACTLY one of these categories:
   - Food & Dining (restaurants, cafes, food delivery, groceries)
   - Transport (uber, ola, taxi, fuel, parking, metro)
   - Shopping (clothes, electronics, amazon, flipkart)
   - Entertainment (movies, netflix, spotify, games)
   - Bills & Utilities (electricity, water, internet, phone)
   - Health (medicine, doctor, gym, pharmacy)
   - Travel (flights, hotels, trips)
   - Other (anything that doesn't fit above)
4. Description should be a clean summary (not the raw input)
5. Merchant is the company/store name if mentioned, null otherwise

RESPOND ONLY WITH VALID JSON, no other text:
{
  "amount": <number>,
  "currency": "<string>",
  "category": "<string>",
  "description": "<string>",
  "merchant": "<string or null>"
}

If the input is invalid or you cannot extract an amount, respond:
{
  "error": "Could not parse expense. Please include an amount.",
  "amount": null
}`;

const VALID_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Other',
];

export async function parseExpense(
  text: string
): Promise<ParsedExpense | { error: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Failed to parse expense');
  }

  if (parsed.error || parsed.amount === null || parsed.amount === undefined) {
    return {
      error: parsed.error || 'Could not parse expense. Please include an amount.',
    };
  }

  if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
    return { error: 'Could not parse expense. Please include a valid amount.' };
  }

  return {
    amount: parsed.amount,
    currency: parsed.currency || 'INR',
    category: VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'Other',
    description: parsed.description || text,
    merchant: parsed.merchant || null,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/aiParser.ts
git commit -m "feat: add Groq AI parser service for natural language expenses"
```

---

### Task 5: Express routes

**Files:**
- Create: `backend/src/routes/expenses.ts`

- [ ] **Step 1: Implement expense routes**

```typescript
import { Router, Request, Response } from 'express';
import { parseExpense } from '../services/aiParser';
import { createExpense, getAllExpenses, deleteExpense } from '../database/db';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Input text is required' });
      return;
    }

    if (input.length > 500) {
      res
        .status(400)
        .json({ success: false, error: 'Input too long (max 500 characters)' });
      return;
    }

    const parsed = await parseExpense(input.trim());

    if ('error' in parsed) {
      res.status(400).json({ success: false, error: parsed.error });
      return;
    }

    const expense = createExpense({
      ...parsed,
      original_input: input.trim(),
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, error: 'Failed to parse expense' });
  }
});

router.get('/', (_req: Request, res: Response) => {
  try {
    const expenses = getAllExpenses();
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid expense ID' });
      return;
    }

    const deleted = deleteExpense(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Expense not found' });
      return;
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/expenses.ts
git commit -m "feat: add expense REST API routes"
```

---

### Task 6: Express server entry point

**Files:**
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create server entry point**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/db';
import expenseRoutes from './routes/expenses';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/expenses', expenseRoutes);

initDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add Express server with health check and expense routes"
```

---

### Task 7: Verify backend with curl

- [ ] **Step 1: Start server**

```bash
cd ~/Projects/ai-expense-tracker/backend && npm run dev
```

Expected: `Server running on http://localhost:3000`

- [ ] **Step 2: Test health check**

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Test adding expense**

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"input": "Spent 850 on lunch at Taj Hotel"}'
```

Expected: 201 with `{ success: true, expense: { amount: 850, category: "Food & Dining", ... } }`

- [ ] **Step 4: Test listing expenses**

```bash
curl http://localhost:3000/api/expenses
```

Expected: 200 with expenses array.

- [ ] **Step 5: Test error case**

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"input": "coffee"}'
```

Expected: 400 with error about missing amount.

- [ ] **Step 6: Test delete**

```bash
curl -X DELETE http://localhost:3000/api/expenses/1
```

Expected: 200 with success message.

- [ ] **Step 7: Stop server after verification**

---

## Chunk 2: Mobile App

### Task 8: Initialize Expo project

**Files:**
- Create: `mobile/` (Expo scaffold)

- [ ] **Step 1: Create Expo app**

```bash
cd ~/Projects/ai-expense-tracker
npx create-expo-app@latest mobile --template blank-typescript
```

This creates an Expo SDK 55 project with TypeScript and React Compiler.

**Important:** Expo SDK 55 `blank-typescript` template creates a traditional `App.tsx` entry point (NOT Expo Router). If the scaffold produces an `app/` directory instead, delete it and create `App.tsx` at root manually. Verify with `ls mobile/App.tsx` after scaffolding.

- [ ] **Step 2: Commit**

```bash
git add mobile/
git commit -m "feat: scaffold Expo SDK 55 mobile app"
```

---

### Task 9: Mobile types and API service

**Files:**
- Create: `mobile/src/types/index.ts`
- Create: `mobile/src/constants.ts`
- Create: `mobile/src/services/api.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// mobile/src/types/index.ts
export interface Expense {
  id: number;
  amount: number;
  currency: string;
  category: string;
  description: string;
  merchant: string | null;
  original_input: string;
  created_at: string;
}
```

- [ ] **Step 2: Create shared constants**

```typescript
// mobile/src/constants.ts
export const CATEGORY_EMOJIS: Record<string, string> = {
  'Food & Dining': '🍔',
  Transport: '🚗',
  Shopping: '🛒',
  Entertainment: '📺',
  'Bills & Utilities': '📄',
  Health: '💊',
  Travel: '✈️',
  Other: '📦',
};
```

- [ ] **Step 3: Create API service**

```typescript
// mobile/src/services/api.ts
import { Expense } from '../types';

// Use localhost for iOS Simulator. For Android emulator use 10.0.2.2.
// For physical device use your machine's LAN IP (e.g., 192.168.x.x).
const API_BASE_URL = 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function addExpense(input: string): Promise<Expense> {
  const data = await request<{ success: boolean; expense: Expense }>(
    '/api/expenses',
    {
      method: 'POST',
      body: JSON.stringify({ input }),
    }
  );
  return data.expense;
}

export async function getExpenses(): Promise<Expense[]> {
  const data = await request<{ success: boolean; expenses: Expense[] }>(
    '/api/expenses'
  );
  return data.expenses;
}

export async function deleteExpense(id: number): Promise<void> {
  await request(`/api/expenses/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/types/index.ts mobile/src/constants.ts mobile/src/services/api.ts
git commit -m "feat: add mobile types, constants, and API service"
```

---

### Task 10: ExpenseInput component

**Files:**
- Create: `mobile/src/components/ExpenseInput.tsx`

- [ ] **Step 1: Implement ExpenseInput**

```tsx
import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface Props {
  onSubmit: (text: string) => Promise<void>;
  loading: boolean;
}

export default function ExpenseInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    await onSubmit(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder='e.g., Spent 500 on groceries at BigBazaar'
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
        editable={!loading}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[
          styles.button,
          (!text.trim() || loading) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!text.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/ExpenseInput.tsx
git commit -m "feat: add ExpenseInput component"
```

---

### Task 11: SuccessCard component

**Files:**
- Create: `mobile/src/components/SuccessCard.tsx`

- [ ] **Step 1: Implement SuccessCard**

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Expense } from '../types';
import { CATEGORY_EMOJIS } from '../constants';

interface Props {
  expense: Expense;
}

export default function SuccessCard({ expense }: Props) {
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Added Successfully!</Text>
      <Text style={styles.detail}>
        Amount: {expense.currency === 'INR' ? '₹' : expense.currency}
        {expense.amount.toFixed(2)}
      </Text>
      <Text style={styles.detail}>
        Category: {emoji} {expense.category}
      </Text>
      <Text style={styles.detail}>Description: {expense.description}</Text>
      {expense.merchant && (
        <Text style={styles.detail}>Merchant: {expense.merchant}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/SuccessCard.tsx
git commit -m "feat: add SuccessCard component"
```

---

### Task 12: ExpenseItem component

**Files:**
- Create: `mobile/src/components/ExpenseItem.tsx`

- [ ] **Step 1: Implement ExpenseItem**

```tsx
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Expense } from '../types';
import { CATEGORY_EMOJIS } from '../constants';

// SQLite datetime('now') stores UTC without Z suffix — append Z to parse correctly
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString + 'Z');
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

interface Props {
  expense: Expense;
  onDelete: (id: number) => void;
}

export default function ExpenseItem({ expense, onDelete }: Props) {
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(expense.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.category}>
            {emoji} {expense.category}
          </Text>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.time}>{timeAgo(expense.created_at)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>
            {expense.currency === 'INR' ? '₹' : expense.currency}
            {expense.amount.toFixed(2)}
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  deleteButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deleteText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/components/ExpenseItem.tsx
git commit -m "feat: add ExpenseItem component with delete and time ago"
```

---

### Task 13: Main screen

**Files:**
- Create: `mobile/src/screens/ExpenseTrackerScreen.tsx`

- [ ] **Step 1: Implement ExpenseTrackerScreen**

```tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Expense } from '../types';
import * as api from '../services/api';
import ExpenseInput from '../components/ExpenseInput';
import SuccessCard from '../components/SuccessCard';
import ExpenseItem from '../components/ExpenseItem';

export default function ExpenseTrackerScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch expenses');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (text: string) => {
    setLoading(true);
    try {
      const expense = await api.addExpense(text);
      setLastAdded(expense);
      await fetchExpenses();
      setTimeout(() => setLastAdded(null), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      await fetchExpenses();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete expense');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>AI Expense Tracker</Text>
        <Text style={styles.subtitle}>Add expenses in plain English</Text>
      </View>

      <ExpenseInput onSubmit={handleAddExpense} loading={loading} />

      {lastAdded && <SuccessCard expense={lastAdded} />}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem expense={item} onDelete={handleDeleteExpense} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={expenses.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses yet.</Text>
            <Text style={styles.emptySubtext}>Add your first one!</Text>
          </View>
        }
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/ExpenseTrackerScreen.tsx
git commit -m "feat: add main ExpenseTrackerScreen"
```

---

### Task 14: Wire up App.tsx

**Files:**
- Modify: `mobile/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace contents with:

```tsx
import ExpenseTrackerScreen from './src/screens/ExpenseTrackerScreen';

export default function App() {
  return <ExpenseTrackerScreen />;
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/App.tsx
git commit -m "feat: wire App.tsx to ExpenseTrackerScreen"
```

---

## Chunk 3: Integration and Polish

### Task 15: End-to-end testing

- [ ] **Step 1: Start backend**

```bash
cd ~/Projects/ai-expense-tracker/backend && npm run dev
```

- [ ] **Step 2: Start mobile in a separate terminal**

```bash
cd ~/Projects/ai-expense-tracker/mobile && npx expo start
```

- [ ] **Step 3: Run manual test checklist**

| Test | Expected |
|------|----------|
| Add "spent 500 on coffee" | Added, shows in list |
| Add "uber 350" | Categorized as Transport |
| Add "netflix subscription 649" | Entertainment, merchant: Netflix |
| Add "coffee" (no amount) | Error alert |
| Add "asdfgh" | Error alert |
| Pull down on list | List refreshes |
| Tap delete | Confirmation dialog |
| Confirm delete | Expense removed |
| Cancel delete | Expense stays |

- [ ] **Step 4: Fix any issues found**

---

### Task 16: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Include: title, tech stack, setup instructions for backend and mobile, project structure, AI prompt design, time breakdown, future improvements, AI tools used.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

### Task 17: Final verification

- [ ] **Step 1: Verify .gitignore** — `.env` and `*.db` not tracked
- [ ] **Step 2: Verify .env.example exists** with placeholder key
- [ ] **Step 3: Final commit if cleanup needed**
