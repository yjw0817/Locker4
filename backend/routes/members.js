const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// 회원 검색 API
router.get('/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ 
      error: '검색어는 최소 2자 이상이어야 합니다.' 
    });
  }

  try {
    const searchPattern = `%${query}%`;
    
    const sql = `
      SELECT DISTINCT 
        MEM_NM, 
        MEM_ID, 
        MEM_SNO, 
        MEM_TELNO, 
        MEM_GENDR
      FROM cur_available_locker_user
      WHERE 
        MEM_NM LIKE ? OR 
        MEM_ID LIKE ? OR 
        MEM_TELNO LIKE ?
      LIMIT 20
    `;
    
    const members = await db.query(sql, [searchPattern, searchPattern, searchPattern]);
    
    // 전화번호 포맷팅
    const formattedMembers = members.map(member => ({
      id: member.MEM_SNO,
      memberId: member.MEM_ID,
      name: member.MEM_NM,
      phone: formatPhoneNumber(member.MEM_TELNO),
      gender: member.MEM_GENDR
    }));
    
    res.json(formattedMembers);
  } catch (error) {
    console.error('회원 검색 오류:', error);
    res.status(500).json({ 
      error: '회원 검색 중 오류가 발생했습니다.' 
    });
  }
});

// 회원 이용권 조회 API
router.get('/:memSno/vouchers', async (req, res) => {
  const { memSno } = req.params;
  
  if (!memSno) {
    return res.status(400).json({ 
      error: '회원 번호가 필요합니다.' 
    });
  }

  try {
    const sql = `
      SELECT 
        SELL_EVENT_NM, 
        CUR_LOCKR_INFO, 
        LOCKR_CD,
        USE_PROD,
        USE_UNIT
      FROM cur_available_locker_user
      WHERE MEM_SNO = ?
    `;
    
    const vouchers = await db.query(sql, [memSno]);
    
    // 이용권 정보 포맷팅
    const formattedVouchers = vouchers.map((voucher, index) => ({
      id: `v${index + 1}`,
      name: voucher.SELL_EVENT_NM,
      lockerInfo: voucher.CUR_LOCKR_INFO,
      lockerCode: voucher.LOCKR_CD,
      period: voucher.USE_PROD,
      unit: voucher.USE_UNIT,
      remainingDays: calculateRemainingDays(voucher.USE_PROD, voucher.USE_UNIT),
      displayName: formatVoucherName(voucher.SELL_EVENT_NM, voucher.USE_PROD, voucher.USE_UNIT)
    }));
    
    res.json(formattedVouchers);
  } catch (error) {
    console.error('이용권 조회 오류:', error);
    res.status(500).json({ 
      error: '이용권 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 전화번호 포맷팅 함수
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');
  
  // 한국 전화번호 포맷
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
}

// 남은 일수 계산 함수
function calculateRemainingDays(period, unit) {
  if (!period || !unit) return 0;
  
  const periodNum = parseInt(period);
  
  if (unit === 'M') {
    // 월 단위인 경우 30일로 계산
    return periodNum * 30;
  } else if (unit === 'D') {
    // 일 단위
    return periodNum;
  }
  
  return 0;
}

// 이용권 이름 포맷팅 함수
function formatVoucherName(name, period, unit) {
  if (!name) return '이용권';
  
  let periodText = '';
  if (period && unit) {
    if (unit === 'M') {
      periodText = ` (${period}개월)`;
    } else if (unit === 'D') {
      periodText = ` (${period}일)`;
    }
  }
  
  return name + periodText;
}

module.exports = router;