const pool = require('../config/database');

async function initializeDatabase() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('🔧 Initializing database...\n');
    
    // Check if lockrs table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'lockrs'"
    );
    
    if (tables.length === 0) {
      console.log('📝 Creating lockrs table...');
      await connection.query(`
        CREATE TABLE lockrs (
          LOCKR_CD INT PRIMARY KEY AUTO_INCREMENT,
          COMP_CD VARCHAR(20) DEFAULT '001',
          BCOFF_CD VARCHAR(20) DEFAULT '001',
          LOCKR_KND VARCHAR(36),
          LOCKR_TYPE_CD VARCHAR(20),
          X INT,
          Y INT,
          LOCKR_LABEL VARCHAR(10),
          ROTATION INT DEFAULT 0,
          DOOR_DIRECTION VARCHAR(20),
          FRONT_VIEW_X INT,
          FRONT_VIEW_Y INT,
          GROUP_NUM INT,
          LOCKR_GENDR_SET VARCHAR(8),
          LOCKR_NO INT(14),
          PARENT_LOCKR_CD INT,
          TIER_LEVEL INT DEFAULT 0,
          BUY_EVENT_SNO VARCHAR(20),
          MEM_SNO VARCHAR(20),
          MEM_NM VARCHAR(20),
          LOCKR_USE_S_DATE VARCHAR(10),
          LOCKR_USE_E_DATE VARCHAR(10),
          LOCKR_STAT VARCHAR(2) DEFAULT '00',
          MEMO VARCHAR(500),
          UPDATE_BY VARCHAR(45),
          UPDATE_DT DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_parent_locker 
            FOREIGN KEY (PARENT_LOCKR_CD) 
            REFERENCES lockrs(LOCKR_CD) 
            ON DELETE RESTRICT,
            
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD),
          INDEX idx_parent (PARENT_LOCKR_CD),
          INDEX idx_lockr_stat (LOCKR_STAT),
          INDEX idx_lockr_label (LOCKR_LABEL),
          INDEX idx_lockr_no (LOCKR_NO)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ lockrs table created');
    } else {
      console.log('✓ lockrs table already exists');
    }
    
    // Create lockr_types table
    const [typeTables] = await connection.query(
      "SHOW TABLES LIKE 'lockr_types'"
    );
    
    if (typeTables.length === 0) {
      console.log('📝 Creating lockr_types table...');
      await connection.query(`
        CREATE TABLE lockr_types (
          LOCKR_TYPE_ID INT PRIMARY KEY AUTO_INCREMENT,
          LOCKR_TYPE_CD VARCHAR(20) NOT NULL,
          LOCKR_TYPE_NM VARCHAR(50),
          COMP_CD VARCHAR(20) DEFAULT '001',
          BCOFF_CD VARCHAR(20) DEFAULT '001',
          WIDTH INT DEFAULT 50,
          HEIGHT INT DEFAULT 60,
          DEPTH INT DEFAULT 50,
          COLOR VARCHAR(20),
          UPDATE_DT DATETIME DEFAULT CURRENT_TIMESTAMP,
          UPDATE_BY VARCHAR(45),
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD),
          UNIQUE KEY uk_type (COMP_CD, BCOFF_CD, LOCKR_TYPE_CD)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ lockr_types table created');
      
      // Insert default types
      await connection.query(`
        INSERT INTO lockr_types (LOCKR_TYPE_CD, LOCKR_TYPE_NM, WIDTH, HEIGHT, DEPTH, COLOR) VALUES
        ('1', '소형', 40, 40, 40, '#3b82f6'),
        ('2', '중형', 50, 60, 50, '#10b981'),
        ('3', '대형', 60, 80, 60, '#f59e0b')
      `);
      console.log('✅ Default locker types inserted');
    } else {
      console.log('✓ lockr_types table already exists');
    }
    
    // Create lockr_area table
    const [areaTables] = await connection.query(
      "SHOW TABLES LIKE 'lockr_area'"
    );
    
    if (areaTables.length === 0) {
      console.log('📝 Creating lockr_area table...');
      await connection.query(`
        CREATE TABLE lockr_area (
          LOCKR_KND_CD VARCHAR(36) NOT NULL,
          LOCKR_KND_NM VARCHAR(50),
          COMP_CD VARCHAR(20) NOT NULL DEFAULT '001',
          BCOFF_CD VARCHAR(20) NOT NULL DEFAULT '001',
          X INT NOT NULL DEFAULT 0,
          Y INT NOT NULL DEFAULT 0,
          WIDTH INT NOT NULL DEFAULT 800,
          HEIGHT INT NOT NULL DEFAULT 600,
          COLOR VARCHAR(7),
          FLOOR INT DEFAULT 1,
          CRE_DATETM DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (LOCKR_KND_CD, COMP_CD, BCOFF_CD),
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ lockr_area table created');
      
      // Insert default zones
      await connection.query(`
        INSERT INTO lockr_area (LOCKR_KND_CD, LOCKR_KND_NM, COLOR) VALUES
        ('zone-1', '남자 탈의실', '#f0f9ff'),
        ('zone-2', '여자 탈의실', '#fef3c7'),
        ('zone-3', '혼용 탈의실', '#fee2e2')
      `);
      console.log('✅ Default zones inserted');
    } else {
      console.log('✓ lockr_area table already exists');
    }
    
    // Check if we need to add sample lockers
    const [lockerCount] = await connection.query(
      'SELECT COUNT(*) as count FROM lockrs'
    );
    
    if (lockerCount[0].count === 0) {
      console.log('\n📝 Inserting sample lockers...');
      
      // Insert sample lockers for zone-1
      const sampleLockers = [
        { label: 'A-01', x: 100, y: 100, zone: 'zone-1', type: '1' },
        { label: 'A-02', x: 150, y: 100, zone: 'zone-1', type: '1' },
        { label: 'A-03', x: 200, y: 100, zone: 'zone-1', type: '1' },
        { label: 'B-01', x: 100, y: 150, zone: 'zone-1', type: '2' },
        { label: 'B-02', x: 160, y: 150, zone: 'zone-1', type: '2' },
      ];
      
      for (const locker of sampleLockers) {
        await connection.query(`
          INSERT INTO lockrs (COMP_CD, BCOFF_CD, LOCKR_LABEL, X, Y, LOCKR_KND, LOCKR_TYPE_CD, LOCKR_STAT)
          VALUES ('001', '001', ?, ?, ?, ?, ?, '00')
        `, [locker.label, locker.x, locker.y, locker.zone, locker.type]);
      }
      
      console.log('✅ Sample lockers inserted');
    } else {
      console.log(`✓ Database already contains ${lockerCount[0].count} lockers`);
    }
    
    console.log('\n✅ Database initialization complete!');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

// Run initialization
initializeDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});