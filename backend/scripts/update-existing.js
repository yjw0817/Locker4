const pool = require('../config/database');

async function updateExistingLockers() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('🔧 Updating existing lockers...\n');
    
    // Update NULL COMP_CD and BCOFF_CD values
    const [result] = await connection.query(`
      UPDATE lockrs 
      SET COMP_CD = '001', BCOFF_CD = '001' 
      WHERE COMP_CD IS NULL OR BCOFF_CD IS NULL
    `);
    
    console.log(`✅ Updated ${result.affectedRows} lockers with COMP_CD='001' and BCOFF_CD='001'`);
    
    // Show updated status
    const [lockers] = await connection.query(`
      SELECT COMP_CD, BCOFF_CD, COUNT(*) as count 
      FROM lockrs 
      GROUP BY COMP_CD, BCOFF_CD
    `);
    
    console.log('\n📦 Updated locker distribution:');
    lockers.forEach(row => {
      console.log(`   COMP_CD: ${row.COMP_CD}, BCOFF_CD: ${row.BCOFF_CD} => ${row.count} lockers`);
    });
    
    console.log('\n✅ Update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

updateExistingLockers();