const express = require('express');
const db = require('../database/database');

const router = express.Router();

// Get all audit logs with optional filtering
router.get('/', async (req, res) => {
  try {
    const { table_name, action, limit = 100, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    let params = [];

    // Filter by table name
    if (table_name && table_name !== 'all') {
      sql += ' AND table_name = ?';
      params.push(table_name);
    }

    // Filter by action
    if (action && action !== 'all') {
      sql += ' AND action = ?';
      params.push(action);
    }

    // Add ordering and pagination
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await db.all(sql, params);
    
    // Parse JSON strings back to objects for easier frontend consumption
    const parsedLogs = logs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }));

    // Get total count for pagination
    const countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1' + 
      (table_name && table_name !== 'all' ? ' AND table_name = ?' : '') +
      (action && action !== 'all' ? ' AND action = ?' : '');
    
    const countParams = [];
    if (table_name && table_name !== 'all') countParams.push(table_name);
    if (action && action !== 'all') countParams.push(action);
    
    const countResult = await db.get(countSql, countParams);
    const totalCount = countResult.total;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      logs: parsedLogs,
      totalCount,
      totalPages,
      currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.all(`
      SELECT 
        table_name,
        action,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM audit_logs 
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY table_name, action, DATE(timestamp)
      ORDER BY timestamp DESC
    `);

    const summary = await db.all(`
      SELECT 
        table_name,
        action,
        COUNT(*) as total_count
      FROM audit_logs 
      GROUP BY table_name, action
      ORDER BY total_count DESC
    `);

    res.json({ daily_stats: stats, summary });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit log statistics' });
  }
});

// Get audit logs for a specific record
router.get('/record/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    
    const logs = await db.all(
      'SELECT * FROM audit_logs WHERE table_name = ? AND record_id = ? ORDER BY timestamp DESC',
      [table, id]
    );
    
    // Parse JSON strings back to objects
    const parsedLogs = logs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }));

    res.json(parsedLogs);
  } catch (error) {
    console.error('Error fetching record audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch record audit logs' });
  }
});

module.exports = router;