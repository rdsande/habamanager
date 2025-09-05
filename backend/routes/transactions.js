const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');
const AuditLogger = require('../utils/auditLogger');

const router = express.Router();

// Get all transactions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { account_id, type, start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT t.*, a.name as account_name, a.type as account_type 
      FROM transactions t 
      LEFT JOIN accounts a ON t.account_id = a.id 
      WHERE 1=1
    `;
    let params = [];

    // Apply filters
    if (account_id) {
      sql += ' AND t.account_id = ?';
      params.push(account_id);
    }

    if (type) {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    if (start_date) {
      sql += ' AND DATE(t.date) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND DATE(t.date) <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = await db.all(sql, params);
    
    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM transactions t WHERE 1=1';
    let countParams = [];
    
    if (account_id) {
      countSql += ' AND t.account_id = ?';
      countParams.push(account_id);
    }
    if (type) {
      countSql += ' AND t.type = ?';
      countParams.push(type);
    }
    if (start_date) {
      countSql += ' AND DATE(t.date) >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ' AND DATE(t.date) <= ?';
      countParams.push(end_date);
    }

    const { total } = await db.get(countSql, countParams);

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Bulk delete all transactions
router.delete('/bulk', async (req, res) => {
  try {
    // Get all transactions for audit logging before deletion
    const transactions = await db.all('SELECT * FROM transactions');
    
    // Delete all transactions
    const result = await db.run('DELETE FROM transactions');
    
    // Log each deletion for audit trail
    for (const transaction of transactions) {
      await AuditLogger.logDelete('transactions', transaction.id, transaction);
    }
    
    res.json({ 
      message: 'All transactions deleted successfully', 
      deletedCount: result.changes 
    });
  } catch (error) {
    console.error('Error bulk deleting transactions:', error);
    res.status(500).json({ error: 'Failed to bulk delete transactions' });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await db.get(
      `SELECT t.*, a.name as account_name, a.type as account_type 
       FROM transactions t 
       LEFT JOIN accounts a ON t.account_id = a.id 
       WHERE t.id = ?`,
      [req.params.id]
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Get transactions by account ID
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const transactions = await db.all(
      `SELECT * FROM transactions 
       WHERE account_id = ? 
       ORDER BY date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [accountId, parseInt(limit), parseInt(offset)]
    );
    
    const { total } = await db.get(
      'SELECT COUNT(*) as total FROM transactions WHERE account_id = ?',
      [accountId]
    );

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch account transactions' });
  }
});

// Create manual transaction (for deposits/withdrawals not handled by other endpoints)
router.post('/', async (req, res) => {
  try {
    const { account_id, type, amount, description, date, notes } = req.body;
    
    if (!account_id || !type || !amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transactionAmount = parseFloat(amount);
    if (transactionAmount <= 0) {
      return res.status(400).json({ error: 'Transaction amount must be positive' });
    }

    // Validate transaction type
    const validTypes = ['deposit', 'withdrawal', 'expense', 'investment', 'revenue', 'transfer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Check if account exists
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [account_id]);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }

    // For withdrawals, check sufficient funds
    if (type === 'withdrawal' && account.balance < transactionAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const id = uuidv4();
    const transactionDate = date || new Date().toISOString();

    const operations = [
      () => db.run(
        `INSERT INTO transactions (id, account_id, type, amount, description, date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, account_id, type, transactionAmount, description, transactionDate, notes || '']
      )
    ];

    // Update account balance based on transaction type
    if (type === 'deposit' || type === 'revenue') {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [transactionAmount, account_id]
        )
      );
    } else if (type === 'withdrawal' || type === 'expense' || type === 'investment') {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [transactionAmount, account_id]
        )
      );
    }

    await db.transaction(operations);

    const newTransaction = await db.get(
      `SELECT t.*, a.name as account_name, a.type as account_type 
       FROM transactions t 
       LEFT JOIN accounts a ON t.account_id = a.id 
       WHERE t.id = ?`,
      [id]
    );
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { description, notes } = req.body;
    const transactionId = req.params.id;

    const existingTransaction = await db.get('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only allow updating description and notes for manual transactions
    // Amount and type changes should be handled through specific endpoints
    await db.run(
      'UPDATE transactions SET description = ?, notes = ? WHERE id = ?',
      [
        description || existingTransaction.description,
        notes !== undefined ? notes : existingTransaction.notes,
        transactionId
      ]
    );

    const updatedTransaction = await db.get(
      `SELECT t.*, a.name as account_name, a.type as account_type 
       FROM transactions t 
       LEFT JOIN accounts a ON t.account_id = a.id 
       WHERE t.id = ?`,
      [transactionId]
    );
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction (only for manual transactions)
router.delete('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Prevent deletion of system-generated transactions
    if (transaction.related_id) {
      return res.status(400).json({ 
        error: 'Cannot delete system-generated transactions. Delete the related record instead.' 
      });
    }

    const operations = [
      () => db.run('DELETE FROM transactions WHERE id = ?', [transactionId])
    ];

    // Reverse the account balance change
    if (transaction.type === 'deposit' || transaction.type === 'revenue') {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [transaction.amount, transaction.account_id]
        )
      );
    } else if (transaction.type === 'withdrawal' || transaction.type === 'expense' || transaction.type === 'investment') {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [transaction.amount, transaction.account_id]
        )
      );
    }

    await db.transaction(operations);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Get transaction summary by type
router.get('/summary/type', async (req, res) => {
  try {
    const { account_id, start_date, end_date } = req.query;
    
    let sql = `
      SELECT type, 
             COUNT(*) as count, 
             SUM(amount) as total_amount,
             AVG(amount) as avg_amount
      FROM transactions 
      WHERE 1=1
    `;
    let params = [];

    if (account_id) {
      sql += ' AND account_id = ?';
      params.push(account_id);
    }
    if (start_date) {
      sql += ' AND DATE(date) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(date) <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY type ORDER BY total_amount DESC';

    const summary = await db.all(sql, params);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
});

// Get daily transaction trends
router.get('/trends/daily', async (req, res) => {
  try {
    const { account_id, days = 30 } = req.query;
    
    let sql = `
      SELECT DATE(date) as transaction_date, 
             type,
             COUNT(*) as count, 
             SUM(amount) as total_amount
      FROM transactions 
      WHERE DATE(date) >= DATE('now', '-' || ? || ' days')
    `;
    let params = [parseInt(days)];

    if (account_id) {
      sql += ' AND account_id = ?';
      params.push(account_id);
    }

    sql += ' GROUP BY DATE(date), type ORDER BY transaction_date DESC, type';

    const trends = await db.all(sql, params);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching transaction trends:', error);
    res.status(500).json({ error: 'Failed to fetch transaction trends' });
  }
});

module.exports = router;