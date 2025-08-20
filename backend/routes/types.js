const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all locker types
router.get('/', async (req, res) => {
  try {
    const { COMP_CD = '001', BCOFF_CD = '001' } = req.query;
    
    // Check if lockr_types table exists
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'lockr_types'"
    );
    
    if (tables.length === 0) {
      // Return default types if table doesn't exist
      const defaultTypes = [
        {
          LOCKR_TYPE_CD: '1',
          LOCKR_TYPE_NM: '소형',
          WIDTH: 40,
          HEIGHT: 40,
          DEPTH: 40,
          COLOR: '#3b82f6'
        },
        {
          LOCKR_TYPE_CD: '2',
          LOCKR_TYPE_NM: '중형',
          WIDTH: 50,
          HEIGHT: 60,
          DEPTH: 50,
          COLOR: '#10b981'
        },
        {
          LOCKR_TYPE_CD: '3',
          LOCKR_TYPE_NM: '대형',
          WIDTH: 60,
          HEIGHT: 80,
          DEPTH: 60,
          COLOR: '#f59e0b'
        }
      ];
      
      return res.json({
        success: true,
        types: defaultTypes,
        count: defaultTypes.length,
        source: 'default'
      });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM lockr_types WHERE COMP_CD = ? AND BCOFF_CD = ?',
      [COMP_CD, BCOFF_CD]
    );
    
    console.log(`[API] Found ${rows.length} locker types`);
    
    res.json({ 
      success: true,
      types: rows,
      count: rows.length,
      source: 'database'
    });
  } catch (error) {
    console.error('[API] Error fetching types:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch locker types',
      details: error.message 
    });
  }
});

// Create locker type
router.post('/', async (req, res) => {
  try {
    const {
      LOCKR_TYPE_CD,
      LOCKR_TYPE_NM,
      WIDTH = 50,
      HEIGHT = 60,
      DEPTH = 50,
      COLOR = '#3b82f6',
      COMP_CD = '001',
      BCOFF_CD = '001'
    } = req.body;
    
    // Check if table exists
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'lockr_types'"
    );
    
    if (tables.length === 0) {
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lockr_types (
          LOCKR_TYPE_ID INT PRIMARY KEY AUTO_INCREMENT,
          LOCKR_TYPE_CD VARCHAR(20) NOT NULL,
          LOCKR_TYPE_NM VARCHAR(50),
          COMP_CD VARCHAR(20),
          BCOFF_CD VARCHAR(20),
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
    }
    
    const [result] = await pool.query(
      `INSERT INTO lockr_types (
        LOCKR_TYPE_CD, LOCKR_TYPE_NM, WIDTH, HEIGHT, DEPTH, COLOR,
        COMP_CD, BCOFF_CD, UPDATE_DT, UPDATE_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        LOCKR_TYPE_CD, LOCKR_TYPE_NM, WIDTH, HEIGHT, DEPTH, COLOR,
        COMP_CD, BCOFF_CD, 'system'
      ]
    );
    
    console.log(`[API] Created locker type: ${LOCKR_TYPE_NM}`);
    
    res.json({ 
      success: true,
      typeId: result.insertId,
      message: 'Locker type created successfully'
    });
  } catch (error) {
    console.error('[API] Error creating type:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create locker type',
      details: error.message 
    });
  }
});

module.exports = router;