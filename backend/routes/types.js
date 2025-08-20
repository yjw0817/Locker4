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
          LOCKR_TYPE_CD VARCHAR(20) NOT NULL,
          LOCKR_TYPE_NM VARCHAR(50),
          COMP_CD VARCHAR(20) NOT NULL,
          BCOFF_CD VARCHAR(20) NOT NULL,
          WIDTH INT NOT NULL,
          HEIGHT INT NOT NULL,
          DEPTH INT NOT NULL,
          COLOR VARCHAR(7),
          CRE_DATETM DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (LOCKR_TYPE_CD, COMP_CD, BCOFF_CD),
          INDEX idx_comp_bcoff (COMP_CD, BCOFF_CD)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    
    const [result] = await pool.query(
      `INSERT INTO lockr_types (
        LOCKR_TYPE_CD, LOCKR_TYPE_NM, WIDTH, HEIGHT, DEPTH, COLOR,
        COMP_CD, BCOFF_CD, CRE_DATETM
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        LOCKR_TYPE_CD, LOCKR_TYPE_NM, WIDTH, HEIGHT, DEPTH, COLOR,
        COMP_CD, BCOFF_CD
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

// Delete locker type
router.delete('/:typeId', async (req, res) => {
  try {
    const { typeId } = req.params;
    const { COMP_CD = '001', BCOFF_CD = '001' } = req.query;
    
    // First check if type has any lockers
    const [lockrTables] = await pool.query("SHOW TABLES LIKE 'lockrs'");
    
    if (lockrTables.length > 0) {
      const [lockers] = await pool.query(
        'SELECT COUNT(*) as count FROM lockrs WHERE LOCKR_TYPE_CD = ? AND COMP_CD = ? AND BCOFF_CD = ?',
        [typeId, COMP_CD, BCOFF_CD]
      );
      
      if (lockers[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete locker type',
          message: `Type has ${lockers[0].count} lockers. Please remove all lockers first.`,
          lockerCount: lockers[0].count
        });
      }
    }
    
    // Delete the type
    const [result] = await pool.query(
      'DELETE FROM lockr_types WHERE LOCKR_TYPE_CD = ? AND COMP_CD = ? AND BCOFF_CD = ?',
      [typeId, COMP_CD, BCOFF_CD]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Locker type not found'
      });
    }
    
    console.log(`[API] Deleted locker type: ${typeId}`);
    
    res.json({
      success: true,
      message: 'Locker type deleted successfully',
      deletedTypeId: typeId
    });
  } catch (error) {
    console.error('[API] Error deleting locker type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete locker type',
      details: error.message
    });
  }
});

module.exports = router;