const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all zones
router.get('/', async (req, res) => {
  try {
    const { COMP_CD = '001', BCOFF_CD = '001' } = req.query;
    
    // Check if lockr_area table exists, otherwise use default zones
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'lockr_area'"
    );
    
    if (tables.length === 0) {
      // Return default zones if table doesn't exist
      const defaultZones = [
        {
          LOCKR_KND_CD: 'zone-1',
          LOCKR_KND_NM: '남자 탈의실',
          X: 0,
          Y: 0,
          WIDTH: 800,
          HEIGHT: 600,
          COLOR: '#f0f9ff'
        },
        {
          LOCKR_KND_CD: 'zone-2',
          LOCKR_KND_NM: '여자 탈의실',
          X: 0,
          Y: 0,
          WIDTH: 800,
          HEIGHT: 600,
          COLOR: '#fef3c7'
        },
        {
          LOCKR_KND_CD: 'zone-3',
          LOCKR_KND_NM: '혼용 탈의실',
          X: 0,
          Y: 0,
          WIDTH: 800,
          HEIGHT: 600,
          COLOR: '#fee2e2'
        }
      ];
      
      return res.json({
        success: true,
        zones: defaultZones,
        count: defaultZones.length,
        source: 'default'
      });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM lockr_area WHERE COMP_CD = ? AND BCOFF_CD = ?',
      [COMP_CD, BCOFF_CD]
    );
    
    console.log(`[API] Found ${rows.length} zones`);
    
    res.json({ 
      success: true,
      zones: rows,
      count: rows.length,
      source: 'database'
    });
  } catch (error) {
    console.error('[API] Error fetching zones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch zones',
      details: error.message 
    });
  }
});

// Create zone
router.post('/', async (req, res) => {
  try {
    const {
      LOCKR_KND_CD,
      LOCKR_KND_NM,
      X = 0,
      Y = 0,
      WIDTH = 800,
      HEIGHT = 600,
      COLOR = '#e5e7eb',
      COMP_CD = '001',
      BCOFF_CD = '001'
    } = req.body;
    
    // Check if table exists
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'lockr_area'"
    );
    
    if (tables.length === 0) {
      // Create table if it doesn't exist - matching actual schema
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lockr_area (
          LOCKR_KND_CD VARCHAR(36) NOT NULL,
          LOCKR_KND_NM VARCHAR(50),
          COMP_CD VARCHAR(20) NOT NULL,
          BCOFF_CD VARCHAR(20) NOT NULL,
          X INT NOT NULL,
          Y INT NOT NULL,
          WIDTH INT NOT NULL,
          HEIGHT INT NOT NULL,
          COLOR VARCHAR(7),
          FLOOR INT DEFAULT 1,
          CRE_DATETM DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (LOCKR_KND_CD, COMP_CD, BCOFF_CD),
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    
    const [result] = await pool.query(
      `INSERT INTO lockr_area (
        LOCKR_KND_CD, LOCKR_KND_NM, X, Y, WIDTH, HEIGHT, COLOR,
        COMP_CD, BCOFF_CD, FLOOR, CRE_DATETM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        LOCKR_KND_CD, LOCKR_KND_NM, X, Y, WIDTH, HEIGHT, COLOR,
        COMP_CD, BCOFF_CD, 1
      ]
    );
    
    console.log(`[API] Created zone: ${LOCKR_KND_NM}`);
    
    res.json({ 
      success: true,
      zoneId: result.insertId,
      message: 'Zone created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating zone:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create zone',
      details: error.message 
    });
  }
});

// Delete zone
router.delete('/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { COMP_CD = '001', BCOFF_CD = '001' } = req.query;
    
    // First check if zone has any lockers
    const [lockrTables] = await pool.query("SHOW TABLES LIKE 'lockrs'");
    
    if (lockrTables.length > 0) {
      const [lockers] = await pool.query(
        'SELECT COUNT(*) as count FROM lockrs WHERE LOCKR_KND = ? AND COMP_CD = ? AND BCOFF_CD = ?',
        [zoneId, COMP_CD, BCOFF_CD]
      );
      
      if (lockers[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete zone',
          message: `Zone has ${lockers[0].count} lockers. Please remove all lockers first.`,
          lockerCount: lockers[0].count
        });
      }
    }
    
    // Delete the zone
    const [result] = await pool.query(
      'DELETE FROM lockr_area WHERE LOCKR_KND_CD = ? AND COMP_CD = ? AND BCOFF_CD = ?',
      [zoneId, COMP_CD, BCOFF_CD]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Zone not found'
      });
    }
    
    console.log(`[API] Deleted zone: ${zoneId}`);
    
    res.json({
      success: true,
      message: 'Zone deleted successfully',
      deletedZoneId: zoneId
    });
  } catch (error) {
    console.error('[API] Error deleting zone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete zone',
      details: error.message
    });
  }
});

module.exports = router;