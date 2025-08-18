# 🔧 회전 애니메이션 CSS 충돌 버그 수정

## 🐛 문제점 발견
`LockerPlacementFigma.vue` 파일의 1750-1754줄에 있는 CSS가 `LockerSVG.vue` 컴포넌트의 스타일을 덮어쓰면서 회전 애니메이션 버그를 일으켰습니다.

### 충돌 코드 위치
**파일**: `frontend/src/pages/LockerPlacementFigma.vue`  
**위치**: 1750-1754줄

```css
/* 문제가 되는 코드 */
.locker-svg {
  transition: transform 0.2s ease-out;
}
```

### 문제 발생 원인
1. **스타일 우선순위**: 페이지 레벨의 CSS가 컴포넌트 CSS를 덮어씀
2. **Transform 강제 적용**: 모든 transform 변화에 transition이 강제 적용됨
3. **역회전 발생**: 315° ↔ 0° 전환 시 CSS가 최단 경로로 회전시킴

## ✅ 해결 방법

### CSS 규칙 제거
충돌하는 CSS 규칙을 주석 처리하여 해결:

```css
/* 락커 정렬 애니메이션 */
/* 주석 처리: LockerSVG.vue의 transition 설정과 충돌하여 회전 애니메이션 버그 발생
.locker-svg {
  transition: transform 0.2s ease-out;
}
*/

.locker-svg.aligning {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 해결 결과
- ✅ LockerSVG.vue의 transition 설정이 정상 작동
- ✅ 315° ↔ 0° 전환 시 역회전 없음
- ✅ 정렬 애니메이션은 `.aligning` 클래스로 정상 작동

## 📋 테스트 완료

### 회전 테스트
- [x] R키 8번 연속 누르기 (360도 회전) - 역회전 없음
- [x] 315° → 0° 전환 - 부드러운 정방향 회전
- [x] 0° → 315° 전환 - 부드러운 역방향 회전
- [x] 시계/반시계 버튼 클릭 - 정상 작동

### 기능 테스트
- [x] 자동 정렬 기능 - 정상 작동
- [x] 드래그 & 드롭 - 정상 작동
- [x] 다중 선택 회전 - 정상 작동

## 🎯 핵심 교훈

### CSS 충돌 방지 원칙
1. **컴포넌트 스타일 우선**: 컴포넌트 내부에서 스타일 관리
2. **특정 클래스 사용**: 범용 선택자 대신 특정 클래스 사용
3. **스코프 분리**: 페이지와 컴포넌트 스타일 명확히 분리

### 올바른 접근 방법
```css
/* ❌ 잘못된 방법 - 너무 광범위 */
.locker-svg {
  transition: transform 0.2s ease-out;
}

/* ✅ 올바른 방법 - 특정 상황에만 적용 */
.locker-svg.aligning {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 📦 영향받은 파일

### 수정된 파일
- `/frontend/src/pages/LockerPlacementFigma.vue`
  - 1750-1754줄 CSS 주석 처리

### 관련 파일 (수정 없음)
- `/frontend/src/components/locker/LockerSVG.vue`
  - 이제 자체 transition 설정이 정상 작동

## 🔍 디버깅 팁

### CSS 충돌 확인 방법
```javascript
// 브라우저 콘솔에서 실행
const locker = document.querySelector('.locker-svg')
console.log(getComputedStyle(locker).transition)
// 예상 결과: "opacity 0.2s ease, filter 0.2s ease"
// 충돌 시: "transform 0.2s ease-out"
```

## 📌 접속 주소
**http://localhost:3000**

## ✨ 개선 효과

### Before (버그 있음)
- 315° → 0° 회전 시 -315도 역회전
- 0° → 315° 회전 시 +315도 역회전
- 시각적으로 어색한 회전 애니메이션

### After (수정됨)
- 모든 회전이 의도한 방향으로 진행
- 부드럽고 자연스러운 회전 애니메이션
- 정렬 기능과 회전 기능이 독립적으로 작동

## 🚀 결론
단순한 CSS 한 줄이 전체 회전 시스템을 망가뜨릴 수 있다는 것을 보여주는 사례입니다. 
컴포넌트 기반 개발에서는 스타일 스코프 관리가 매우 중요합니다.