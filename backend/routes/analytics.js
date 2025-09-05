const express = require('express');
const db = require('../database/database');

const router = express.Router();

// Get dashboard overview data
router.get('/dashboard', async (req, res) => {
  try {
    const { business } = req.query;
    
    // Get total portfolio value
    let portfolioSql = 'SELECT SUM(initial_investment + total_returns) as total_portfolio FROM investments WHERE 1=1';
    let portfolioParams = [];
    
    if (business && business !== 'all') {
      portfolioSql += ' AND business_name = ?';
      portfolioParams.push(business);
    }
    
    const portfolioResult = await db.get(portfolioSql, portfolioParams);
    const totalPortfolio = portfolioResult.total_portfolio || 0;

    // Get active investments count
    let activeInvestmentsSql = 'SELECT COUNT(*) as active_investments FROM investments WHERE status = "active"';
    let activeInvestmentsParams = [];
    
    if (business && business !== 'all') {
      activeInvestmentsSql += ' AND business_name = ?';
      activeInvestmentsParams.push(business);
    }
    
    const activeInvestmentsResult = await db.get(activeInvestmentsSql, activeInvestmentsParams);
    const activeInvestments = activeInvestmentsResult.active_investments || 0;

    // Get current month expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let monthlyExpensesSql = 'SELECT SUM(amount) as monthly_expenses FROM expenses WHERE month = ? AND year = ?';
    let monthlyExpensesParams = [currentMonth, currentYear];
    
    if (business && business !== 'all') {
      monthlyExpensesSql += ' AND related_business = ?';
      monthlyExpensesParams.push(business);
    }
    
    const monthlyExpensesResult = await db.get(monthlyExpensesSql, monthlyExpensesParams);
    const monthlyExpenses = monthlyExpensesResult.monthly_expenses || 0;

    // Get current month ROI
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    
    let monthlyROISql = 'SELECT SUM(amount) as monthly_revenue FROM daily_revenues WHERE date >= ? AND date <= ?';
    let monthlyROIParams = [startOfMonth, endOfMonth];
    
    if (business && business !== 'all') {
      monthlyROISql += ' AND investment_id IN (SELECT id FROM investments WHERE business_name = ?)';
      monthlyROIParams.push(business);
    }
    
    const monthlyROIResult = await db.get(monthlyROISql, monthlyROIParams);
    const monthlyRevenue = monthlyROIResult.monthly_revenue || 0;

    // Get total revenue
    let totalRevenueSql = 'SELECT SUM(amount) as total_revenue FROM daily_revenues WHERE 1=1';
    let totalRevenueParams = [];
    
    if (business && business !== 'all') {
      totalRevenueSql += ' AND investment_id IN (SELECT id FROM investments WHERE business_name = ?)';
      totalRevenueParams.push(business);
    }
    
    const totalRevenueResult = await db.get(totalRevenueSql, totalRevenueParams);
    const totalRevenue = totalRevenueResult.total_revenue || 0;

    // Get total account balances
    const accountBalancesResult = await db.get('SELECT SUM(balance) as total_balance FROM accounts');
    const totalAccountBalance = accountBalancesResult.total_balance || 0;

    res.json({
      totalPortfolio,
      activeInvestments,
      monthlyExpenses,
      monthlyROI: monthlyRevenue,
      totalRevenue,
      totalAccountBalance,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get revenue trends
router.get('/revenue-trends', async (req, res) => {
  try {
    const { period = 'monthly', year, business } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    let sql, params;
    
    if (period === 'daily') {
      // Last 30 days
      sql = `
        SELECT DATE(date) as period, SUM(amount) as revenue
        FROM daily_revenues 
        WHERE date >= DATE('now', '-30 days')
      `;
      params = [];
      
      if (business && business !== 'all') {
        sql += ' AND investment_id IN (SELECT id FROM investments WHERE business_name = ?)';
        params.push(business);
      }
      
      sql += ' GROUP BY DATE(date) ORDER BY date';
    } else {
      // Monthly for the year
      sql = `
        SELECT strftime('%m', date) as period, SUM(amount) as revenue
        FROM daily_revenues 
        WHERE strftime('%Y', date) = ?
      `;
      params = [targetYear.toString()];
      
      if (business && business !== 'all') {
        sql += ' AND investment_id IN (SELECT id FROM investments WHERE business_name = ?)';
        params.push(business);
      }
      
      sql += ' GROUP BY strftime(\'%m\', date) ORDER BY period';
    }

    const trends = await db.all(sql, params);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trends' });
  }
});

// Get expense trends
router.get('/expense-trends', async (req, res) => {
  try {
    const { period = 'monthly', year, business, category } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    let sql, params;
    
    if (period === 'daily') {
      // Last 30 days
      sql = `
        SELECT date as period, SUM(amount) as expenses
        FROM expenses 
        WHERE date >= DATE('now', '-30 days')
      `;
      params = [];
    } else {
      // Monthly for the year
      sql = `
        SELECT month as period, SUM(amount) as expenses
        FROM expenses 
        WHERE year = ?
      `;
      params = [targetYear];
    }
    
    if (business && business !== 'all') {
      sql += ' AND related_business = ?';
      params.push(business);
    }
    
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    sql += period === 'daily' ? ' GROUP BY date ORDER BY date' : ' GROUP BY month ORDER BY month';

    const trends = await db.all(sql, params);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching expense trends:', error);
    res.status(500).json({ error: 'Failed to fetch expense trends' });
  }
});

// Get investment performance summary
router.get('/investment-performance', async (req, res) => {
  try {
    const { business } = req.query;
    
    let sql = `
      SELECT 
        i.id,
        i.business_name,
        i.investment_name,
        i.initial_investment,
        i.total_returns,
        i.status,
        i.start_date,
        COALESCE(dr.daily_count, 0) as revenue_days,
        COALESCE(dr.avg_daily, 0) as avg_daily_revenue,
        COALESCE(dr.last_revenue_date, '') as last_revenue_date,
        CASE 
          WHEN i.total_returns > 0 THEN 
            ROUND(((i.total_returns / i.initial_investment) * 100), 2)
          ELSE 0 
        END as roi_percentage,
        CASE 
          WHEN COALESCE(dr.avg_daily, 0) > 0 THEN 
            ROUND((i.initial_investment / dr.avg_daily), 0)
          ELSE 0 
        END as break_even_days
      FROM investments i
      LEFT JOIN (
        SELECT 
          investment_id,
          COUNT(*) as daily_count,
          AVG(amount) as avg_daily,
          MAX(date) as last_revenue_date
        FROM daily_revenues 
        GROUP BY investment_id
      ) dr ON i.id = dr.investment_id
      WHERE 1=1
    `;
    let params = [];
    
    if (business && business !== 'all') {
      sql += ' AND i.business_name = ?';
      params.push(business);
    }
    
    sql += ' ORDER BY i.created_at DESC';

    const performance = await db.all(sql, params);
    res.json(performance);
  } catch (error) {
    console.error('Error fetching investment performance:', error);
    res.status(500).json({ error: 'Failed to fetch investment performance' });
  }
});

// Get account balances over time
router.get('/balance-trends', async (req, res) => {
  try {
    const { account_id, days = 30 } = req.query;
    
    let sql = `
      SELECT 
        DATE(t.date) as date,
        t.account_id,
        a.name as account_name,
        SUM(CASE 
          WHEN t.type IN ('deposit', 'revenue') THEN t.amount 
          WHEN t.type IN ('withdrawal', 'expense', 'investment') THEN -t.amount 
          ELSE 0 
        END) as daily_change
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE DATE(t.date) >= DATE('now', '-' || ? || ' days')
    `;
    let params = [parseInt(days)];
    
    if (account_id) {
      sql += ' AND t.account_id = ?';
      params.push(account_id);
    }
    
    sql += ' GROUP BY DATE(t.date), t.account_id ORDER BY date, account_name';

    const trends = await db.all(sql, params);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching balance trends:', error);
    res.status(500).json({ error: 'Failed to fetch balance trends' });
  }
});

// Get profit/loss summary
router.get('/profit-loss', async (req, res) => {
  try {
    const { start_date, end_date, business } = req.query;
    
    // Get revenue for the period
    let revenueSql = 'SELECT SUM(amount) as total_revenue FROM daily_revenues WHERE 1=1';
    let revenueParams = [];
    
    if (start_date) {
      revenueSql += ' AND date >= ?';
      revenueParams.push(start_date);
    }
    if (end_date) {
      revenueSql += ' AND date <= ?';
      revenueParams.push(end_date);
    }
    if (business && business !== 'all') {
      revenueSql += ' AND investment_id IN (SELECT id FROM investments WHERE business_name = ?)';
      revenueParams.push(business);
    }
    
    const revenueResult = await db.get(revenueSql, revenueParams);
    const totalRevenue = revenueResult.total_revenue || 0;

    // Get expenses for the period
    let expensesSql = 'SELECT SUM(amount) as total_expenses FROM expenses WHERE 1=1';
    let expensesParams = [];
    
    if (start_date) {
      expensesSql += ' AND date >= ?';
      expensesParams.push(start_date);
    }
    if (end_date) {
      expensesSql += ' AND date <= ?';
      expensesParams.push(end_date);
    }
    if (business && business !== 'all') {
      expensesSql += ' AND related_business = ?';
      expensesParams.push(business);
    }
    
    const expensesResult = await db.get(expensesSql, expensesParams);
    const totalExpenses = expensesResult.total_expenses || 0;

    // Calculate profit/loss
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: parseFloat((profitMargin * 100).toFixed(2)),
      period: {
        start_date: start_date || 'All time',
        end_date: end_date || 'All time'
      }
    });
  } catch (error) {
    console.error('Error fetching profit/loss data:', error);
    res.status(500).json({ error: 'Failed to fetch profit/loss data' });
  }
});

// Get business comparison
router.get('/business-comparison', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get revenue by business
    let revenueSql = `
      SELECT 
        i.business_name,
        SUM(dr.amount) as total_revenue,
        COUNT(DISTINCT i.id) as investment_count,
        AVG(dr.amount) as avg_daily_revenue
      FROM investments i
      LEFT JOIN daily_revenues dr ON i.id = dr.investment_id
      WHERE 1=1
    `;
    let revenueParams = [];
    
    if (start_date) {
      revenueSql += ' AND dr.date >= ?';
      revenueParams.push(start_date);
    }
    if (end_date) {
      revenueSql += ' AND dr.date <= ?';
      revenueParams.push(end_date);
    }
    
    revenueSql += ' GROUP BY i.business_name ORDER BY total_revenue DESC';
    
    const revenueByBusiness = await db.all(revenueSql, revenueParams);

    // Get expenses by business
    let expensesSql = `
      SELECT 
        related_business as business_name,
        SUM(amount) as total_expenses,
        COUNT(*) as expense_count,
        AVG(amount) as avg_expense
      FROM expenses
      WHERE related_business != ''
    `;
    let expensesParams = [];
    
    if (start_date) {
      expensesSql += ' AND date >= ?';
      expensesParams.push(start_date);
    }
    if (end_date) {
      expensesSql += ' AND date <= ?';
      expensesParams.push(end_date);
    }
    
    expensesSql += ' GROUP BY related_business ORDER BY total_expenses DESC';
    
    const expensesByBusiness = await db.all(expensesSql, expensesParams);

    // Combine revenue and expense data
    const businessMap = new Map();
    
    revenueByBusiness.forEach(item => {
      businessMap.set(item.business_name, {
        business_name: item.business_name,
        total_revenue: item.total_revenue || 0,
        investment_count: item.investment_count || 0,
        avg_daily_revenue: item.avg_daily_revenue || 0,
        total_expenses: 0,
        expense_count: 0,
        avg_expense: 0,
        net_profit: item.total_revenue || 0
      });
    });
    
    expensesByBusiness.forEach(item => {
      if (businessMap.has(item.business_name)) {
        const business = businessMap.get(item.business_name);
        business.total_expenses = item.total_expenses || 0;
        business.expense_count = item.expense_count || 0;
        business.avg_expense = item.avg_expense || 0;
        business.net_profit = business.total_revenue - business.total_expenses;
      } else {
        businessMap.set(item.business_name, {
          business_name: item.business_name,
          total_revenue: 0,
          investment_count: 0,
          avg_daily_revenue: 0,
          total_expenses: item.total_expenses || 0,
          expense_count: item.expense_count || 0,
          avg_expense: item.avg_expense || 0,
          net_profit: -(item.total_expenses || 0)
        });
      }
    });

    const comparison = Array.from(businessMap.values())
      .sort((a, b) => b.net_profit - a.net_profit);

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching business comparison:', error);
    res.status(500).json({ error: 'Failed to fetch business comparison' });
  }
});

module.exports = router;