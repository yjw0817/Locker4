const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Status mapping
const statusMap = {
  'available': '00',
  'occupied': '01',
  'expired': '05',
  'maintenance': '03'
};

const statusMapReverse = {
  '00': 'available',
  '01': 'occupied',
  '02': 'occupied',
  '03': 'maintenance',
  '04': 'maintenance',
  '05': 'expired'
};

// Get all lockers
router.get('/', async (req, res) => {
  try {
    const { COMP_CD = '001', BCOFF_CD = '001', parentOnly } = req.query;
    
    // Build dynamic query based on parentOnly parameter
    let query = 'SELECT * FROM lockrs WHERE COMP_CD = ? AND BCOFF_CD = ?';
    const params = [COMP_CD, BCOFF_CD];
    
    if (parentOnly === 'true') {
      query += ' AND PARENT_LOCKR_CD IS NULL';
      console.log('[API] Filtering for parent lockers only (PARENT_LOCKR_CD IS NULL)');
    }
    
    query += ' ORDER BY LOCKR_CD';
    
    const [rows] = await pool.query(query, params);
    
    console.log(`[API] Found ${rows.length} lockers for COMP_CD=${COMP_CD}, BCOFF_CD=${BCOFF_CD}`);

    // Add this debug line:
    console.log('[API Debug] All PARENT_LOCKR_CD values:', rows.map(r => ({ 
      label: r.LOCKR_LABEL, 
      parent: r.PARENT_LOCKR_CD 
    })));
    
    // Ensure type codes are strings for consistency
    const processedRows = rows.map(row => ({
      ...row,
      LOCKR_TYPE_CD: row.LOCKR_TYPE_CD ? String(row.LOCKR_TYPE_CD) : '1'
    }));
    
    res.json({ 
      success: true,
      lockers: processedRows,
      count: processedRows.length 
    });
  } catch (error) {
    console.error('[API] Error fetching lockers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch lockers',
      details: error.message 
    });
  }
});

// Get single locker
router.get('/:lockrCd', async (req, res) => {
  try {
    const { lockrCd } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM lockrs WHERE LOCKR_CD = ?',
      [lockrCd]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Locker not found' 
      });
    }
    
    res.json({ 
      success: true,
      locker: rows[0] 
    });
  } catch (error) {
    console.error('[API] Error fetching locker:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch locker' 
    });
  }
});

// Create new locker
router.post('/', async (req, res) => {
  try {
    const {
      COMP_CD = '001',
      BCOFF_CD = '001',
      LOCKR_KND,
      LOCKR_TYPE_CD,
      X,
      Y,
      LOCKR_LABEL,
      ROTATION = 0,
      DOOR_DIRECTION,
      FRONT_VIEW_X,
      FRONT_VIEW_Y,
      GROUP_NUM,
      LOCKR_GENDR_SET,
      LOCKR_NO,
      PARENT_LOCKR_CD,
      TIER_LEVEL = 0,
      LOCKR_STAT = '00'
    } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO lockrs (
        COMP_CD, BCOFF_CD, LOCKR_KND, LOCKR_TYPE_CD,
        X, Y, LOCKR_LABEL, ROTATION, DOOR_DIRECTION,
        FRONT_VIEW_X, FRONT_VIEW_Y, GROUP_NUM, LOCKR_GENDR_SET,
        LOCKR_NO, PARENT_LOCKR_CD, TIER_LEVEL, LOCKR_STAT,
        UPDATE_DT, UPDATE_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        COMP_CD, BCOFF_CD, LOCKR_KND, LOCKR_TYPE_CD,
        X, Y, LOCKR_LABEL, ROTATION, DOOR_DIRECTION,
        FRONT_VIEW_X, FRONT_VIEW_Y, GROUP_NUM, LOCKR_GENDR_SET,
        LOCKR_NO, PARENT_LOCKR_CD, TIER_LEVEL, LOCKR_STAT,
        'system'
      ]
    );
    
    // Fetch the created locker
    const [newLocker] = await pool.query(
      'SELECT * FROM lockrs WHERE LOCKR_CD = ?',
      [result.insertId]
    );
    
    console.log(`[API] Created locker with ID: ${result.insertId}`);
    
    res.json({ 
      success: true,
      lockrCd: result.insertId,
      locker: newLocker[0]
    });
  } catch (error) {
    console.error('[API] Error creating locker:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create locker',
      details: error.message 
    });
  }
});

// Update locker
router.put('/:lockrCd', async (req, res) => {
  try {
    const { lockrCd } = req.params;
    const updates = req.body;
    
    // Remove read-only fields
    delete updates.LOCKR_CD;
    delete updates.id;
    
    // Add update metadata
    updates.UPDATE_DT = new Date();
    updates.UPDATE_BY = updates.UPDATE_BY || 'system';
    
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No fields to update' 
      });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(lockrCd);
    
    const [result] = await pool.query(
      `UPDATE lockrs SET ${setClause} WHERE LOCKR_CD = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Locker not found' 
      });
    }
    
    // Fetch updated locker
    const [updated] = await pool.query(
      'SELECT * FROM lockrs WHERE LOCKR_CD = ?',
      [lockrCd]
    );
    
    console.log(`[API] Updated locker ${lockrCd}`);
    
    res.json({ 
      success: true,
      locker: updated[0]
    });
  } catch (error) {
    console.error('[API] Error updating locker:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update locker',
      details: error.message 
    });
  }
});

// Delete locker
router.delete('/:lockrCd', async (req, res) => {
  try {
    const { lockrCd } = req.params;
    
    // Check for children
    const [children] = await pool.query(
      'SELECT COUNT(*) as count FROM lockrs WHERE PARENT_LOCKR_CD = ?',
      [lockrCd]
    );
    
    if (children[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Cannot delete: ${children[0].count} child lockers exist` 
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM lockrs WHERE LOCKR_CD = ?',
      [lockrCd]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Locker not found' 
      });
    }
    
    console.log(`[API] Deleted locker ${lockrCd}`);
    
    res.json({ 
      success: true,
      message: 'Locker deleted successfully' 
    });
  } catch (error) {
    console.error('[API] Error deleting locker:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete locker',
      details: error.message 
    });
  }
});

// Add tiers to parent locker
router.post('/:lockrCd/tiers', async (req, res) => {
  try {
    const { lockrCd } = req.params;
    const { tierCount } = req.body;
    
    if (!tierCount || tierCount < 1 || tierCount > 10) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tier count (must be 1-10)' 
      });
    }
    
    // Get parent locker
    const [parent] = await pool.query(
      'SELECT * FROM lockrs WHERE LOCKR_CD = ?',
      [lockrCd]
    );
    
    if (parent.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Parent locker not found' 
      });
    }
    
    const parentLocker = parent[0];
    const newTiers = [];
    
    // Create tier lockers
    for (let i = 1; i <= tierCount; i++) {
      // Calculate front view positions - tiers should stack ABOVE parent
      const LOCKER_VISUAL_SCALE = 2.0
      const tierHeight = 60
      const gap = 10
      const scaledTierHeight = tierHeight * LOCKER_VISUAL_SCALE
      const scaledGap = gap * LOCKER_VISUAL_SCALE
      
      // Parent's front view position (or use floor position as fallback)
      const parentFrontX = parentLocker.FRONT_VIEW_X !== null ? parentLocker.FRONT_VIEW_X : parentLocker.X
      const parentFrontY = parentLocker.FRONT_VIEW_Y !== null ? parentLocker.FRONT_VIEW_Y : parentLocker.Y
      
      // Stack tiers ABOVE parent (subtract from Y coordinate)
      const tierFrontViewY = parentFrontY - (scaledTierHeight + scaledGap) * i

      const tierData = {
        COMP_CD: parentLocker.COMP_CD,
        BCOFF_CD: parentLocker.BCOFF_CD,
        LOCKR_KND: parentLocker.LOCKR_KND,
        LOCKR_TYPE_CD: parentLocker.LOCKR_TYPE_CD,
        X: null, // No floor position for front-view-only tiers
        Y: null, // No floor position for front-view-only tiers
        LOCKR_LABEL: `${parentLocker.LOCKR_LABEL}-T${i}`,
        ROTATION: 0, // Front view lockers always face forward
        DOOR_DIRECTION: null,
        FRONT_VIEW_X: parentFrontX,
        FRONT_VIEW_Y: Math.round(tierFrontViewY),
        GROUP_NUM: parentLocker.GROUP_NUM,
        LOCKR_GENDR_SET: parentLocker.LOCKR_GENDR_SET,
        LOCKR_NO: parentLocker.LOCKR_NO ? (parentLocker.LOCKR_NO * 10 + i) : null,
        PARENT_LOCKR_CD: lockrCd,
        TIER_LEVEL: i,
        LOCKR_STAT: '00',
        UPDATE_DT: new Date(),
        UPDATE_BY: 'system'
      };
      
      const [result] = await pool.query(
        `INSERT INTO lockrs SET ?`,
        tierData
      );
      
      newTiers.push({ ...tierData, LOCKR_CD: result.insertId });
    }
    
    console.log(`[API] Added ${tierCount} tiers to locker ${lockrCd}`);
    
    res.json({ 
      success: true,
      tiers: newTiers,
      count: newTiers.length
    });
  } catch (error) {
    console.error('[API] Error adding tiers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add tiers',
      details: error.message 
    });
  }
});

// Get children of a parent locker
router.get('/:lockrCd/children', async (req, res) => {
  try {
    const { lockrCd } = req.params;
    
    const [children] = await pool.query(
      'SELECT * FROM lockrs WHERE PARENT_LOCKR_CD = ? ORDER BY TIER_LEVEL, LOCKR_NO',
      [lockrCd]
    );
    
    console.log(`[API] Found ${children.length} children for locker ${lockrCd}`);
    
    res.json({ 
      success: true,
      children: children,
      count: children.length
    });
  } catch (error) {
    console.error('[API] Error fetching children:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch children',
      details: error.message 
    });
  }
});

module.exports = router;