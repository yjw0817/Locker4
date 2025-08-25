# 그룹 회전 중심점 고정 수정

## 🔧 해결한 문제

### 다중 선택시 회전 중심점 변동 문제 ✅

**문제 원인:**
- 매번 `handleRotateMove`에서 그룹 중심점을 다시 계산
- 회전으로 각 락커의 위치가 변경된 후, 변경된 위치로 중심점 재계산
- 결과적으로 회전 중심이 계속 이동하여 불안정한 회전 발생

**해결책:**
1. **회전 시작시 중심점 고정**
   - `startRotateLocker`에서 그룹 중심점을 한 번만 계산
   - 각 락커의 초기 상대 위치 저장
   
2. **회전 중 고정값 사용**
   - `handleRotateMove`에서 저장된 고정 중심점 사용
   - 초기 상대 위치를 기준으로 회전 변환
   
3. **회전 종료시 정리**
   - `handleRotateEnd`에서 그룹 회전 상태 초기화

## 📝 주요 코드 변경

### 그룹 회전 상태 저장 (startRotateLocker)
```typescript
// 그룹 중심점 계산 (한 번만)
const centerX = (bounds.minX + bounds.maxX) / 2
const centerY = (bounds.minY + bounds.maxY) / 2

// 각 락커의 초기 상대 위치 저장
const lockerStates = new Map()
selectedLockers.forEach(l => {
  lockerStates.set(l.id, {
    relativeX: lockerCenterX - centerX,
    relativeY: lockerCenterY - centerY,
    width: dims.width,
    height: dims.height,
    initialRotation: l.rotation || 0
  })
})

// 그룹 회전 상태 저장
groupRotationState.value = {
  centerX,
  centerY,
  lockerStates,
  leaderId: locker.id
}
```

### 고정 중심점으로 회전 (handleRotateMove)
```typescript
// 저장된 고정 중심점 사용
const centerX = state.centerX
const centerY = state.centerY

// 초기 상대 위치를 회전
const newCenterX = lockerState.relativeX * cos - lockerState.relativeY * sin + centerX
const newCenterY = lockerState.relativeX * sin + lockerState.relativeY * cos + centerY
```

## ✅ 개선 결과

- **고정된 회전 중심**: 회전 중 중심점이 변동되지 않음
- **안정적인 그룹 회전**: 위치 이동 없이 정확한 회전
- **예측 가능한 동작**: 사용자 의도대로 작동

## 🧪 테스트 방법

1. Ctrl+클릭으로 여러 락커 선택
2. 회전 핸들로 그룹 회전
3. 확인사항:
   - 회전 중심이 고정되어 있는지
   - 락커들이 위치 이동 없이 회전하는지
   - 360도 이상 회전시에도 안정적인지