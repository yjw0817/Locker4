# Vue.js Debugging Setup

## VS Code 디버깅 설정 완료

Vue 3 + Vite 프로젝트를 VS Code에서 디버깅할 수 있도록 설정이 완료되었습니다.

## 사용 방법

### 1. Chrome 디버깅 (권장)
1. VS Code 디버깅 패널 열기 (Ctrl+Shift+D 또는 사이드바에서 벌레 아이콘 클릭)
2. 상단 드롭다운에서 **"Frontend: Chrome (Vue 3 + Vite)"** 선택
3. F5 키 또는 녹색 실행 버튼 클릭
4. Chrome이 자동으로 열리며 DevTools도 함께 열립니다
5. VS Code에서 브레이크포인트 설정 가능

### 2. Chrome에 연결 (이미 실행 중인 Chrome)
1. Chrome을 디버그 모드로 실행:
   ```bash
   chrome.exe --remote-debugging-port=9222
   ```
2. VS Code에서 **"Frontend: Chrome (Attach)"** 선택
3. F5 키로 연결

### 3. Edge 디버깅
1. **"Frontend: Edge (Vue 3 + Vite)"** 선택
2. F5 키로 실행

### 4. Firefox 디버깅
1. **"Frontend: Firefox (Vue 3 + Vite)"** 선택
2. F5 키로 실행

### 5. Full Stack 디버깅
1. **"Full Stack"** 선택 - Backend와 Frontend를 동시에 디버깅
2. F5 키로 실행

## 브레이크포인트 설정

### Vue 컴포넌트 디버깅
- `.vue` 파일의 `<script>` 섹션에서 원하는 라인 번호 왼쪽 클릭
- 빨간 점이 나타나면 브레이크포인트 설정 완료
- 해당 코드 실행 시 자동으로 중단됨

### 디버깅 가능한 위치
- Vue 컴포넌트의 methods
- Computed properties
- Watch handlers  
- Lifecycle hooks (mounted, created, etc.)
- Event handlers

## 주요 sourceMapPathOverrides 설정

Vite 프로젝트에 최적화된 경로 매핑:
- `/@fs/*`: Vite의 파일 시스템 경로
- `/src/*`: 소스 코드 경로
- `webpack:///src/*`: Webpack 호환성

## 문제 해결

### 브레이크포인트가 작동하지 않을 때
1. Vite 서버가 실행 중인지 확인 (`npm run dev`)
2. Source maps가 활성화되어 있는지 확인
3. Chrome DevTools에서 Settings → Preferences → Sources → "Enable JavaScript source maps" 체크
4. VS Code 재시작 후 다시 시도

### 경로 매핑 문제
- `webRoot`가 `/frontend`로 올바르게 설정되어 있는지 확인
- Vite 설정에서 source map이 활성화되어 있는지 확인

## 유용한 디버깅 팁

1. **조건부 브레이크포인트**: 브레이크포인트 우클릭 → "Edit Breakpoint" → 조건 입력
2. **로그포인트**: 브레이크포인트 우클릭 → "Add Logpoint" → 중단 없이 로그만 출력
3. **Watch 표현식**: 디버깅 패널에서 변수 추적
4. **Call Stack**: 함수 호출 경로 확인
5. **콘솔 명령**: 디버그 콘솔에서 JavaScript 명령 실행 가능