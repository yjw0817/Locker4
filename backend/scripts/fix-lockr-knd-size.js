const pool = require('../config/database');

async function fixLockerKndSize() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('🔧 Fixing LOCKR_KND column size...\n');
    
    // Check if lockrs table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'lockrs'"
    );
    
    if (tables.length > 0) {
      console.log('📝 Updating LOCKR_KND column size from VARCHAR(8) to VARCHAR(36)...');
      
      // Alter the column
      await connection.query(`
        ALTER TABLE lockrs 
        MODIFY COLUMN LOCKR_KND VARCHAR(36)
      `);
      
      console.log('✅ LOCKR_KND column size updated successfully');
      
      // Show current column definition
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM lockrs WHERE Field = 'LOCKR_KND'
      `);
      
      if (columns.length > 0) {
        console.log('\n📊 Current LOCKR_KND column definition:');
        console.log('   Type:', columns[0].Type);
        console.log('   Null:', columns[0].Null);
        console.log('   Default:', columns[0].Default);
      }
    } else {
      console.log('⚠️  lockrs table does not exist. Run init-db.js first.');
    }
    
    console.log('\n✅ Database fix complete!');
    
  } catch (error) {
    console.error('\n❌ Database fix failed:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

// Run fix
fixLockerKndSize().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});