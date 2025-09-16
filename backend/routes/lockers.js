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
    const { COMP_CD = 'C0001', BCOFF_CD = 'C0001F0020', parentOnly } = req.query;

    // Build dynamic query based on parentOnly parameter
    // Get member information directly from lockrs table
    // Only use cur_available_locker_user for additional member details if available
    let query = `
      SELECT
        l.*,
        COALESCE(u.MEM_NM, l.MEM_NM) as MEM_NM,
        COALESCE(u.MEM_SNO, l.MEM_SNO) as MEM_SNO,
        u.MEM_TELNO as MEM_TELNO,
        COALESCE(u.BUY_EVENT_SNO, l.BUY_EVENT_SNO) as BUY_EVENT_SNO,
        u.SELL_EVENT_NM
      FROM lockrs l
      LEFT JOIN cur_available_locker_user u ON l.LOCKR_CD = u.LOCKR_CD
      WHERE l.COMP_CD = ? AND l.BCOFF_CD = ?
    `;
    const params = [COMP_CD, BCOFF_CD];
    if (parentOnly === 'true') {
      query += ' AND l.PARENT_LOCKR_CD IS NULL';
      console.log('[API] Filtering for parent lockers only (PARENT_LOCKR_CD IS NULL)');
    }

    query += ' ORDER BY l.LOCKR_CD';

    const [rows] = await pool.query(query, params);

    console.log(`[API] Found ${rows.length} lockers for COMP_CD=${COMP_CD}, BCOFF_CD=${BCOFF_CD}`);

    // Add this debug line:
    console.log('[API Debug] All PARENT_LOCKR_CD values:', rows.map(r => ({
      label: r.LOCKR_LABEL,
      parent: r.PARENT_LOCKR_CD
    })));

    // Debug: Show member data for each locker
    console.log('[API Debug] Locker member data:');
    rows.forEach(row => {
      if (row.MEM_NM || row.MEM_SNO || row.BUY_EVENT_SNO) {
        console.log(`  - Locker ${row.LOCKR_CD} (${row.LOCKR_LABEL}): Member=${row.MEM_NM}, SNO=${row.MEM_SNO}, BuyEventSNO=${row.BUY_EVENT_SNO}, SellEventNm=${row.SELL_EVENT_NM}`);
      }
    });
    console.log(`[API Debug] Total lockers with member data: ${rows.filter(r => r.MEM_NM).length}`);

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

// Debug endpoint to check cur_available_locker_user
router.get('/debug/member-data', async (req, res) => {
  try {
    const { COMP_CD = 'C0001', BCOFF_CD = 'C0001F0020' } = req.query;

    // Check what's in cur_available_locker_user
    const [userRows] = await pool.query(
      'SELECT * FROM cur_available_locker_user WHERE LOCKR_CD IS NOT NULL ORDER BY LOCKR_CD',
      []
    );

    console.log('[DEBUG] cur_available_locker_user data:');
    userRows.forEach(row => {
      console.log(`  - LOCKR_CD: ${row.LOCKR_CD}, MEM_NM: ${row.MEM_NM}, BUY_EVENT_SNO: ${row.BUY_EVENT_SNO}`);
    });

    // Also check lockrs table data
    const [lockerRows] = await pool.query(
      'SELECT LOCKR_CD, LOCKR_LABEL, LOCKR_STAT, MEM_SNO, LOCKR_USE_S_DATE, LOCKR_USE_E_DATE, BUY_EVENT_SNO FROM lockrs WHERE COMP_CD = ? AND BCOFF_CD = ? AND MEM_SNO IS NOT NULL',
      [COMP_CD, BCOFF_CD]
    );

    console.log('[DEBUG] lockrs table member data:');
    lockerRows.forEach(row => {
      console.log(`  - LOCKR_CD: ${row.LOCKR_CD}, MEM_SNO: ${row.MEM_SNO}, BUY_EVENT_SNO: ${row.BUY_EVENT_SNO}, STAT: ${row.LOCKR_STAT}`);
    });

    res.json({
      cur_available_locker_user: userRows,
      lockrs_with_members: lockerRows
    });
  } catch (error) {
    console.error('[DEBUG] Error checking member data:', error);
    res.status(500).json({ error: error.message });
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
      COMP_CD = 'C0001',
      BCOFF_CD = 'C0001F0020',
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

// Batch update locker numbers for performance optimization
// IMPORTANT: This route must be defined BEFORE the generic /:lockrCd route
router.put('/batch-numbers', async (req, res) => {
  try {
    const { updates } = req.body;
    
    // 디버그: 받은 데이터 확인
    console.log('[API] Batch number update - raw body:', JSON.stringify(req.body, null, 2));
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required and cannot be empty'
      });
    }
    
    console.log(`[API] Batch number update request: ${updates.length} updates`);
    console.log('[API] First update sample:', updates[0]);
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let successCount = 0;
      const errors = [];
      
      for (const update of updates) {
        if (!update.lockrCd || update.LOCKR_NO === undefined || update.LOCKR_NO === null) {
          errors.push(`Invalid update data: ${JSON.stringify(update)}`);
          continue;
        }
        
        try {
          const [result] = await connection.query(
            `UPDATE lockrs SET LOCKR_NO = ?, UPDATE_DT = NOW(), UPDATE_BY = ? WHERE LOCKR_CD = ?`,
            [update.LOCKR_NO, 'system', update.lockrCd]
          );
          
          if (result.affectedRows > 0) {
            successCount++;
          } else {
            errors.push(`Locker not found: ${update.lockrCd}`);
          }
        } catch (updateError) {
          errors.push(`Error updating ${update.lockrCd}: ${updateError.message}`);
        }
      }
      
      if (errors.length > 0 && successCount === 0) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          error: 'All updates failed',
          details: errors
        });
      }
      
      await connection.commit();
      
      console.log(`[API] Batch update completed: ${successCount} successful, ${errors.length} errors`);
      
      res.json({
        success: true,
        successCount,
        totalRequested: updates.length,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('[API] Error in batch number update:', error);
    res.status(500).json({
      success: false,
      error: 'Batch update failed',
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
    const { tierCount, startTierLevel, parentFrontViewX, parentFrontViewY } = req.body;
    
    console.log(`[TIERS API] Request received:`, {
      lockrCd,
      tierCount,
      startTierLevel,
      parentFrontViewX,
      parentFrontViewY
    });
    
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
    
    // Parent's front view position - 루프 밖에서 한 번만 설정
    // 프론트엔드에서 보낸 좌표를 우선 사용, 없으면 DB 값 사용
    let parentFrontX = parentFrontViewX !== undefined ? parentFrontViewX : parentLocker.FRONT_VIEW_X
    let parentFrontY = parentFrontViewY !== undefined ? parentFrontViewY : parentLocker.FRONT_VIEW_Y
    
    // Parent coordinates check - logging removed
    
    if (parentFrontX === null || parentFrontY === null) {
      // 부모 락커에 FRONT_VIEW 좌표가 없는 경우, 에러 반환
      // Parent missing FRONT_VIEW coordinates
      return res.status(400).json({
        success: false,
        error: 'Parent locker missing front view coordinates. Please save parent position first.'
      })
    }
    
    // 프론트엔드에서 좌표를 보냈다면 부모 락커의 FRONT_VIEW 좌표도 업데이트
    if (parentFrontViewX !== undefined && parentFrontViewY !== undefined) {
      await pool.query(
        'UPDATE lockrs SET FRONT_VIEW_X = ?, FRONT_VIEW_Y = ? WHERE LOCKR_CD = ?',
        [parentFrontX, parentFrontY, lockrCd]
      )
      // Updated parent with new front view coordinates
    }
    
    // Check for existing children to determine the correct starting tier level
    const [existingChildren] = await pool.query(
      'SELECT TIER_LEVEL, LOCKR_LABEL, LOCKR_CD FROM lockrs WHERE PARENT_LOCKR_CD = ? ORDER BY TIER_LEVEL',
      [lockrCd]
    );
    
    console.log(`[TIERS API] Existing children: ${existingChildren.length} found`);
    
    const existingTierLevels = existingChildren.map(child => child.TIER_LEVEL);
    const existingMaxTier = existingTierLevels.length > 0 ? Math.max(...existingTierLevels) : 0;
    
    // Use the provided startTierLevel or calculate from existing children
    // CRITICAL: Ensure startTierLevel is treated as a number
    const baseTierLevel = startTierLevel ? Number(startTierLevel) : (existingMaxTier + 1);
    
    console.log(`[TIERS API] Tier calculation: startLevel=${startTierLevel} → baseTierLevel=${baseTierLevel}`);
    
    // Check if any of the tier levels we're about to create already exist
    const tierLevelsToCreate = [];
    for (let i = 0; i < tierCount; i++) {
      tierLevelsToCreate.push(baseTierLevel + i);
    }
    
    const conflictingTiers = existingChildren.filter(child => 
      tierLevelsToCreate.includes(child.TIER_LEVEL)
    );
    
    if (conflictingTiers.length > 0) {
      // Tier level conflict detected - logging removed
      
      // Delete existing conflicting tiers before creating new ones
      const conflictingIds = conflictingTiers.map(t => t.LOCKR_CD);
      await pool.query(
        'DELETE FROM lockrs WHERE LOCKR_CD IN (?)',
        [conflictingIds]
      );
      // Deleted conflicting tiers
    }
    
    // Creating tiers - logging removed
    
    // Before creating new tiers, find existing children's positions
    const [existingChildrenPositions] = await pool.query(
      'SELECT FRONT_VIEW_Y FROM lockrs WHERE PARENT_LOCKR_CD = ? AND FRONT_VIEW_Y IS NOT NULL ORDER BY FRONT_VIEW_Y ASC',
      [lockrCd]
    );
    
    // Get parent locker's actual height from lockr_types table
    let tierHeight = 30;  // Default height if not found
    if (parentLocker.LOCKR_TYPE_CD) {
      const [lockerTypeData] = await pool.query(
        'SELECT HEIGHT FROM lockr_types WHERE LOCKR_TYPE_CD = ? AND COMP_CD = ? AND BCOFF_CD = ?',
        [parentLocker.LOCKR_TYPE_CD, parentLocker.COMP_CD, parentLocker.BCOFF_CD]
      );
      
      if (lockerTypeData.length > 0 && lockerTypeData[0].HEIGHT) {
        tierHeight = lockerTypeData[0].HEIGHT;
        console.log(`[TIERS API] Using locker type height: ${tierHeight} for type ${parentLocker.LOCKR_TYPE_CD}`);
      } else {
        console.log(`[TIERS API] No height found for type ${parentLocker.LOCKR_TYPE_CD}, using default: ${tierHeight}`);
      }
    }
    
    // Calculate tier dimensions
    const LOCKER_VISUAL_SCALE = 2.0
    const gap = 0  // 락커 사이 간격 (요청에 따라 0으로 설정)
    const scaledTierHeight = tierHeight * LOCKER_VISUAL_SCALE
    const scaledGap = gap * LOCKER_VISUAL_SCALE
    
    // Calculate starting Y position
    let startingY;
    if (existingChildrenPositions.length > 0) {
      // Position above existing topmost child
      const topmostChildY = existingChildrenPositions[0].FRONT_VIEW_Y;
      startingY = topmostChildY - (scaledTierHeight + scaledGap);
      console.log(`[TIERS API] Positioning above existing child at Y=${topmostChildY}, new starting Y=${startingY}`);
    } else {
      // No existing children, position above parent
      startingY = Number(parentFrontY) - (scaledTierHeight + scaledGap);
      console.log(`[TIERS API] No existing children, positioning above parent at Y=${parentFrontY}, starting Y=${startingY}`);
    }
    
    // Create tier lockers
    for (let i = 0; i < tierCount; i++) {
      const currentTierLevel = baseTierLevel + i;
      
      // Calculate each tier position sequentially from the starting position
      // SVG Y축은 아래로 갈수록 증가하므로, 위로 올리려면 Y값을 감소시킴
      // CRITICAL: 부모와 정확히 같은 X 좌표 사용
      const tierFrontViewX = Number(parentFrontX)  // X좌표는 부모와 완전히 동일해야 함
      const tierFrontViewY = startingY - i * (scaledTierHeight + scaledGap);
      
      // Tier coordinate calculation - logging removed

      const tierData = {
        COMP_CD: parentLocker.COMP_CD,
        BCOFF_CD: parentLocker.BCOFF_CD,
        LOCKR_KND: parentLocker.LOCKR_KND,
        LOCKR_TYPE_CD: parentLocker.LOCKR_TYPE_CD,
        X: null, // No floor position for front-view-only tiers
        Y: null, // No floor position for front-view-only tiers
        LOCKR_LABEL: `${parentLocker.LOCKR_LABEL}-T${currentTierLevel}`,
        ROTATION: 0, // Front view lockers always face forward
        DOOR_DIRECTION: null,
        FRONT_VIEW_X: tierFrontViewX,  // 명시적으로 tierFrontViewX 사용
        FRONT_VIEW_Y: Math.round(tierFrontViewY),
        GROUP_NUM: parentLocker.GROUP_NUM,
        LOCKR_GENDR_SET: parentLocker.LOCKR_GENDR_SET,
        LOCKR_NO: null, // 단수 입력시 번호는 자동 부여하지 않음
        PARENT_LOCKR_CD: lockrCd,
        TIER_LEVEL: currentTierLevel,
        LOCKR_STAT: '00',
        UPDATE_DT: new Date(),
        UPDATE_BY: 'system'
      };
      
      // 삽입 직전 최종 확인
      console.log(`[TIERS API] Creating tier: ${tierData.LOCKR_LABEL} (TIER_LEVEL=${tierData.TIER_LEVEL})`);
      
      // INSERT 쿼리 직접 실행
      const insertQuery = `
        INSERT INTO lockrs (
          COMP_CD, BCOFF_CD, LOCKR_KND, LOCKR_TYPE_CD,
          X, Y, LOCKR_LABEL, ROTATION, DOOR_DIRECTION,
          FRONT_VIEW_X, FRONT_VIEW_Y, GROUP_NUM, LOCKR_GENDR_SET,
          LOCKR_NO, PARENT_LOCKR_CD, TIER_LEVEL, LOCKR_STAT,
          UPDATE_DT, UPDATE_BY
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `;
      
      const insertValues = [
        tierData.COMP_CD,
        tierData.BCOFF_CD,
        tierData.LOCKR_KND,
        tierData.LOCKR_TYPE_CD,
        tierData.X,  // NULL
        tierData.Y,  // NULL
        tierData.LOCKR_LABEL,
        tierData.ROTATION,
        tierData.DOOR_DIRECTION,
        tierData.FRONT_VIEW_X,  // 이 값이 parentFrontX와 동일해야 함
        tierData.FRONT_VIEW_Y,
        tierData.GROUP_NUM,
        tierData.LOCKR_GENDR_SET,
        tierData.LOCKR_NO,
        tierData.PARENT_LOCKR_CD,
        tierData.TIER_LEVEL,
        tierData.LOCKR_STAT,
        tierData.UPDATE_BY
      ];
      
      // INSERT VALUES logging removed
      
      const [result] = await pool.query(insertQuery, insertValues);
      
      // DB verification removed to reduce logs
      
      newTiers.push({ ...tierData, LOCKR_CD: result.insertId });
    }
    
    // Added tiers - logging removed
    
    console.log(`[TIERS API] Response: ${newTiers.length} tiers created successfully`);
    
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

// [REMOVED - Moved before generic /:lockrCd route to fix routing conflict]

// Clean up duplicate tier lockers
router.post('/cleanup-duplicates', async (req, res) => {
  try {
    console.log('[API] Starting duplicate tier cleanup...', req.body || {});
    
    // Find all duplicate tiers (same parent and tier level)
    const [duplicates] = await pool.query(`
      SELECT 
        PARENT_LOCKR_CD,
        TIER_LEVEL,
        GROUP_CONCAT(LOCKR_CD) as duplicate_ids,
        GROUP_CONCAT(LOCKR_LABEL) as duplicate_labels,
        COUNT(*) as count
      FROM lockrs
      WHERE PARENT_LOCKR_CD IS NOT NULL
      GROUP BY PARENT_LOCKR_CD, TIER_LEVEL
      HAVING COUNT(*) > 1
    `);
    
    let totalDeleted = 0;
    const cleanupResults = [];
    
    for (const dup of duplicates) {
      const ids = dup.duplicate_ids.split(',').map(id => parseInt(id));
      const labels = dup.duplicate_labels.split(',');
      
      // Keep the first one, delete the rest
      const idsToDelete = ids.slice(1);
      
      if (idsToDelete.length > 0) {
        await pool.query(
          'DELETE FROM lockrs WHERE LOCKR_CD IN (?)',
          [idsToDelete]
        );
        
        totalDeleted += idsToDelete.length;
        cleanupResults.push({
          parentLockrCd: dup.PARENT_LOCKR_CD,
          tierLevel: dup.TIER_LEVEL,
          kept: { id: ids[0], label: labels[0] },
          deleted: idsToDelete.map((id, idx) => ({ id, label: labels[idx + 1] }))
        });
        
        console.log(`[API] Cleaned up tier ${dup.TIER_LEVEL} of parent ${dup.PARENT_LOCKR_CD}: kept ${ids[0]}, deleted ${idsToDelete.join(', ')}`);
      }
    }
    
    console.log(`[API] Duplicate cleanup complete. Deleted ${totalDeleted} duplicate tiers.`);
    
    res.json({
      success: true,
      totalDeleted,
      results: cleanupResults
    });
  } catch (error) {
    console.error('[API] Error cleaning up duplicates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up duplicates',
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

// 락커 배정 API
router.put('/:lockrCd/assign', async (req, res) => {
  const { lockrCd } = req.params;
  const { 
    userName, 
    userPhone,
    memberSno, 
    startDate, 
    endDate, 
    memo,
    voucherId,
    usage
  } = req.body;
  
  console.log('[API] 락커 배정 요청:', { lockrCd, body: req.body });
  
  if (!userName || !memberSno || !startDate || !endDate) {
    return res.status(400).json({ 
      error: '필수 정보가 누락되었습니다.' 
    });
  }
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 락커 번호 조회
    const [lockerInfo] = await connection.query(
      'SELECT LOCKR_NO FROM lockrs WHERE LOCKR_CD = ?',
      [lockrCd]
    );

    if (!lockerInfo.length) {
      await connection.rollback();
      return res.status(404).json({
        error: '해당 락커를 찾을 수 없습니다.'
      });
    }

    const lockerNo = lockerInfo[0].LOCKR_NO;

    // 2. lockrs 테이블 업데이트
    const sql = `
      UPDATE lockrs
      SET
        MEM_NM = ?,
        MEM_SNO = ?,
        MEM_TELNO = ?,
        LOCKR_USE_S_DATE = ?,
        LOCKR_USE_E_DATE = ?,
        MEMO = ?,
        UPDATE_BY = 'SYSTEM',
        UPDATE_DT = NOW(),
        LOCKR_STAT = '01',
        BUY_EVENT_SNO = ?
      WHERE LOCKR_CD = ?
    `;

    const [result] = await connection.query(sql, [
      userName,
      memberSno,
      userPhone || null,
      startDate,
      endDate,
      memo || null,
      voucherId || usage || null,
      lockrCd
    ]);

    console.log(`[API] 락커 배정 결과: ${result.affectedRows}개 업데이트됨`);

    // 3. BUY_EVENT_MGMT_TBL 업데이트 (voucherId가 있을 경우에만)
    if (voucherId) {
      const updateBuyEventSql = `
        UPDATE BUY_EVENT_MGMT_TBL
        SET
          LOCKR_NO = ?,
          EXR_S_DATE = ?,
          EXR_E_DATE = ?,
          MOD_ID = 'SYSTEM',
          MOD_DATETM = NOW(),
          EVENT_STAT = '00'
        WHERE BUY_EVENT_SNO = ?
      `;

      const [buyEventResult] = await connection.query(updateBuyEventSql, [
        lockerNo,
        startDate,
        endDate,
        voucherId
      ]);

      console.log(`[API] BUY_EVENT_MGMT_TBL 업데이트: ${buyEventResult.affectedRows}개, BUY_EVENT_SNO=${voucherId}`);
    }

    await connection.commit();

    res.json({
      success: true,
      message: '락커가 성공적으로 배정되었습니다.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('[API] 락커 배정 오류:', error);
    res.status(500).json({ 
      error: '락커 배정 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 락커 사용 종료 API
router.put('/:id/release', async (req, res) => {
  const { id } = req.params;
  
  try {
    const sql = `
      UPDATE lockrs
      SET 
        MEM_NM = NULL,
        MEM_SNO = NULL,
        LOCKR_USE_S_DATE = NULL,
        LOCKR_USE_E_DATE = NULL,
        MEMO = NULL,
        UPDATE_BY = 'SYSTEM',
        UPDATE_DT = NOW(),
        LOCKR_STAT = 'E',
        BUY_EVENT_SNO = NULL
      WHERE LOCKR_ID = ?
        AND COMP_CD = 'C00001'
        AND BCOFF_CD = 'B00001'
    `;
    
    await pool.query(sql, [id]);
    
    res.json({ 
      success: true, 
      message: '락커 사용이 종료되었습니다.' 
    });
  } catch (error) {
    console.error('락커 사용 종료 오류:', error);
    res.status(500).json({ 
      error: '락커 사용 종료 중 오류가 발생했습니다.' 
    });
  }
});

// 락커 상태 조회 API (회원 정보 포함)
router.get('/status/all', async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.LOCKR_CD,
        l.LOCKR_NO,
        l.LOCKR_STAT,
        l.MEM_NM,
        l.MEM_SNO,
        l.LOCKR_USE_S_DATE,
        l.LOCKR_USE_E_DATE,
        l.MEMO,
        l.BUY_EVENT_SNO
      FROM lockrs l
      WHERE l.COMP_CD = 'C00001'
        AND l.BCOFF_CD = 'B00001'
    `;
    
    const [lockers] = await pool.query(sql);
    
    // 상태별 색상 및 만료 체크
    const now = new Date();
    const formattedLockers = lockers.map(locker => {
      let status = locker.LOCKR_STAT || 'E';
      let statusColor = '#FFFFFF'; // 기본 흰색 (빈 락커)
      let isExpiringSoon = false;
      
      if (status === 'I' && locker.LOCKR_USE_E_DATE) {
        // 사용중인 락커의 만료일 체크
        const endDate = new Date(locker.LOCKR_USE_E_DATE);
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          // 만료됨
          statusColor = '#FFB6C1'; // 연한 분홍색
          status = 'EXPIRED';
        } else if (daysUntilExpiry <= 7) {
          // 만료 임박 (7일 이내)
          statusColor = '#FFFFE0'; // 연한 노란색
          isExpiringSoon = true;
        } else {
          // 정상 사용중
          statusColor = '#90EE90'; // 연한 초록색
        }
      } else if (status === 'U') {
        // 사용불가
        statusColor = '#D3D3D3'; // 회색
      } else {
        // 빈 락커 (E)
        statusColor = '#FFFFFF'; // 흰색
      }
      
      return {
        id: locker.LOCKR_CD,
        number: locker.LOCKR_NO,
        status: status,
        statusColor: statusColor,
        memberName: locker.MEM_NM,
        memberSno: locker.MEM_SNO,
        startDate: locker.LOCKR_USE_S_DATE,
        endDate: locker.LOCKR_USE_E_DATE,
        memo: locker.MEMO,
        isExpiringSoon: isExpiringSoon,
        hasMemo: !!locker.MEMO
      };
    });
    
    res.json(formattedLockers);
  } catch (error) {
    console.error('락커 상태 조회 오류:', error);
    res.status(500).json({ 
      error: '락커 상태 조회 중 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;