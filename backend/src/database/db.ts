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
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
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
