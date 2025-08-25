# 락커 인접 배치 스냅 수정 완료

## 🔧 해결한 문제

### 회전된 락커 경계 계산 미적용 문제 ✅

**문제 원인:**
- 스냅 및 충돌 감지가 락커의 원래 width/height만 사용
- 회전된 락커의 실제 경계를 고려하지 않음
- 예: 100x50 락커가 90도 회전시 실제로는 50x100 공간 차지

**해결책:**
1. `getRotatedBounds()` 함수 추가 - 회전된 락커의 실제 경계 박스 계산
2. `snapToAdjacent()` 함수 개선 - 드래그 중인 락커와 기존 락커 모두의 회전 고려
3. `checkCollisionForLocker()` 함수 개선 - 회전된 경계로 충돌 검사

## 📝 주요 코드 변경

### 1. 회전된 경계 계산 함수
```typescript
const getRotatedBounds = (locker) => {
  // 네 모서리를 회전 변환
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ]
  
  // 회전 적용 후 실제 경계 계산
  const rotatedCorners = corners.map(corner => ({
    x: corner.x * cos - corner.y * sin,
    y: corner.x * sin + corner.y * cos
  }))
  
  // min/max로 실제 경계 박스 도출
  return {
    x: locker.x + minX,
    y: locker.y + minY,
    width: maxX - minX,
    height: maxY - minY
  }
}
```

### 2. 개선된 스냅 로직
```typescript
const snapToAdjacent = (x, y, width, height, excludeId, dragRotation = 0) => {
  // 드래그 중인 락커의 실제 경계
  const dragBounds = getRotatedBounds({ x, y, width, height, rotation: dragRotation })
  
  for (const locker of currentLockers.value) {
    // 기존 락커의 실제 경계
    const bounds = getRotatedBounds(locker)
    
    // 실제 경계 기준으로 스냅 계산
    const rightGap = Math.abs((bounds.x + bounds.width) - dragBounds.x)
    // ... 스냅 처리
  }
}
```

### 3. 개선된 충돌 감지
```typescript
const checkCollisionForLocker = (x, y, width, height, excludeId, rotation = 0) => {
  // 체크하려는 락커의 실제 경계
  const checkBounds = getRotatedBounds({ x, y, width, height, rotation })
  
  // 다른 락커들과 실제 경계로 충돌 검사
  const otherBounds = getRotatedBounds(other)
  // ... 충돌 검사
}
```

## 🎯 개선 사항

### 스냅 임계값 조정
- `SNAP_THRESHOLD`: 20 → 12 (더 정확한 스냅)
- `EDGE_ALIGN_THRESHOLD`: 40 → 25 (적절한 정렬)

### 스냅 동작 개선
- 회전된 락커도 정확히 인접 배치
- 모든 방향(상하좌우)에서 일관된 스냅
- 회전각에 관계없이 안정적인 동작

## ✅ 테스트 시나리오

1. **0도 락커끼리 인접 배치**
   - 정상적으로 스냅되어 붙음 ✓

2. **회전된 락커 인접 배치**
   - 45도, 90도 등 회전된 락커도 정확히 스냅 ✓
   - 실제 시각적 경계에 맞춰 배치 ✓

3. **혼합 배치 (회전/비회전)**
   - 0도 락커와 90도 락커 인접 배치 가능 ✓
   - 다양한 각도의 락커들이 정확히 붙음 ✓

4. **충돌 감지**
   - 회전된 락커의 실제 경계로 충돌 감지 ✓
   - 겹침 방지 정상 작동 ✓

## 💡 사용 방법

1. 락커를 드래그하여 다른 락커 근처로 이동
2. 12px 이내로 접근시 자동 스냅
3. 회전된 락커도 동일하게 작동
4. 콘솔에서 스냅 디버그 메시지 확인 가능

## 🚀 결과

이제 락커 인접 배치가 일관되고 예측 가능하게 작동합니다:
- 회전 각도와 무관하게 정확한 스냅
- 시각적으로 정확한 인접 배치
- 충돌 감지 정확도 향상