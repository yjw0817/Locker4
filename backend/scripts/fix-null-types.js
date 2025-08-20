const pool = require('../config/database');

async function fixNullTypes() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔧 Fixing NULL LOCKR_TYPE_CD values...\n');
    
    // Update NULL LOCKR_TYPE_CD to default '1' (small)
    const [result] = await connection.query(`
      UPDATE lockrs 
      SET LOCKR_TYPE_CD = '1' 
      WHERE LOCKR_TYPE_CD IS NULL
    `);
    
    console.log(`✅ Updated ${result.affectedRows} lockers with default type '1'`);
    
    // Show updated status
    const [lockers] = await connection.query(`
      SELECT LOCKR_CD, LOCKR_LABEL, LOCKR_TYPE_CD 
      FROM lockrs 
      ORDER BY LOCKR_CD
    `);
    
    console.log('\n📦 Updated locker types:');
    lockers.forEach(row => {
      console.log(`   ID: ${row.LOCKR_CD}, Label: ${row.LOCKR_LABEL}, Type: ${row.LOCKR_TYPE_CD}`);
    });
    
    console.log('\n✅ Fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

fixNullTypes();