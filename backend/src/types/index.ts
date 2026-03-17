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
