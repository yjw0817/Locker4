# CLAUDE.md - Locker4 프로젝트 가이드라인

## 프로젝트 정보
- **프로젝트명**: Locker4
- **프론트엔드**: Vue.js 3 + TypeScript + Vite
- **백엔드**: Node.js + Express
- **데이터베이스**: MySQL (192.168.0.48)

## 중요 규칙

### 1. 서버 재시작 규칙
**코드 수정 후 항상 프론트엔드와 백엔드 서버를 재시작해야 합니다.**

#### 재시작 명령어:
```bash
# 기존 서버 종료
# (필요시 KillBash 사용)

# 프론트엔드 시작
cd /mnt/d/Projects/Locker4/frontend && npm run dev

# 백엔드 시작
cd /mnt/d/Projects/Locker4/backend && npm start
```

#### 서버 정보:
- **프론트엔드**: http://localhost:5174/
- **백엔드**: http://localhost:3333

### 2. Git 커밋 규칙
- 파일 수정 후 자동으로 git add와 git commit 실행
- 명확한 커밋 메시지 작성
- 사용자가 명시적으로 금지한 경우만 제외

### 3. 코드 수정 규칙
- Read tool 사용 후 Edit/Write 수행
- 기존 코드 스타일과 패턴 준수
- TypeScript 타입 정의 유지

## 프로젝트 구조

### 프론트엔드 (/frontend)
- `/src/pages/LockerPlacementFigma.vue` - 락커 배치 메인 컴포넌트
- `/src/api/` - API 통신 모듈
- `/src/types/` - TypeScript 타입 정의

### 백엔드 (/backend)
- `/server.js` - Express 서버 메인 파일
- `/routes/` - API 라우트 정의
- `/models/` - 데이터 모델

## 주요 기능

### 락커 배치 시스템
- **평면배치 모드 (floor)**: 위에서 내려다보는 뷰
- **정면배치 모드 (front)**: 정면에서 보는 뷰
- **줌/팬 기능**: Ctrl+스크롤(줌), 중간 마우스 버튼(팬)

### 캔버스 설정
- **실제 캔버스 크기**: 3100 x 1440
- **초기 뷰포트**: 1550 x 720
- **바닥선 위치 (FLOOR_Y)**: 1100

## 테스트 및 디버깅

### 린트 및 타입 체크
```bash
npm run lint
npm run type-check
```

### 개발 시 주의사항
1. 항상 코드 수정 후 서버 재시작
2. 브라우저 캐시 클리어 필요시 Ctrl+F5
3. 콘솔 로그 확인으로 에러 체크

## 자주 사용하는 명령어

### 서버 상태 확인
```bash
lsof -i :5174  # 프론트엔드 포트 확인
lsof -i :3333  # 백엔드 포트 확인
```

### 프로세스 종료
```bash
# 포트 사용 중인 프로세스 종료
kill -9 $(lsof -t -i:5174)
kill -9 $(lsof -t -i:3333)
```

## 업데이트 내역
- 2025-09-01: 줌/팬 기능 세로배치 모드 적용
- 2025-09-01: 바닥선 개선 및 자동 중앙 정렬 기능 추가