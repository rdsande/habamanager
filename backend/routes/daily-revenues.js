const express = require('express');
const db = require('../database/database');

const router = express.Router();

// Update daily revenue
router.put('/:id', async (req, res) => {
  try {
    const { amount, date, notes } = req.body;
    const revenueId = req.params.id;

    const existingRevenue = await db.get('SELECT * FROM daily_revenues WHERE id = ?', [revenueId]);
    if (!existingRevenue) {
      return res.status(404).json({ error: 'Daily revenue not found' });
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : existingRevenue.amount;
    const amountDifference = newAmount - existingRevenue.amount;

    const operations = [
      () => db.run(
        `UPDATE daily_revenues SET amount = ?, date = ?, notes = ? WHERE id = ?`,
        [
          newAmount,
          date || existingRevenue.date,
          notes !== undefined ? notes : existingRevenue.notes,
          revenueId
        ]
      ),
      () => db.run(
        'UPDATE investments SET total_returns = total_returns + ? WHERE id = ?',
        [amountDifference, existingRevenue.investment_id]
      )
    ];

    // Update account balance if revenue is linked to account
    if (existingRevenue.account_id && amountDifference !== 0) {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance + ? WHERE id = ?',
          [amountDifference, existingRevenue.account_id]
        ),
        () => db.run(
          'UPDATE transactions SET amount = ? WHERE related_id = ? AND type = "revenue"',
          [newAmount, existingRevenue.investment_id]
        )
      );
    }

    await db.transaction(operations);

    const updatedRevenue = await db.get('SELECT * FROM daily_revenues WHERE id = ?', [revenueId]);
    res.json(updatedRevenue);
  } catch (error) {
    console.error('Error updating daily revenue:', error);
    res.status(500).json({ error: 'Failed to update daily revenue' });
  }
});

// Delete daily revenue
router.delete('/:id', async (req, res) => {
  try {
    const revenueId = req.params.id;

    const existingRevenue = await db.get('SELECT * FROM daily_revenues WHERE id = ?', [revenueId]);
    if (!existingRevenue) {
      return res.status(404).json({ error: 'Daily revenue not found' });
    }

    const operations = [
      () => db.run('DELETE FROM daily_revenues WHERE id = ?', [revenueId]),
      () => db.run(
        'UPDATE investments SET total_returns = total_returns - ? WHERE id = ?',
        [existingRevenue.amount, existingRevenue.investment_id]
      )
    ];

    // Update account balance if revenue was linked to account
    if (existingRevenue.account_id) {
      operations.push(
        () => db.run(
          'UPDATE accounts SET balance = balance - ? WHERE id = ?',
          [existingRevenue.amount, existingRevenue.account_id]
        ),
        () => db.run(
          'DELETE FROM transactions WHERE related_id = ? AND type = "revenue"',
          [existingRevenue.investment_id]
        )
      );
    }

    await db.transaction(operations);

    res.json({ message: 'Daily revenue deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily revenue:', error);
    res.status(500).json({ error: 'Failed to delete daily revenue' });
  }
});

module.exports = router;