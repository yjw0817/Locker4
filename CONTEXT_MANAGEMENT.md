# 📚 컨텍스트 관리 시스템 가이드

## 🎯 개요
Vue 3 락커관리 시스템의 스마트 컨텍스트 관리 시스템입니다. 프로젝트 상태, 인증, 리소스를 통합 관리합니다.

## 🛠️ 주요 기능

### 1. 스마트 컨텍스트 관리자 (`smart_context_manager.sh`)
통합 컨텍스트 관리 도구로 인증, 리소스 모니터링, 상태 관리를 제공합니다.

#### 명령어
```bash
# 컨텍스트 복구 (기본)
./scripts/smart_context_manager.sh restore

# 상태 업데이트
./scripts/smart_context_manager.sh update

# 인증 수행
./scripts/smart_context_manager.sh auth

# 리소스 모니터링
./scripts/smart_context_manager.sh monitor

# 환경 정보 표시
./scripts/smart_context_manager.sh info

# 임시 파일 정리
./scripts/smart_context_manager.sh clean
```

#### 특징
- ✅ 세션 기반 인증 (1시간 타임아웃)
- 📊 실시간 리소스 모니터링 (CPU, 메모리, 디스크)
- 🔄 자동 상태 복구
- 💡 스마트 추천 시스템

### 2. 지능형 상태 업데이트 (`update_status_smart.sh`)
Git 활동과 프로젝트 구조를 분석하여 자동으로 진행 상태를 업데이트합니다.

#### 사용 방법
```bash
# 완전 자동 모드
./scripts/update_status_smart.sh

# 작업 내용만 제공
./scripts/update_status_smart.sh "완료한 작업 내용"

# 진행률과 작업 내용 제공
./scripts/update_status_smart.sh 75 "완료한 작업"

# 완전 수동 모드
./scripts/update_status_smart.sh 80 "완료한 작업" "다음 작업"
```

#### 자동 감지 기능
- 📊 Git 상태 분석 (브랜치, 변경 파일, 커밋)
- 🏗️ 프로젝트 기술 스택 감지
- 📈 진행률 자동 계산
- 🤖 작업 내용 자동 추출

### 3. 컨텍스트 복구 (`restore_context.sh`)
프로젝트 상태를 빠르게 파악하고 작업을 재개할 수 있도록 도와줍니다.

#### 표시 정보
- 📊 현재 진행률
- ✅ 최근 완료 작업
- ⚡ 다음 해야할 작업
- 🔧 기술적 주의사항
- 💡 다음 단계 제안

## 📁 컨텍스트 파일 구조

```
project_context/
├── current_status.md      # 현재 프로젝트 상태
├── work_log.md            # 작업 이력
├── next_actions.md        # 다음 작업 목록
├── project_goals.md       # 프로젝트 목표
├── technical_decisions.md # 기술적 결정사항
├── design_checklist.md    # 디자인 체크리스트
├── resources_status.json  # 리소스 상태 (자동 생성)
└── .auth_session         # 인증 세션 (자동 생성)
```

## 🚀 빠른 시작

### 1. 새 세션 시작
```bash
# 컨텍스트 복구 및 상태 확인
./scripts/smart_context_manager.sh

# 또는 기본 복구
./scripts/restore_context.sh
```

### 2. 작업 중 상태 업데이트
```bash
# 자동 업데이트
./scripts/update_status_smart.sh

# 또는 스마트 매니저로
./scripts/smart_context_manager.sh update
```

### 3. 작업 완료 시
```bash
# 진행률과 함께 업데이트
./scripts/update_status_smart.sh 85 "락커 충돌 방지 시스템 구현"
```

## 💡 고급 기능

### 리소스 모니터링
시스템 리소스를 실시간으로 모니터링하여 성능 문제를 미리 감지합니다.

```bash
./scripts/smart_context_manager.sh monitor
```

출력 예시:
```
📊 === 시스템 리소스 상태 ===
  CPU 사용률: 17.39%
  메모리 여유: 126051 pages
  디스크 사용: 71%
  컨텍스트 파일: 7개
```

### 인증 관리
세션 기반 인증으로 프로젝트 접근을 관리합니다.

```bash
# 인증 상태 확인 및 재인증
./scripts/smart_context_manager.sh auth
```

### 환경 정보
개발 환경 정보를 한눈에 확인합니다.

```bash
./scripts/smart_context_manager.sh info
```

## 🎯 프로젝트 진행 단계별 가이드

### 🌱 시작 단계 (0-25%)
- 프로젝트 초기화
- 기본 구조 설계
- 개발 환경 구축

### 🚀 초기 구현 (25-50%)
- 기본 구조 확립
- 핵심 기능 개발
- 지속적인 진행

### 📈 중간 단계 (50-70%)
- 핵심 기능 구현 완료
- 코드 리뷰 및 리팩토링
- 중간 점검

### 🔥 고급 단계 (70-90%)
- 통합 테스트 진행
- 성능 최적화
- 사용자 피드백 수집

### 🎉 마무리 단계 (90-100%)
- 최종 테스트 및 검증
- 배포 준비 체크리스트
- 문서화 완성

## 🔧 문제 해결

### Git 상태가 감지되지 않을 때
```bash
# Git 초기화
git init

# 원격 저장소 추가
git remote add origin [저장소 URL]
```

### 인증 문제
```bash
# 세션 재설정
rm project_context/.auth_session
./scripts/smart_context_manager.sh auth
```

### 리소스 부족 경고
```bash
# 임시 파일 정리
./scripts/smart_context_manager.sh clean

# node_modules 재설치
rm -rf frontend/node_modules
cd frontend && npm install
```

## 📝 모범 사례

1. **매 세션 시작 시**: `smart_context_manager.sh restore` 실행
2. **중요 작업 완료 시**: 진행률과 함께 상태 업데이트
3. **1시간마다**: 리소스 모니터링 확인
4. **작업 종료 시**: 최종 상태 업데이트

## 🎨 피그마 연동

피그마 디자인과 동기화 상태를 확인:
```bash
./scripts/check_figma_design.sh
```

## 📚 추가 문서

- [프로젝트 목표](project_context/project_goals.md)
- [기술 결정사항](project_context/technical_decisions.md)
- [디자인 체크리스트](project_context/design_checklist.md)
- [작업 이력](project_context/work_log.md)

## 🚀 다음 단계

현재 진행률: **85%**

### 즉시 해야 할 일:
1. 통합 테스트 진행
2. 성능 최적화
3. 배포 준비

### 명령어:
```bash
# 개발 서버 시작
cd frontend && npm run dev

# 상태 확인
./scripts/smart_context_manager.sh

# 작업 업데이트
./scripts/update_status_smart.sh "완료한 작업"
```

---

*이 문서는 Locker4 프로젝트의 컨텍스트 관리 시스템 가이드입니다.*