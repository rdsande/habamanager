const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');
const AuditLogger = require('../utils/auditLogger');

const router = express.Router();

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await db.all('SELECT * FROM accounts ORDER BY created_at DESC');
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID
router.get('/:id', async (req, res) => {
  try {
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Create new account
router.post('/', async (req, res) => {
  try {
    const { name, type, bank_name, initial_balance, notes } = req.body;
    
    if (!name || !type || !bank_name || initial_balance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const balance = parseFloat(initial_balance) || 0;
    
    await db.run(
      `INSERT INTO accounts (id, name, type, bank_name, balance, initial_balance, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, bank_name, balance, balance, notes || '']
    );

    // Create initial deposit transaction if balance > 0
    if (balance > 0) {
      const transactionId = uuidv4();
      await db.run(
        `INSERT INTO transactions (id, account_id, type, amount, description, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, id, 'deposit', balance, 'Initial deposit', new Date().toISOString()]
      );
    }

    const newAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
    
    // Log the CREATE operation
    await AuditLogger.logCreate('accounts', id, newAccount);
    
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, bank_name, notes } = req.body;
    const accountId = req.params.id;

    const existingAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await db.run(
      `UPDATE accounts SET name = ?, type = ?, bank_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name || existingAccount.name, type || existingAccount.type, 
       bank_name || existingAccount.bank_name, notes || existingAccount.notes, accountId]
    );

    const updatedAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, bank_name, notes } = req.body;
    const accountId = req.params.id;

    const existingAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await db.run(
      `UPDATE accounts SET name = ?, type = ?, bank_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        name || existingAccount.name,
        type || existingAccount.type,
        bank_name || existingAccount.bank_name,
        notes !== undefined ? notes : existingAccount.notes,
        accountId
      ]
    );

    const updatedAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});



// Make deposit
router.post('/:id/deposit', async (req, res) => {
  try {
    const { amount, source, date, notes } = req.body;
    const accountId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const depositAmount = parseFloat(amount);
    const transactionId = uuidv4();
    const transactionDate = date || new Date().toISOString();

    await db.transaction([
      () => db.run(
        'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [depositAmount, accountId]
      ),
      () => db.run(
        `INSERT INTO transactions (id, account_id, type, amount, description, date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, accountId, 'deposit', depositAmount, source || 'Deposit', transactionDate, notes || '']
      )
    ]);

    const updatedAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error making deposit:', error);
    res.status(500).json({ error: 'Failed to make deposit' });
  }
});

// Make withdrawal
router.post('/:id/withdraw', async (req, res) => {
  try {
    const { amount, purpose, date, notes } = req.body;
    const accountId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const withdrawalAmount = parseFloat(amount);
    if (account.balance < withdrawalAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const transactionId = uuidv4();
    const transactionDate = date || new Date().toISOString();

    await db.transaction([
      () => db.run(
        'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [withdrawalAmount, accountId]
      ),
      () => db.run(
        `INSERT INTO transactions (id, account_id, type, amount, description, date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, accountId, 'withdrawal', withdrawalAmount, purpose || 'Withdrawal', transactionDate, notes || '']
      )
    ]);

    const updatedAccount = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error making withdrawal:', error);
    res.status(500).json({ error: 'Failed to make withdrawal' });
  }
});

// Get account balance
router.get('/:id/balance', async (req, res) => {
  try {
    const account = await db.get('SELECT id, name, balance FROM accounts WHERE id = ?', [req.params.id]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(account);
  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ error: 'Failed to fetch account balance' });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    
    // Get account details before deletion for audit log
    const account = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if account is referenced by investments, expenses, or transactions
    const investmentCount = await db.get('SELECT COUNT(*) as count FROM investments WHERE account_id = ?', [accountId]);
    const expenseCount = await db.get('SELECT COUNT(*) as count FROM expenses WHERE account_id = ?', [accountId]);
    const transactionCount = await db.get('SELECT COUNT(*) as count FROM transactions WHERE account_id = ?', [accountId]);
    const revenueCount = await db.get('SELECT COUNT(*) as count FROM daily_revenues WHERE account_id = ?', [accountId]);
    
    if (investmentCount.count > 0 || expenseCount.count > 0 || transactionCount.count > 0 || revenueCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete account that has associated investments, expenses, transactions, or revenues. Please remove or reassign them first.' 
      });
    }

    // Delete the account
    const result = await db.run('DELETE FROM accounts WHERE id = ?', [accountId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Log the deletion
    await AuditLogger.logDelete('accounts', accountId, account);
    
    res.json({ message: 'Account deleted successfully', id: accountId });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;