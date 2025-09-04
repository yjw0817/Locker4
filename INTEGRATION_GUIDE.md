# Vue 프로젝트와 CodeIgniter 통합 가이드

## 개요
이 문서는 Locker4 Vue 프로젝트를 CodeIgniter (SpoqPlus) 프로젝트에 통합하는 방법을 설명합니다.

## 통합 구조

### 1. 빌드된 파일 위치
- **Vue 빌드 출력**: `/mnt/d/Projects/html/SpoqPlus_Color_Admin_Except_Mobile_claude2/public/assets/locker4/`
- **JavaScript**: `public/assets/locker4/js/`
- **CSS**: `public/assets/locker4/css/`

### 2. CodeIgniter View 파일
- **위치**: `app/Views/locker/locker_setting.php`
- **역할**: Vue 앱을 로드하고 PHP 설정을 JavaScript로 전달

### 3. CodeIgniter Controller
- **위치**: `app/Controllers/Locker.php`
- **메서드**: `setting()` - 락커 배치 관리 페이지 렌더링

### 4. API Controller
- **위치**: `app/Controllers/Api/Locker.php`
- **역할**: Vue 앱에서 사용할 REST API 제공

## 빌드 및 배포

### 1. Vue 프로젝트 빌드
```bash
cd /mnt/d/Projects/Locker4/frontend
npm run build
```

빌드 시 자동으로 CodeIgniter의 assets 디렉토리에 파일이 생성됩니다.

### 2. 설정 확인
`vite.config.ts`에서 다음 설정이 올바른지 확인:
```typescript
base: '/assets/locker4/',
build: {
  outDir: '../../html/SpoqPlus_Color_Admin_Except_Mobile_claude2/public/assets/locker4'
}
```

## 통합 방식

### 1. Window 객체를 통한 설정 전달
CodeIgniter View에서 `window.LockerConfig` 객체를 생성하여 PHP 설정을 Vue 앱에 전달합니다:

```javascript
window.LockerConfig = {
    apiUrl: '<?= base_url('api/locker') ?>',
    baseUrl: '<?= base_url() ?>',
    csrfToken: '<?= csrf_token() ?>',
    // ... 기타 설정
}
```

### 2. Vue 앱 초기화
Vue 앱은 `window.LockerConfig`를 감지하여 CodeIgniter 환경에서 실행 중임을 인식하고 적절히 동작합니다.

### 3. API 통신
- Vue 앱은 `window.LockerConfig.apiUrl`을 사용하여 API 요청
- CSRF 토큰 자동 포함
- CodeIgniter의 API Controller가 요청 처리

## 접근 URL

### CodeIgniter 환경
- **URL**: `http://[your-domain]/locker/setting`
- **경로**: CodeIgniter 라우팅을 통해 접근

### 개발 환경 (Vue 독립 실행)
```bash
cd /mnt/d/Projects/Locker4/frontend
npm run dev
```
- **URL**: `http://localhost:5174`

## 주요 파일 설명

### 1. `/frontend/src/config/codeigniter.ts`
CodeIgniter 통합을 위한 설정 헬퍼 함수들:
- `isCodeIgniterEnvironment()`: CodeIgniter 환경 감지
- `getApiBaseUrl()`: API URL 획득
- `getCsrfToken()`: CSRF 토큰 획득

### 2. `/frontend/src/main.ts`
Vue 앱 진입점:
- `#app` 또는 `#locker4-app` 요소에 마운트
- `window.LockerConfig.initialRoute` 확인하여 초기 라우트 설정

### 3. `/app/Views/locker/locker_setting.php`
CodeIgniter View 파일:
- Vue 앱 컨테이너 제공
- PHP 설정을 JavaScript로 전달
- Vue 빌드 파일 로드

## 문제 해결

### 1. Vue 앱이 로드되지 않는 경우
- 브라우저 콘솔에서 에러 확인
- `window.LockerConfig` 객체가 정의되었는지 확인
- 빌드 파일이 올바른 위치에 있는지 확인

### 2. API 요청 실패
- CORS 설정 확인
- CSRF 토큰이 올바르게 전달되는지 확인
- API URL이 정확한지 확인

### 3. 스타일이 적용되지 않는 경우
- CSS 파일이 올바르게 로드되는지 확인
- 브라우저 캐시 클리어 (Ctrl+F5)

## 개발 팁

1. **개발 시**: Vue 개발 서버를 사용하여 빠른 개발
2. **테스트 시**: 빌드 후 CodeIgniter 환경에서 테스트
3. **디버깅**: `window.LockerConfig.features.enableDebugMode`를 활용

## 추가 개발 사항

### 현재 완료된 작업
- ✅ Vue 프로젝트 빌드 설정
- ✅ CodeIgniter View 설정
- ✅ API 통합 구조
- ✅ CSRF 보호
- ✅ 설정 전달 메커니즘

### 향후 개선 사항
- [ ] 실시간 업데이트 기능 (WebSocket)
- [ ] 더 나은 에러 처리
- [ ] 로딩 상태 개선
- [ ] 캐싱 전략 구현

## 참고 사항
- TypeScript 타입 에러는 빌드에 영향을 주지 않도록 설정되어 있음
- 프로덕션 빌드 시 자동으로 최적화됨
- 개발 환경에서는 디버그 로그가 활성화됨