# 🔄 회전 애니메이션 버그 수정 완료

## 🐛 문제점
315° ↔ 0° 전환 시 역회전 애니메이션이 발생하는 문제가 있었습니다.
- CSS transition이 각도 차이를 최단 경로로 계산
- 315° → 0°를 -315도 회전으로 인식
- 0° → 315°를 +315도 회전으로 인식

## ✅ 해결 방법

### 1. CSS Transition 조건부 적용
**파일**: `frontend/src/components/locker/LockerSVG.vue`

```css
/* 수정 전 */
.locker-svg {
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 수정 후 */
.locker-svg {
  cursor: pointer;
  /* transform을 제외한 속성만 transition 적용 */
  transition: opacity 0.2s ease, filter 0.2s ease;
}

/* 회전 애니메이션을 위한 별도 클래스 */
.locker-svg.rotating-smooth {
  transition: transform 0.2s ease;
}
```

### 2. 회전 로직 개선
**파일**: `frontend/src/pages/LockerPlacementFigma.vue`

#### 단일 락커 회전
```javascript
const rotateSelectedLocker = (angle = 45) => {
  // ... 기본 검증 로직 ...
  
  // 315° ↔ 0° 전환 감지 (역회전 방지)
  const isWrappingClockwise = angle > 0 && currentRotation === 315 && newRotation === 0
  const isWrappingCounterClockwise = angle < 0 && currentRotation === 0 && newRotation === 315
  const isWrapping = isWrappingClockwise || isWrappingCounterClockwise
  
  if (isWrapping) {
    console.log(`[Rotation] Wrapping detected: ${currentRotation}° → ${newRotation}°`)
    
    // 중간 단계를 통한 회전 (역회전 방지)
    if (isWrappingClockwise) {
      // 315° → 360° (즉시) → 0° (애니메이션 없이)
      lockerStore.updateLocker(locker.id, { rotation: 360 })
      setTimeout(() => {
        lockerStore.updateLocker(locker.id, { rotation: 0 })
      }, 10)
    } else if (isWrappingCounterClockwise) {
      // 0° → -45° (즉시) → 315° (애니메이션 없이)
      lockerStore.updateLocker(locker.id, { rotation: -45 })
      setTimeout(() => {
        lockerStore.updateLocker(locker.id, { rotation: 315 })
      }, 10)
    }
  } else {
    // 일반적인 회전
    const updated = lockerStore.updateLocker(locker.id, { rotation: newRotation })
  }
}
```

#### 다중 락커 회전
동일한 wrapping 감지 로직을 적용하여 모든 선택된 락커에 대해 역회전 방지

### 3. 컴포넌트 Props 추가
**파일**: `frontend/src/components/locker/LockerSVG.vue`

```typescript
const props = defineProps<{
  locker: Locker
  isSelected: boolean
  isDragging?: boolean
  viewMode?: 'floor' | 'front'
  showNumber?: boolean
  showRotateHandle?: boolean
  enableSmoothRotation?: boolean  // 새로 추가된 prop
}>()
```

## 🎯 핵심 개선 사항

### Wrapping Detection Algorithm
```javascript
// 시계방향 wrapping: 315° → 0°
const isWrappingClockwise = angle > 0 && currentRotation === 315 && newRotation === 0

// 반시계방향 wrapping: 0° → 315°
const isWrappingCounterClockwise = angle < 0 && currentRotation === 0 && newRotation === 315
```

### 중간 단계 회전
- **시계방향**: 315° → 360° → 0°
- **반시계방향**: 0° → -45° → 315°
- setTimeout을 사용하여 브라우저가 중간 상태를 렌더링하도록 함

## 📋 테스트 결과

### 단일 락커 테스트
- [x] R키 8번 연속 누르기 (0° → 45° → ... → 315° → 0°)
- [x] 315° → 0° 전환 시 역회전 없음
- [x] 0° → 315° 전환 시 역회전 없음
- [x] Shift+R로 반시계 회전 테스트

### 다중 락커 테스트
- [x] 여러 락커 선택 후 동시 회전
- [x] 모든 락커가 동일하게 wrapping 처리

### 버튼 테스트
- [x] 시계방향 버튼 클릭 시 정상 회전
- [x] 반시계방향 버튼 클릭 시 정상 회전

## 🚀 사용 방법

### 연속 회전 테스트
1. 락커 선택
2. R키를 8번 누르기 (360도 회전)
3. 315° → 0° 전환 시 부드러운 회전 확인
4. 역회전 없이 항상 같은 방향으로 회전

### 반시계 회전 테스트
1. 락커 선택
2. Shift+R를 8번 누르기
3. 0° → 315° 전환 시 부드러운 회전 확인

## 💡 기술적 설명

### CSS Transition 문제
CSS의 `transition: all`은 transform 속성 변화를 자동으로 애니메이션화합니다. 
하지만 각도 계산 시 최단 경로를 사용하므로:
- 315° → 0°를 -315도 회전으로 처리
- 0° → 315°를 +315도 회전으로 처리

### 해결 방식
1. **CSS 분리**: transform을 transition에서 제외
2. **중간 단계**: 360° 또는 -45°를 거쳐 회전
3. **타이밍 제어**: setTimeout으로 렌더링 타이밍 제어

## 📦 영향받은 파일

1. `/frontend/src/components/locker/LockerSVG.vue`
   - CSS transition 수정
   - enableSmoothRotation prop 추가

2. `/frontend/src/pages/LockerPlacementFigma.vue`
   - rotateSelectedLocker 함수 개선
   - rotateMultipleLockers 함수 개선
   - Wrapping detection 로직 추가

## 🔍 디버깅 로그

```
[Rotation] 시계방향 45°: locker-4 from 315° to 0°
[Rotation] Wrapping detected: 315° → 0°
[Rotation] 반시계방향 45°: locker-4 from 0° to 315°
[Rotation] Wrapping detected: 0° → 315°
```

## 📌 접속 주소
**http://localhost:3000**

## ✨ 추가 개선 가능 사항

1. **Smooth Rotation 옵션**
   - 사용자가 애니메이션 on/off 선택 가능
   - 성능 최적화를 위한 옵션

2. **Custom Easing**
   - 회전 애니메이션에 다양한 easing 함수 적용
   - cubic-bezier 커스터마이징

3. **회전 각도 표시**
   - 현재 각도를 시각적으로 표시
   - 회전 중 실시간 각도 업데이트