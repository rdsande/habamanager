const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');

class AuditLogger {
  /**
   * Log an audit entry
   * @param {string} tableName - The table being modified
   * @param {string} recordId - The ID of the record being modified
   * @param {string} action - The action performed (CREATE, UPDATE, DELETE)
   * @param {Object} oldValues - The old values (for UPDATE and DELETE)
   * @param {Object} newValues - The new values (for CREATE and UPDATE)
   * @param {string} userInfo - Information about the user (optional)
   */
  static async log(tableName, recordId, action, oldValues = null, newValues = null, userInfo = 'system') {
    try {
      const id = uuidv4();
      
      await db.run(
        `INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, user_info) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          tableName,
          recordId,
          action,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          userInfo
        ]
      );
      
      console.log(`✅ Audit log created: ${action} on ${tableName} (${recordId})`);
    } catch (error) {
      console.error('❌ Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log a CREATE operation
   */
  static async logCreate(tableName, recordId, newValues, userInfo = 'system') {
    return this.log(tableName, recordId, 'CREATE', null, newValues, userInfo);
  }

  /**
   * Log an UPDATE operation
   */
  static async logUpdate(tableName, recordId, oldValues, newValues, userInfo = 'system') {
    return this.log(tableName, recordId, 'UPDATE', oldValues, newValues, userInfo);
  }

  /**
   * Log a DELETE operation
   */
  static async logDelete(tableName, recordId, oldValues, userInfo = 'system') {
    return this.log(tableName, recordId, 'DELETE', oldValues, null, userInfo);
  }
}

module.exports = AuditLogger;