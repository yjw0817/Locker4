# 좌측→우측 스냅핑 간격 문제 디버깅 가이드

## 추가된 디버깅 로그

### 1. 스냅 함수 진입점 (라인 3873-3893)
```
=== SNAP TO ADJACENT CALLED ===
Input position: { x, y }
Input size: { width, height }
SNAP_THRESHOLD: 20 (임시로 12→20 증가)
Calculated dragBounds: {...}
```

### 2. 상세 Gap 계산 로그 (라인 3901-3930)
```
=== SNAP GAP CALCULATION DEBUG ===
--- DRAG BOUNDS ---
dragBounds.x: [값]
dragBounds.width: [값]
--- EXISTING LOCKER BOUNDS ---
lockerX: [값]
lockerWidth: [값]
--- GAP CALCULATIONS ---
RIGHT GAP RESULT: [값]
LEFT GAP RESULT: [값]
--- THRESHOLD CHECK ---
rightGap < SNAP_THRESHOLD? true/false
leftGap < SNAP_THRESHOLD? true/false
```

### 3. 스냅 트리거 로그
```
>>> RIGHT SNAP TRIGGERED! <<<
또는
>>> LEFT SNAP TRIGGERED! <<<
```

## 테스트 시나리오

### 시나리오 A: 좌측→우측 스냅 (문제 상황)
1. L4를 L1의 **왼쪽**에서 시작
2. L1의 **오른쪽**으로 천천히 드래그
3. 콘솔 로그 관찰:
   - rightGap 값이 어떻게 변하는지
   - SNAP_THRESHOLD(20)에 도달하는지
   - 스냅이 트리거되는지

### 시나리오 B: 우측→좌측 스냅 (정상 작동)
1. L4를 L1의 **오른쪽**에서 시작
2. L1의 **왼쪽**으로 천천히 드래그
3. 콘솔 로그 관찰:
   - leftGap 값이 어떻게 변하는지
   - 스냅이 정상 작동하는지

## 분석 포인트

### 1. Gap 값 비교
- rightGap이 예상보다 큰 값을 가지는가?
- 락커 하나 크기(40px?) 정도의 간격이 있을 때 gap 값은?

### 2. DragBounds 정확성
- dragBounds.x가 실제 드래그 위치와 일치하는가?
- dragBounds.width가 락커 크기와 일치하는가?

### 3. 계산식 검증
```javascript
// RIGHT GAP (좌→우 이동 시)
rightGap = Math.abs((lockerX + lockerWidth) - dragBounds.x)
// 예: L1이 100에 있고 width가 40이면, L1 우측은 140
// L4를 140 근처로 가져가면 rightGap이 0에 가까워져야 함

// LEFT GAP (우→좌 이동 시)  
leftGap = Math.abs(lockerX - (dragBounds.x + dragBounds.width))
// 예: L1이 100에 있으면, L1 좌측은 100
// L4(width 40)를 60으로 가져가면 leftGap이 0에 가까워져야 함
```

## 예상 문제 원인

### 가능성 1: DragBounds 계산 오류
- 회전이 0인데도 bounds가 잘못 계산됨
- 스케일 적용 문제

### 가능성 2: Gap 계산 로직 오류
- rightGap 계산식이 잘못됨
- 절댓값 처리 문제

### 가능성 3: 임계값 부족
- 12px가 너무 작아서 감지 못함
- 현재 20px로 증가시켜 테스트

## 수정 방향

### Option 1: 임계값 조정
```javascript
const SNAP_THRESHOLD = 30  // 더 큰 값으로 테스트
```

### Option 2: Gap 계산 수정
```javascript
// 현재 방식이 맞는지 재검토
const rightGap = Math.abs((lockerX + lockerWidth) - dragBounds.x)
```

### Option 3: 특별 케이스 처리
```javascript
// 좌→우 이동 시 특별 처리
if (movingFromLeft && rightGap < SNAP_THRESHOLD * 1.5) {
  // 스냅 적용
}
```

## 테스트 후 조치
1. 콘솔 로그 수집
2. rightGap 값 패턴 분석
3. 임계값 또는 계산식 수정
4. 수정 후 재테스트