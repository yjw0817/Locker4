# 우측 스냅 버그 디버깅 테스트 가이드

## 테스트 준비
1. 브라우저에서 F12를 눌러 개발자 도구 콘솔 열기
2. 콘솔 필터에 "DEBUG" 입력하여 디버깅 로그만 보기

## 테스트 시나리오

### 시나리오 1: 우측 스냅 테스트
1. L4를 드래그하여 L1의 우측에 배치 시도
2. 콘솔에서 다음 로그 확인:
   - `[SNAP DEBUG]` - 스냅 감지 정보
   - `[SNAP DEBUG - RIGHT]` - 우측 스냅 계산 과정
   - `[SNAP DEBUG - FINAL]` - 최종 스냅 위치
   - `[COLLISION DEBUG]` - 충돌 감지 결과
   - `[COLLISION ADJUSTMENT DEBUG]` - 충돌 조정 시도

### 시나리오 2: 좌측 스냅 테스트 (비교용)
1. L4를 드래그하여 L1의 좌측에 배치 시도
2. 콘솔에서 다음 로그 확인:
   - `[SNAP DEBUG - LEFT]` - 좌측 스냅 계산 과정
   - 좌측과 우측의 계산 차이 비교

## 디버깅 로그 분석 포인트

### 1. 스냅 계산 검증
```javascript
[SNAP DEBUG - RIGHT] Snap calculation: {
  formula: 'x + (lockerX + lockerWidth - dragBounds.x)',
  values: // 실제 값들
  result: // 계산 결과
  expectedPosition: // 예상 위치
  adjustment: // 조정값
}
```

### 2. 충돌 감지 확인
```javascript
[COLLISION DEBUG - DETECTED] Collision found: {
  movingLocker: // 움직이는 락커 경계
  existingLocker: // 기존 락커 경계
  overlap: { x, y } // 겹침 정도
}
```

### 3. 충돌 조정 과정
```javascript
[COLLISION ADJUSTMENT DEBUG] Testing adjustments...
// 각 조정 시도와 결과
```

## 예상 문제점 확인

### A. dragBounds 계산 문제
- `dragBounds.x`가 실제 락커 위치와 일치하는가?
- 회전된 락커의 경계가 올바르게 계산되는가?

### B. 스냅 수식 문제
- 우측 스냅: `x + (lockerX + lockerWidth - dragBounds.x)`
- 좌측 스냅: `x + (lockerX - dragBounds.width - dragBounds.x)`
- 두 수식이 대칭적으로 올바른가?

### C. 충돌 감지 민감도
- 0px gap으로 인한 미세한 겹침 감지
- 부동소수점 연산 오차

## 수정 방향

### Option 1: 충돌 감지 허용 오차 추가
```javascript
const COLLISION_TOLERANCE = 0.1 // 0.1px 이하는 충돌로 간주하지 않음
const hasOverlap = overlapX > COLLISION_TOLERANCE && overlapY > COLLISION_TOLERANCE
```

### Option 2: 스냅 계산 보정
```javascript
// 우측 스냅 시 미세 조정
snappedX = Math.round(x + (lockerX + lockerWidth - dragBounds.x))
```

### Option 3: dragBounds 계산 방식 개선
- getRotatedBounds 함수 검증
- 정수로 반올림하여 부동소수점 오차 제거

## 테스트 후 조치
1. 콘솔 로그 수집
2. 우측과 좌측 스냅 계산 비교
3. 충돌 감지 패턴 분석
4. 근본 원인 파악 후 수정