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
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lockr_area (
          LOCKR_AREA_ID INT PRIMARY KEY AUTO_INCREMENT,
          LOCKR_KND_CD VARCHAR(20) NOT NULL,
          LOCKR_KND_NM VARCHAR(50),
          COMP_CD VARCHAR(20),
          BCOFF_CD VARCHAR(20),
          X INT DEFAULT 0,
          Y INT DEFAULT 0,
          WIDTH INT DEFAULT 800,
          HEIGHT INT DEFAULT 600,
          COLOR VARCHAR(20),
          UPDATE_DT DATETIME DEFAULT CURRENT_TIMESTAMP,
          UPDATE_BY VARCHAR(45),
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD),
          UNIQUE KEY uk_zone (COMP_CD, BCOFF_CD, LOCKR_KND_CD)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    
    const [result] = await pool.query(
      `INSERT INTO lockr_area (
        LOCKR_KND_CD, LOCKR_KND_NM, X, Y, WIDTH, HEIGHT, COLOR,
        COMP_CD, BCOFF_CD, UPDATE_DT, UPDATE_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        LOCKR_KND_CD, LOCKR_KND_NM, X, Y, WIDTH, HEIGHT, COLOR,
        COMP_CD, BCOFF_CD, 'system'
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

module.exports = router;