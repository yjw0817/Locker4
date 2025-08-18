#!/bin/bash
echo "=== Vue 3 프로젝트 초기화 ==="

# Vue 3 프로젝트 구조 생성
mkdir -p frontend/src/{components/{common,locker,modals},pages,composables,stores,styles/{tokens,components},utils,types}

# 기본 CSS 변수 파일들 생성
cat > frontend/src/styles/tokens/colors.css << 'EOF'
:root {
  /* === 기본 색상 (피그마에서 추출 필요) === */
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background-color: #ffffff;
  --surface-color: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  
  /* === 락커 상태 색상 (피그마에서 정확한 값 확인 필요) === */
  --locker-available: #dcfce7;    /* 사용 가능 - 연한 초록 */
  --locker-occupied: #fef3c7;     /* 사용 중 - 연한 노랑 */
  --locker-expired: #fecaca;      /* 만료 - 연한 빨강 */
  --locker-maintenance: #dbeafe;  /* 정비 중 - 연한 파랑 */
  --locker-selected: #bfdbfe;     /* 선택됨 - 파랑 */
  --locker-hover: #f1f5f9;        /* 호버 상태 */
}
EOF

cat > frontend/src/styles/tokens/typography.css << 'EOF'
:root {
  /* === Vue 3 프로젝트용 폰트 설정 === */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-secondary: inherit;
  --font-monospace: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  
  /* === 폰트 크기 === */
  --text-xs: 12px;    /* 캡션, 락커 번호 */
  --text-sm: 14px;    /* 보조 텍스트 */
  --text-base: 16px;  /* 기본 텍스트 */
  --text-lg: 18px;    /* 서브 헤딩 */
  --text-xl: 20px;    /* 헤딩 */
  --text-2xl: 24px;   /* 대형 헤딩 */
}
EOF

cat > frontend/src/styles/globals.css << 'EOF'
/* Vue 3 전역 스타일 */
@import './tokens/colors.css';
@import './tokens/typography.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  color: var(--text-primary);
  background-color: var(--background-color);
  line-height: 1.5;
}

/* Vue 컴포넌트 기본 스타일 */
.locker-component {
  cursor: pointer;
  transition: all 0.2s ease;
}

.locker-component:hover {
  transform: scale(1.02);
}
EOF

echo "✅ Vue 3 프로젝트 기본 구조가 생성되었습니다."
echo ""
echo "📝 다음 단계:"
echo "1. 피그마에서 정확한 디자인 토큰 확인"
echo "2. package.json 생성 및 Vue 3 dependencies 설치"
echo "3. 기본 컴포넌트 구조 생성"