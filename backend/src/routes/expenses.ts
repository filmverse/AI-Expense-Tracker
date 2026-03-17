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
    const rawId = req.params.id;
    const id = parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);

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
