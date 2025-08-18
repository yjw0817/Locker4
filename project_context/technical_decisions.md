# 기술적 결정사항

## 프론트엔드 기술 선택
- **Vue 3 + TypeScript**: Composition API 기반 컴포넌트 개발
- **Pinia**: Vue 3 공식 상태 관리 라이브러리
- **SVG**: 락커 렌더링 (Canvas나 복잡한 그래픽 라이브러리 대신)
- **Vue.Draggable.Next**: 드래그앤드롭 구현
- **Quasar Framework**: UI 컴포넌트 라이브러리

## 백엔드 기술 선택
- **Node.js + Express**: REST API 서버
- **PostgreSQL**: 복잡한 공간 데이터 처리 가능
- **Prisma**: ORM (타입 안전성)
- **JWT**: 사용자 인증

## 디자인 시스템 구현 전략
- **피그마 디자인 100% 반영**: 제공된 피그마 디자인을 정확히 구현
- **CSS Variables 기반**: 디자인 토큰을 CSS 변수로 관리
- **컴포넌트별 스타일 모듈화**: 각 컴포넌트별 독립적 스타일링
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 그래픽 렌더링 전략
- **SVG 기반**: 복잡한 라이브러리 대신 순수 SVG 사용
- **평면뷰**: `<rect>` 기반 위에서 본 모습
- **정면뷰**: `<rect>` 기반 앞에서 본 모습, 단수별 분할
- **회전**: SVG `transform="rotate()"` 사용
- **색상**: 피그마 디자인의 정확한 색상 값 사용

## 피그마 디자인 파일 정보
- **락커 배치관리**: https://www.figma.com/design/HNPe8VljEBb1cJasZHJekA/관리자-락커-배치
- **락커 배정관리**: https://www.figma.com/design/BXwBrhkCCZTTnnNGUezcvw/락커현황판-사용자-
- **총 21개 화면**: 각 단계별 상세 디자인 포함

## 파일 구조 컨벤션
frontend/src/
├── components/           # Vue 컴포넌트들
│   ├── common/          # 공통 컴포넌트
│   ├── locker/          # 락커 관련 컴포넌트
│   └── modals/          # 모달 컴포넌트들
├── pages/               # 페이지 컴포넌트
├── composables/         # Composition API 함수들
├── stores/              # Pinia 스토어
├── styles/              # 스타일 파일들
│   ├── tokens/          # 디자인 토큰 (색상, 타이포그래피)
│   ├── components/      # 컴포넌트별 스타일
│   └── globals.css      # 전역 스타일
├── utils/               # 유틸리티 함수
└── types/               # TypeScript 타입 정의

## 코딩 컨벤션
- **컴포넌트**: PascalCase (예: LockerRenderer.vue)
- **파일명**: camelCase (예: lockerStore.ts)
- **함수명**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **CSS Variables**: --kebab-case (예: --locker-available-color)