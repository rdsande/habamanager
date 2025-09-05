const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');
const AuditLogger = require('../utils/auditLogger');

const router = express.Router();

// Helper function to get week of month
function getWeekOfMonth(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

// Get all expenses with optional filtering
router.get('/', async (req, res) => {
  try {
    const { filter, category, business, start_date, end_date } = req.query;
    
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    let params = [];

    // Apply date filters
    if (filter) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      switch (filter) {
        case 'today':
          sql += ' AND date = ?';
          params.push(today);
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          sql += ' AND date >= ?';
          params.push(weekStart.toISOString().split('T')[0]);
          break;
        case 'month':
          sql += ' AND month = ? AND year = ?';
          params.push(now.getMonth() + 1, now.getFullYear());
          break;
      }
    }

    // Apply category filter
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Apply business filter
    if (business && business !== 'all') {
      sql += ' AND related_business = ?';
      params.push(business);
    }

    // Apply custom date range
    if (start_date) {
      sql += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY date DESC, created_at DESC';

    const expenses = await db.all(sql, params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { description, amount, category, related_business, date, account_id, notes } = req.body;
    
    if (!description || !amount || !category || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expenseAmount = parseFloat(amount);
    if (expenseAmount <= 0) {
      return res.status(400).json({ error: 'Expense amount must be positive' });
    }

    // Check if account exists and has sufficient funds
    if (account_id) {
      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [account_id]);
      if (!account) {
        return res.status(400).json({ error: 'Selected account not found' });
      }
      if (account.balance < expenseAmount) {
        return res.status(400).json({ error: 'Insufficient funds in selected account' });
      }
    }

    const expenseDate = new Date(date);
    const id = uuidv4();
    const transactionId = uuidv4();

    const operations = [
      () => db.run(
        `INSERT INTO expenses (id, description, amount, category, related_business, date, week, month, year, account_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, description, expenseAmount, category, related_business || '', date,
          getWeekOfMonth(expenseDate), expenseDate.getMonth() + 1, expenseDate.getFullYear(),
          account_id, notes || ''
        ]
      )
    ];

    // Deduct from account if specified
    if (account_id) {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [expenseAmount, account_id]
        ),
        () => db.run(
          `INSERT INTO transactions (id, account_id, type, amount, description, date, related_id, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId, account_id, 'expense', expenseAmount, 
            `${category}: ${description}`, new Date().toISOString(), id, notes || ''
          ]
        )
      );
    }

    await db.transaction(operations);

    const newExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    
    // Log the CREATE operation
    await AuditLogger.logCreate('expenses', id, newExpense);
    
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { description, amount, category, related_business, date, notes } = req.body;
    const expenseId = req.params.id;

    const existingExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // If amount is being changed and expense is linked to account, check balance
    if (amount && amount !== existingExpense.amount && existingExpense.account_id) {
      const newAmount = parseFloat(amount);
      const amountDifference = newAmount - existingExpense.amount;
      
      if (amountDifference > 0) {
        const account = await db.get('SELECT * FROM accounts WHERE id = ?', [existingExpense.account_id]);
        if (account && account.balance < amountDifference) {
          return res.status(400).json({ error: 'Insufficient funds for expense increase' });
        }
      }
    }

    const updatedDate = date ? new Date(date) : new Date(existingExpense.date);
    const updatedAmount = amount !== undefined ? parseFloat(amount) : existingExpense.amount;

    const operations = [
      () => db.run(
        `UPDATE expenses SET description = ?, amount = ?, category = ?, related_business = ?, 
         date = ?, week = ?, month = ?, year = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          description || existingExpense.description,
          updatedAmount,
          category || existingExpense.category,
          related_business !== undefined ? related_business : existingExpense.related_business,
          date || existingExpense.date,
          getWeekOfMonth(updatedDate),
          updatedDate.getMonth() + 1,
          updatedDate.getFullYear(),
          notes !== undefined ? notes : existingExpense.notes,
          expenseId
        ]
      )
    ];

    // Update account balance if amount changed and account is linked
    if (amount && amount !== existingExpense.amount && existingExpense.account_id) {
      const amountDifference = updatedAmount - existingExpense.amount;
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [amountDifference, existingExpense.account_id]
        )
      );

      // Update related transaction
      operations.push(
        () => db.run(
          'UPDATE transactions SET amount = ?, description = ? WHERE related_id = ? AND type = "expense"',
          [updatedAmount, `${category || existingExpense.category}: ${description || existingExpense.description}`, expenseId]
        )
      );
    }

    await db.transaction(operations);

    const updatedExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});



// Get expense summary by category
router.get('/summary/category', async (req, res) => {
  try {
    const { start_date, end_date, business } = req.query;
    
    let sql = `
      SELECT category, 
             COUNT(*) as count, 
             SUM(amount) as total_amount,
             AVG(amount) as avg_amount,
             MIN(amount) as min_amount,
             MAX(amount) as max_amount
      FROM expenses 
      WHERE 1=1
    `;
    let params = [];

    if (start_date) {
      sql += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date <= ?';
      params.push(end_date);
    }
    if (business && business !== 'all') {
      sql += ' AND related_business = ?';
      params.push(business);
    }

    sql += ' GROUP BY category ORDER BY total_amount DESC';

    const summary = await db.all(sql, params);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

// Get monthly expense trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const { year, business } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    let sql = `
      SELECT month, 
             COUNT(*) as count, 
             SUM(amount) as total_amount
      FROM expenses 
      WHERE year = ?
    `;
    let params = [targetYear];

    if (business && business !== 'all') {
      sql += ' AND related_business = ?';
      params.push(business);
    }

    sql += ' GROUP BY month ORDER BY month';

    const trends = await db.all(sql, params);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching expense trends:', error);
    res.status(500).json({ error: 'Failed to fetch expense trends' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Get expense details before deletion for audit log
    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // If expense has an account, restore the balance
    if (expense.account_id && expense.amount) {
      await db.run(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [expense.amount, expense.account_id]
      );
    }

    // Delete the expense
    const result = await db.run('DELETE FROM expenses WHERE id = ?', [expenseId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Log the deletion
    await AuditLogger.logDelete('expenses', expenseId, expense);
    
    res.json({ message: 'Expense deleted successfully', id: expenseId });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;