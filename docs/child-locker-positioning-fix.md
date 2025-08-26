# 자식 락커 위치 계산 수정 문서

## 문제 상황 (2025-08-26)

### 발생한 문제
세로배치 모드에서 부모 락커에 단수(층)를 추가할 때, 자식 락커의 위치가 잘못 계산되는 문제가 발생했습니다.

**잘못된 결과:**
- 부모 락커 L3: `frontViewX=680, frontViewY=490`
- 자식 락커 L3-T1: `frontViewX=740, frontViewY=490` ❌
  - X 좌표가 +60px 증가 (부모와 달라짐)
  - Y 좌표가 같음 (위로 올라가지 않음)

**올바른 결과:**
- 부모 락커 L3: `frontViewX=680, frontViewY=490`
- 자식 락커 L3-T1: `frontViewX=680, frontViewY=430` ✅
  - X 좌표가 부모와 동일
  - Y 좌표가 부모보다 60px 위 (바로 붙어서)

### 원인 분석

#### 1. 백엔드 tier 생성은 정상 작동
- `backend/routes/lockers.js`의 tier 생성 로직은 올바르게 작동
- X 좌표: `tierFrontViewX = parentFrontX` (부모와 동일)
- Y 좌표: `tierFrontViewY = parentFrontY - (scaledTierHeight + scaledGap) * i` (위로 배치)

#### 2. 문제는 프론트엔드 재배치 로직
`transformToFrontViewNew()` 함수에서 모든 락커(부모+자식)를 하나의 시퀀스로 처리하면서 자식 락커의 위치를 재계산하는 과정에서 문제 발생:

```javascript
// 기존 잘못된 로직
allLockersSequence.forEach((locker, index) => {
  // 모든 락커를 순서대로 배치
  lockerStore.updateLocker(locker.id, {
    frontViewX: currentX,        // ❌ 자식도 순서대로 배치
    frontViewY: FLOOR_Y - height, // ❌ 같은 높이로 배치
    frontViewRotation: 0
  })
  currentX += width // 다음 위치로 이동
})
```

## 해결 방법

### 수정된 로직
`frontend/src/pages/LockerPlacementFigma.vue` 파일의 `transformToFrontViewNew()` 함수 내부 수정:

```javascript
// 수정된 로직: 자식 락커 별도 처리
if (locker.parentLockrCd) {
  // 자식 락커는 부모 락커 위치 기반으로 계산
  const parentLocker = renderData.find(r => r.lockrCd === locker.parentLockrCd)
  if (parentLocker) {
    const TIER_HEIGHT = 30
    const TIER_GAP = 0  // 부모 락커와 바로 붙임
    const scaledTierHeight = TIER_HEIGHT * LOCKER_VISUAL_SCALE
    const tierLevel = locker.tierLevel || 1
    
    // 자식 락커는 부모와 같은 X, 위쪽 Y 좌표 (gap 없이)
    const childX = parentLocker.frontViewX  // 부모와 동일한 X
    const childY = parentLocker.frontViewY - scaledTierHeight * tierLevel  // 위쪽으로
    
    // 자식 락커 위치 업데이트
    lockerStore.updateLocker(locker.id, {
      frontViewX: childX,
      frontViewY: childY,
      frontViewRotation: 0
    })
    
    // 자식 락커는 currentX를 증가시키지 않음 (부모 위에 스택)
  }
} else {
  // 부모 락커는 기존 로직 사용
  lockerStore.updateLocker(locker.id, {
    frontViewX: currentX,
    frontViewY: FLOOR_Y - height,
    frontViewRotation: 0
  })
  
  currentX += width // 락커 너비만큼 이동
}
```

### 핵심 수정 사항

1. **자식 락커 감지**: `locker.parentLockrCd` 존재 여부로 자식 락커 판별
2. **부모 락커 참조**: `renderData`에서 부모 락커 정보 조회
3. **X 좌표**: 부모 락커와 정확히 동일한 X 좌표 사용
4. **Y 좌표**: 부모 락커보다 `scaledTierHeight * tierLevel`만큼 위에 배치
5. **gap 제거**: `TIER_GAP = 0`으로 설정하여 부모와 바로 붙임
6. **currentX 관리**: 자식 락커는 부모 위에 스택되므로 가로 공간을 차지하지 않음

## 테스트 결과

### 수정 전
```
L3:    frontViewX=680, frontViewY=490
L3-T1: frontViewX=740, frontViewY=490  ❌ 잘못된 위치
```

### 수정 후
```
L3:    frontViewX=680, frontViewY=490
L3-T1: frontViewX=680, frontViewY=430  ✅ 올바른 위치
```

## 관련 파일

### 수정된 파일
- `frontend/src/pages/LockerPlacementFigma.vue`
  - `transformToFrontViewNew()` 함수 내 자식 락커 위치 계산 로직

### 영향받지 않은 파일 (정상 작동)
- `backend/routes/lockers.js` - tier 생성 API
- `frontend/src/services/lockerApi.ts` - API 서비스

## 주의사항

1. **자식 락커는 항상 부모 기준으로 계산**: 절대 좌표가 아닌 상대 좌표 사용
2. **tierLevel 고려**: 여러 층의 자식 락커가 있을 때 레벨별로 위치 계산
3. **중앙 정렬 유지**: 부모가 중앙 정렬될 때 자식도 함께 이동
4. **Visual Scale 적용**: `LOCKER_VISUAL_SCALE = 2.0` 적용하여 실제 크기와 화면 표시 크기 구분

## 디버깅 로그

콘솔에서 확인 가능한 로그:
```javascript
[CHILD POSITION] L3-T1 (child of L3): {
  parentX: 680,
  parentY: 490,
  childX: 680,
  childY: 430,
  tierLevel: 1,
  calculation: "490 - 60 * 1 = 430 (no gap)"
}
```

이 문서는 향후 유사한 문제 발생 시 참조용으로 사용하시기 바랍니다.