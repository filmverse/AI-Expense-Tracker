import { Expense } from '@/types';

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
