const pool = require('../config/database');

async function checkDatabase() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('\n📊 Database Status Check\n');
    console.log('=====================================');
    
    // Check lockrs table
    const [lockers] = await connection.query(`
      SELECT COMP_CD, BCOFF_CD, COUNT(*) as count 
      FROM lockrs 
      GROUP BY COMP_CD, BCOFF_CD
    `);
    
    console.log('\n📦 Lockers by Company/Branch:');
    if (lockers.length > 0) {
      lockers.forEach(row => {
        console.log(`   COMP_CD: ${row.COMP_CD || 'NULL'}, BCOFF_CD: ${row.BCOFF_CD || 'NULL'} => ${row.count} lockers`);
      });
    } else {
      console.log('   No lockers found');
    }
    
    // Check total
    const [total] = await connection.query('SELECT COUNT(*) as total FROM lockrs');
    console.log(`\n   Total lockers: ${total[0].total}`);
    
    // Show sample lockers
    const [samples] = await connection.query('SELECT * FROM lockrs LIMIT 5');
    if (samples.length > 0) {
      console.log('\n📋 Sample Lockers:');
      samples.forEach(locker => {
        console.log(`   ID: ${locker.LOCKR_CD}, Label: ${locker.LOCKR_LABEL}, COMP: ${locker.COMP_CD}, BCOFF: ${locker.BCOFF_CD}`);
      });
    }
    
    console.log('\n=====================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

checkDatabase();