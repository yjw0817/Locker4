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
    const { tierCount, parentFrontViewX, parentFrontViewY } = req.body;
    
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
    
    console.log(`[API CRITICAL] ⚠️ Parent ${parentLocker.LOCKR_LABEL} coordinates check:`, {
      fromRequest: { x: parentFrontViewX, y: parentFrontViewY },
      fromDB: { x: parentLocker.FRONT_VIEW_X, y: parentLocker.FRONT_VIEW_Y },
      finalValues: { x: parentFrontX, y: parentFrontY },
      xIsNumber: typeof parentFrontX === 'number',
      yIsNumber: typeof parentFrontY === 'number'
    })
    
    if (parentFrontX === null || parentFrontY === null) {
      // 부모 락커에 FRONT_VIEW 좌표가 없는 경우, 에러 반환
      console.error(`[API] Parent ${parentLocker.LOCKR_LABEL} missing FRONT_VIEW coordinates`)
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
      console.log(`[API] Updated parent ${parentLocker.LOCKR_LABEL} with new front view coordinates`)
    }
    
    // Create tier lockers
    for (let i = 1; i <= tierCount; i++) {
      // Calculate front view positions - tiers should stack ABOVE parent
      const LOCKER_VISUAL_SCALE = 2.0
      const tierHeight = 30  // 자식 락커의 실제 높이
      const gap = 5  // 락커 사이 간격
      const scaledTierHeight = tierHeight * LOCKER_VISUAL_SCALE
      const scaledGap = gap * LOCKER_VISUAL_SCALE
      
      // Stack tiers ABOVE parent (subtract from Y coordinate)
      // SVG Y축은 아래로 갈수록 증가하므로, 위로 올리려면 Y값을 감소시킴
      // CRITICAL: 부모와 정확히 같은 X 좌표 사용
      const tierFrontViewX = Number(parentFrontX)  // X좌표는 부모와 완전히 동일해야 함
      const tierFrontViewY = Number(parentFrontY) - (scaledTierHeight + scaledGap) * i
      
      console.log(`[API CRITICAL] ⚠️ TIER ${i} COORDINATE CALCULATION:`, {
        parentLabel: parentLocker.LOCKR_LABEL,
        parentX: parentFrontX,
        parentY: parentFrontY,
        calculation: {
          tierX_formula: `parentFrontX (${parentFrontX})`,
          tierY_formula: `${parentFrontY} - (${scaledTierHeight} + ${scaledGap}) * ${i} = ${tierFrontViewY}`,
        },
        result: {
          tierX: tierFrontViewX,
          tierY: tierFrontViewY,
          xDiff: tierFrontViewX - parentFrontX,  // MUST BE 0
          yDiff: tierFrontViewY - parentFrontY,  // MUST BE NEGATIVE
        },
        validation: {
          xCorrect: tierFrontViewX === parentFrontX ? '✅ X CORRECT' : `❌ X WRONG (diff: ${tierFrontViewX - parentFrontX})`,
          yCorrect: tierFrontViewY < parentFrontY ? '✅ Y CORRECT (above parent)' : '❌ Y WRONG (not above parent)'
        }
      })

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
        FRONT_VIEW_X: tierFrontViewX,  // 명시적으로 tierFrontViewX 사용
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
      
      // 삽입 직전 최종 확인
      console.log(`[API] BEFORE INSERT - Tier ${i} final values:`, {
        LABEL: tierData.LOCKR_LABEL,
        FRONT_VIEW_X: tierData.FRONT_VIEW_X,
        FRONT_VIEW_Y: tierData.FRONT_VIEW_Y,
        X_FIELD: tierData.X,
        Y_FIELD: tierData.Y,
        PARENT_LOCKR_CD: tierData.PARENT_LOCKR_CD
      });
      
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
      
      console.log(`[API] INSERT VALUES for tier ${i}:`, {
        X_position: insertValues[4],
        Y_position: insertValues[5],
        FRONT_VIEW_X_position: insertValues[9],
        FRONT_VIEW_Y_position: insertValues[10],
        PARENT_LOCKR_CD_position: insertValues[14]
      });
      
      const [result] = await pool.query(insertQuery, insertValues);
      
      // 저장 직후 DB에서 다시 조회하여 확인
      const [savedTier] = await pool.query(
        'SELECT LOCKR_CD, LOCKR_LABEL, X, Y, FRONT_VIEW_X, FRONT_VIEW_Y, PARENT_LOCKR_CD FROM lockrs WHERE LOCKR_CD = ?',
        [result.insertId]
      );
      
      console.log(`[API CRITICAL] ⚠️ TIER ${i} DB VERIFICATION:`, {
        tierLabel: savedTier[0].LOCKR_LABEL,
        savedInDB: {
          LOCKR_CD: savedTier[0].LOCKR_CD,
          X: savedTier[0].X,
          Y: savedTier[0].Y,
          FRONT_VIEW_X: savedTier[0].FRONT_VIEW_X,
          FRONT_VIEW_Y: savedTier[0].FRONT_VIEW_Y,
          PARENT_LOCKR_CD: savedTier[0].PARENT_LOCKR_CD
        },
        expected: {
          FRONT_VIEW_X: tierFrontViewX,
          FRONT_VIEW_Y: Math.round(tierFrontViewY),
          PARENT_X: parentFrontX,
          PARENT_Y: parentFrontY
        },
        validation: {
          xMatch: savedTier[0].FRONT_VIEW_X === tierFrontViewX ? 
            `✅ X CORRECT (${savedTier[0].FRONT_VIEW_X})` : 
            `❌❌❌ X WRONG: Saved ${savedTier[0].FRONT_VIEW_X}, Expected ${tierFrontViewX}, Diff: ${savedTier[0].FRONT_VIEW_X - tierFrontViewX}`,
          yMatch: savedTier[0].FRONT_VIEW_Y === Math.round(tierFrontViewY) ? 
            `✅ Y CORRECT (${savedTier[0].FRONT_VIEW_Y})` : 
            `❌❌❌ Y WRONG: Saved ${savedTier[0].FRONT_VIEW_Y}, Expected ${Math.round(tierFrontViewY)}, Diff: ${savedTier[0].FRONT_VIEW_Y - Math.round(tierFrontViewY)}`,
          parentCheck: `Parent ${parentLocker.LOCKR_LABEL} at (${parentFrontX}, ${parentFrontY})`
        }
      });
      
      newTiers.push({ ...tierData, LOCKR_CD: result.insertId });
    }
    
    console.log(`[API] Added ${tierCount} tiers to locker ${lockrCd}`);
    
    // 응답 직전 최종 데이터 확인
    console.log('[API] RESPONSE DATA - newTiers array:');
    newTiers.forEach((tier, index) => {
      console.log(`  Tier ${index + 1}:`, {
        LOCKR_CD: tier.LOCKR_CD,
        LOCKR_LABEL: tier.LOCKR_LABEL,
        X: tier.X,
        Y: tier.Y,
        FRONT_VIEW_X: tier.FRONT_VIEW_X,
        FRONT_VIEW_Y: tier.FRONT_VIEW_Y,
        PARENT_LOCKR_CD: tier.PARENT_LOCKR_CD
      });
    });
    
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