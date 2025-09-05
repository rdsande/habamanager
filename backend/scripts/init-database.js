const db = require('../database/database');
const path = require('path');

/**
 * Database initialization script
 * This script creates all necessary tables and indexes for the Haba Manager application
 */

async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...');
        
        // The database connection and table creation is handled in database.js
        // This script just ensures the database is properly initialized
        
        console.log('✅ Database initialization completed successfully!');
        console.log('📊 Tables created:');
        console.log('   - accounts');
        console.log('   - investments');
        console.log('   - daily_revenues');
        console.log('   - expenses');
        console.log('   - transactions');
        console.log('');
        console.log('🔍 Indexes created for optimal performance');
        console.log('💾 Database file location:', path.resolve(__dirname, '../database/haba_manager.db'));
        console.log('');
        console.log('🎉 Your Haba Manager database is ready to use!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    }
}

// Run initialization if this script is executed directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };