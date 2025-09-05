const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');
const AuditLogger = require('../utils/auditLogger');

const router = express.Router();

// Get all investments with their daily revenues
router.get('/', async (req, res) => {
  try {
    const investments = await db.all(`
      SELECT i.*, 
             COALESCE(SUM(dr.amount), 0) as calculated_total_returns,
             COUNT(dr.id) as revenue_count
      FROM investments i
      LEFT JOIN daily_revenues dr ON i.id = dr.investment_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    // Get daily revenues for each investment
    for (let investment of investments) {
      const dailyRevenues = await db.all(
        'SELECT * FROM daily_revenues WHERE investment_id = ? ORDER BY date DESC',
        [investment.id]
      );
      investment.dailyRevenues = dailyRevenues;
      investment.total_returns = investment.calculated_total_returns;
    }

    res.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get investment by ID
router.get('/:id', async (req, res) => {
  try {
    const investment = await db.get('SELECT * FROM investments WHERE id = ?', [req.params.id]);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Get daily revenues
    const dailyRevenues = await db.all(
      'SELECT * FROM daily_revenues WHERE investment_id = ? ORDER BY date DESC',
      [investment.id]
    );
    investment.dailyRevenues = dailyRevenues;

    // Calculate total returns
    const totalReturns = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM daily_revenues WHERE investment_id = ?',
      [investment.id]
    );
    investment.total_returns = totalReturns.total;

    res.json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

// Create new investment
router.post('/', async (req, res) => {
  try {
    const { name, type, amount, expected_daily_revenue, date, notes, account_id } = req.body;
    
    if (!name || !type || !amount || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const investmentAmount = parseFloat(amount);
    if (investmentAmount <= 0) {
      return res.status(400).json({ error: 'Investment amount must be positive' });
    }

    // Check if account exists and has sufficient funds
    if (account_id) {
      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [account_id]);
      if (!account) {
        return res.status(400).json({ error: 'Selected account not found' });
      }
      if (account.balance < investmentAmount) {
        return res.status(400).json({ error: 'Insufficient funds in selected account' });
      }
    }

    const id = uuidv4();
    const transactionId = uuidv4();

    const operations = [
      () => db.run(
        `INSERT INTO investments (id, name, type, amount, expected_daily_revenue, date, notes, account_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, type, investmentAmount, expected_daily_revenue || 0, date, notes || '', account_id]
      )
    ];

    // Deduct from account if specified
    if (account_id) {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [investmentAmount, account_id]
        ),
        () => db.run(
          `INSERT INTO transactions (id, account_id, type, amount, description, date, related_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [transactionId, account_id, 'investment', investmentAmount, `Investment in ${name}`, new Date().toISOString(), id]
        )
      );
    }

    await db.transaction(operations);

    const newInvestment = await db.get('SELECT * FROM investments WHERE id = ?', [id]);
    newInvestment.dailyRevenues = [];
    newInvestment.total_returns = 0;

    // Log the CREATE operation
    await AuditLogger.logCreate('investments', id, newInvestment);

    res.status(201).json(newInvestment);
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// Update investment
router.put('/:id', async (req, res) => {
  try {
    const { name, type, amount, date, account_id, expected_daily_revenue, notes } = req.body;
    const investmentId = req.params.id;

    const existingInvestment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    if (!existingInvestment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const operations = [];

    // Handle account balance changes if amount or account changed
    const newAmount = amount !== undefined ? parseFloat(amount) : existingInvestment.amount;
    const newAccountId = account_id !== undefined ? account_id : existingInvestment.account_id;
    const oldAmount = existingInvestment.amount;
    const oldAccountId = existingInvestment.account_id;

    // If account changed, restore balance to old account and deduct from new account
    if (oldAccountId && newAccountId && oldAccountId !== newAccountId) {
      operations.push(
        () => db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldAmount, oldAccountId]),
        () => db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [newAmount, newAccountId])
      );
    }
    // If same account but amount changed, adjust the difference
    else if (oldAccountId && newAccountId && oldAccountId === newAccountId && oldAmount !== newAmount) {
      const difference = newAmount - oldAmount;
      operations.push(
        () => db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [difference, newAccountId])
      );
    }
    // If account was added (previously no account)
    else if (!oldAccountId && newAccountId) {
      operations.push(
        () => db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [newAmount, newAccountId])
      );
    }
    // If account was removed (previously had account)
    else if (oldAccountId && !newAccountId) {
      operations.push(
        () => db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [oldAmount, oldAccountId])
      );
    }

    // Update the investment record
    operations.push(
      () => db.run(
        `UPDATE investments SET name = ?, type = ?, amount = ?, date = ?, account_id = ?, expected_daily_revenue = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          name || existingInvestment.name,
          type || existingInvestment.type,
          newAmount,
          date || existingInvestment.date,
          newAccountId,
          expected_daily_revenue !== undefined ? expected_daily_revenue : existingInvestment.expected_daily_revenue,
          notes !== undefined ? notes : existingInvestment.notes,
          investmentId
        ]
      )
    );

    // Execute all operations in a transaction
    await db.transaction(operations);

    const updatedInvestment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    
    // Get daily revenues and total returns
    const dailyRevenues = await db.all(
      'SELECT * FROM daily_revenues WHERE investment_id = ? ORDER BY date DESC',
      [investmentId]
    );
    const totalReturns = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM daily_revenues WHERE investment_id = ?',
      [investmentId]
    );
    
    updatedInvestment.dailyRevenues = dailyRevenues;
    updatedInvestment.total_returns = totalReturns.total;

    res.json(updatedInvestment);
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});



// Add daily revenue to investment
router.post('/:id/revenue', async (req, res) => {
  try {
    const { amount, date, account_id, notes } = req.body;
    const investmentId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid revenue amount' });
    }

    const investment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const revenueAmount = parseFloat(amount);
    const revenueDate = date || new Date().toISOString().split('T')[0];
    const revenueId = uuidv4();
    const transactionId = uuidv4();

    const operations = [
      () => db.run(
        `INSERT INTO daily_revenues (id, investment_id, amount, date, account_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [revenueId, investmentId, revenueAmount, revenueDate, account_id, notes || '']
      ),
      () => db.run(
        'UPDATE investments SET total_returns = total_returns + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [revenueAmount, investmentId]
      )
    ];

    // Add to account if specified
    if (account_id) {
      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [account_id]);
      if (account) {
        operations.push(
          () => db.run(
            'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [revenueAmount, account_id]
          ),
          () => db.run(
            `INSERT INTO transactions (id, account_id, type, amount, description, date, related_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [transactionId, account_id, 'revenue', revenueAmount, `Revenue from ${investment.name}`, new Date().toISOString(), investmentId]
          )
        );
      }
    }

    await db.transaction(operations);

    // Return updated investment with revenues
    const updatedInvestment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    const dailyRevenues = await db.all(
      'SELECT * FROM daily_revenues WHERE investment_id = ? ORDER BY date DESC',
      [investmentId]
    );
    const totalReturns = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM daily_revenues WHERE investment_id = ?',
      [investmentId]
    );
    
    updatedInvestment.dailyRevenues = dailyRevenues;
    updatedInvestment.total_returns = totalReturns.total;

    res.json(updatedInvestment);
  } catch (error) {
    console.error('Error adding revenue:', error);
    res.status(500).json({ error: 'Failed to add revenue' });
  }
});

// Get investment performance metrics
router.get('/:id/performance', async (req, res) => {
  try {
    const investmentId = req.params.id;
    
    const investment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const totalReturns = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM daily_revenues WHERE investment_id = ?',
      [investmentId]
    );

    const revenueCount = await db.get(
      'SELECT COUNT(*) as count FROM daily_revenues WHERE investment_id = ?',
      [investmentId]
    );

    const startDate = new Date(investment.date);
    const currentDate = new Date();
    const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const roi = investment.amount > 0 ? ((totalReturns.total / investment.amount) * 100) : 0;
    const dailyAverage = revenueCount.count > 0 ? totalReturns.total / revenueCount.count : 0;
    const profit = totalReturns.total - investment.amount;
    const breakEvenProgress = investment.amount > 0 ? (totalReturns.total / investment.amount) * 100 : 0;

    res.json({
      investment_id: investmentId,
      name: investment.name,
      total_invested: investment.amount,
      total_returns: totalReturns.total,
      profit,
      roi: parseFloat(roi.toFixed(1)),
      daily_average: parseFloat(dailyAverage.toFixed(2)),
      days_since_start: daysSinceStart,
      revenue_entries: revenueCount.count,
      break_even_progress: parseFloat(breakEvenProgress.toFixed(1)),
      is_break_even: totalReturns.total >= investment.amount
    });
  } catch (error) {
    console.error('Error fetching investment performance:', error);
    res.status(500).json({ error: 'Failed to fetch investment performance' });
  }
});

// Delete investment
router.delete('/:id', async (req, res) => {
  try {
    const investmentId = req.params.id;
    
    // Get investment details before deletion for audit log
    const investment = await db.get('SELECT * FROM investments WHERE id = ?', [investmentId]);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // If investment has an account, restore the balance
    if (investment.account_id && investment.amount) {
      await db.run(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [investment.amount, investment.account_id]
      );
    }

    // Delete the investment (daily_revenues will be deleted automatically due to CASCADE)
    const result = await db.run('DELETE FROM investments WHERE id = ?', [investmentId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Log the deletion
    await AuditLogger.logDelete('investments', investmentId, investment);
    
    res.json({ message: 'Investment deleted successfully', id: investmentId });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

module.exports = router;