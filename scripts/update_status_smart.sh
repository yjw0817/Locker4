#!/bin/bash

# ==========================================================
# 지능형 상태 업데이트 스크립트
# 사용법: 
#   자동 모드: ./update_status_smart.sh
#   수동 모드: ./update_status_smart.sh [진행률] "완료작업" "다음작업"
# ==========================================================

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 기본 변수
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTEXT_DIR="${PROJECT_DIR}/project_context"

# 컨텍스트 디렉토리 생성 (없는 경우)
mkdir -p "$CONTEXT_DIR"

# ==========================================================
# Git 상태 분석 함수
# ==========================================================
analyze_git_status() {
    local changes_summary=""
    
    # Git 저장소인지 확인
    if [ -d "${PROJECT_DIR}/.git" ]; then
        cd "$PROJECT_DIR"
        
        # 현재 브랜치
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
        
        # 변경된 파일 수
        MODIFIED_FILES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        
        # 스테이징된 파일 수
        STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | wc -l | tr -d ' ')
        
        # 커밋되지 않은 변경사항
        UNSTAGED_FILES=$((MODIFIED_FILES - STAGED_FILES))
        
        # 최근 커밋 메시지
        LAST_COMMIT=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "커밋 기록 없음")
        
        # 최근 변경된 파일들 (상위 5개)
        RECENT_FILES=$(git status --porcelain 2>/dev/null | head -5 | sed 's/^/    /')
        
        changes_summary="브랜치: $CURRENT_BRANCH | 변경: ${MODIFIED_FILES}개 파일"
    else
        changes_summary="Git 저장소 아님"
        CURRENT_BRANCH="N/A"
        MODIFIED_FILES=0
        STAGED_FILES=0
        UNSTAGED_FILES=0
        LAST_COMMIT="N/A"
        RECENT_FILES=""
    fi
    
    echo "$changes_summary"
}

# ==========================================================
# 프로젝트 구조 분석 함수
# ==========================================================
analyze_project_structure() {
    local tech_stack=""
    local project_type=""
    
    # Vue 프로젝트 확인
    if [ -f "${PROJECT_DIR}/package.json" ]; then
        if grep -q '"vue"' "${PROJECT_DIR}/package.json" 2>/dev/null; then
            tech_stack="Vue 3"
            project_type="Frontend"
            
            # 추가 기술 스택 확인
            grep -q '"pinia"' "${PROJECT_DIR}/package.json" && tech_stack="$tech_stack + Pinia"
            grep -q '"vuedraggable"' "${PROJECT_DIR}/package.json" && tech_stack="$tech_stack + Draggable"
            grep -q '"tailwindcss"' "${PROJECT_DIR}/package.json" && tech_stack="$tech_stack + Tailwind"
        fi
    fi
    
    # Python 프로젝트 확인
    if [ -f "${PROJECT_DIR}/requirements.txt" ] || [ -f "${PROJECT_DIR}/pyproject.toml" ]; then
        [ -n "$tech_stack" ] && tech_stack="$tech_stack + Python" || tech_stack="Python"
        project_type="${project_type:+$project_type/}Backend"
    fi
    
    echo "${tech_stack:-Unknown} | ${project_type:-Unknown}"
}

# ==========================================================
# 자동 진행률 계산 함수
# ==========================================================
calculate_progress() {
    local current_progress=0
    local increment=5
    
    # 현재 진행률 읽기
    if [ -f "${CONTEXT_DIR}/current_status.md" ]; then
        current_progress=$(grep "전체 진행률:" "${CONTEXT_DIR}/current_status.md" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")
    fi
    
    # Git 활동 기반 증가량 조정
    if [ "${MODIFIED_FILES:-0}" -gt 10 ]; then
        increment=10
    elif [ "${MODIFIED_FILES:-0}" -gt 5 ]; then
        increment=7
    fi
    
    # 진행률 계산
    local new_progress=$((current_progress + increment))
    [ $new_progress -gt 100 ] && new_progress=100
    
    echo "$new_progress"
}

# ==========================================================
# 작업 내용 자동 추출 함수
# ==========================================================
extract_work_done() {
    local work=""
    
    # Git 커밋 메시지에서 추출 시도
    if [ -d "${PROJECT_DIR}/.git" ]; then
        work=$(git log -1 --pretty=format:"%s" 2>/dev/null | head -1)
    fi
    
    # 최근 변경 파일 기반 추측
    if [ -z "$work" ] && [ "${MODIFIED_FILES:-0}" -gt 0 ]; then
        local main_file=$(git status --porcelain 2>/dev/null | head -1 | awk '{print $2}')
        [ -n "$main_file" ] && work="$main_file 작업 진행"
    fi
    
    # 기본값
    [ -z "$work" ] && work="프로젝트 개발 진행"
    
    echo "$work"
}

# ==========================================================
# 다음 작업 추출 함수
# ==========================================================
extract_next_work() {
    local next=""
    
    # next_actions.md에서 추출
    if [ -f "${CONTEXT_DIR}/next_actions.md" ]; then
        next=$(grep -E "^[0-9]+\." "${CONTEXT_DIR}/next_actions.md" 2>/dev/null | head -1 | sed 's/^[0-9]\+\. //')
    fi
    
    # TODO 파일에서 추출
    if [ -z "$next" ] && [ -f "${PROJECT_DIR}/TODO.md" ]; then
        next=$(grep -E "^- \[ \]" "${PROJECT_DIR}/TODO.md" 2>/dev/null | head -1 | sed 's/^- \[ \] //')
    fi
    
    # 기본값
    [ -z "$next" ] && next="다음 작업 계획 필요"
    
    echo "$next"
}

# ==========================================================
# 메인 실행 로직
# ==========================================================

echo -e "${CYAN}🔍 === 지능형 상태 업데이트 시작 ===${NC}"
echo ""

# Git 상태 분석
GIT_STATUS=$(analyze_git_status)
echo -e "${BLUE}📊 Git 상태:${NC} $GIT_STATUS"

# 프로젝트 구조 분석
PROJECT_INFO=$(analyze_project_structure)
echo -e "${BLUE}🏗️  프로젝트:${NC} $PROJECT_INFO"
echo ""

# 인자 처리
if [ $# -eq 0 ]; then
    # 완전 자동 모드
    echo -e "${YELLOW}🤖 자동 모드 실행중...${NC}"
    PROGRESS=$(calculate_progress)
    WORK_DONE=$(extract_work_done)
    NEXT_WORK=$(extract_next_work)
elif [ $# -eq 1 ]; then
    # 반자동 모드 (작업 내용만 제공)
    WORK_DONE="$1"
    PROGRESS=$(calculate_progress)
    NEXT_WORK=$(extract_next_work)
elif [ $# -eq 2 ]; then
    # 진행률과 작업 내용 제공
    PROGRESS="$1"
    WORK_DONE="$2"
    NEXT_WORK=$(extract_next_work)
else
    # 완전 수동 모드
    PROGRESS="$1"
    WORK_DONE="$2"
    NEXT_WORK="$3"
fi

echo -e "${GREEN}✅ 작업 완료:${NC} $WORK_DONE"
echo -e "${GREEN}📈 진행률:${NC} ${PROGRESS}%"
echo -e "${GREEN}⚡ 다음 작업:${NC} $NEXT_WORK"
echo ""

# ==========================================================
# 1. work_log.md 업데이트
# ==========================================================
{
    echo "$TIMESTAMP | $WORK_DONE | 진행률: ${PROGRESS}% | Git: $GIT_STATUS"
} >> "${CONTEXT_DIR}/work_log.md"
echo -e "${GREEN}✅${NC} work_log.md 업데이트 완료"

# ==========================================================
# 2. current_status.md 생성/업데이트
# ==========================================================
cat > "${CONTEXT_DIR}/current_status.md" << EOF
# 🚀 프로젝트 현재 상태
> 마지막 업데이트: $TIMESTAMP

## 📊 전체 진행률: ${PROGRESS}%

\`\`\`
$(printf '%.0s█' $(seq 1 $((PROGRESS/5))))$(printf '%.0s░' $(seq 1 $((20-PROGRESS/5))))
${PROGRESS}% Complete
\`\`\`

## 🎯 프로젝트 정보
- **기술 스택**: $PROJECT_INFO
- **현재 브랜치**: ${CURRENT_BRANCH:-N/A}
- **변경된 파일**: ${MODIFIED_FILES:-0}개

## ✅ 최근 완료된 작업
- **작업**: $WORK_DONE
- **시간**: $TIMESTAMP
- **상태**: 완료 ✅

## 🔄 다음 작업
- **계획**: $NEXT_WORK
- **우선순위**: 높음
- **예상 시간**: TBD

## 📝 최근 작업 이력 (10개)
\`\`\`
$(tail -10 "${CONTEXT_DIR}/work_log.md" 2>/dev/null || echo "작업 이력 없음")
\`\`\`

## 🔧 Git 상태
- **브랜치**: ${CURRENT_BRANCH:-N/A}
- **변경 파일**: ${MODIFIED_FILES:-0}개
- **스테이징**: ${STAGED_FILES:-0}개
- **최근 커밋**: ${LAST_COMMIT:-N/A}

EOF

# 최근 변경 파일 추가 (있는 경우)
if [ "${MODIFIED_FILES:-0}" -gt 0 ] && [ -n "$RECENT_FILES" ]; then
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF

### 최근 변경된 파일들:
\`\`\`
$RECENT_FILES
\`\`\`
EOF
fi

# 진행률별 추가 정보
cat >> "${CONTEXT_DIR}/current_status.md" << EOF

## 📈 진행 단계 분석
EOF

if [ $PROGRESS -ge 90 ]; then
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF
🎉 **프로젝트 마무리 단계** (${PROGRESS}%)
- 최종 테스트 및 검증 필요
- 배포 준비 체크리스트 확인
- 문서화 완성도 점검
EOF
elif [ $PROGRESS -ge 70 ]; then
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF
🔥 **프로젝트 고급 단계** (${PROGRESS}%)
- 통합 테스트 진행
- 성능 최적화 고려
- 사용자 피드백 수집
EOF
elif [ $PROGRESS -ge 50 ]; then
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF
📈 **프로젝트 중간 단계** (${PROGRESS}%)
- 핵심 기능 구현 완료
- 코드 리뷰 및 리팩토링
- 중간 점검 필요
EOF
elif [ $PROGRESS -ge 25 ]; then
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF
🚀 **프로젝트 초기 구현** (${PROGRESS}%)
- 기본 구조 확립
- 핵심 기능 개발 중
- 지속적인 진행 필요
EOF
else
    cat >> "${CONTEXT_DIR}/current_status.md" << EOF
🌱 **프로젝트 시작 단계** (${PROGRESS}%)
- 프로젝트 설정 및 초기화
- 기본 구조 설계
- 개발 환경 구축
EOF
fi

cat >> "${CONTEXT_DIR}/current_status.md" << EOF

## 🔄 빠른 복구 명령어
\`\`\`bash
# 컨텍스트 복구
./scripts/restore_context.sh

# 개발 서버 시작
npm run dev

# Git 상태 확인
git status
\`\`\`

---
*이 문서는 자동으로 생성되었습니다.*
EOF

echo -e "${GREEN}✅${NC} current_status.md 업데이트 완료"

# ==========================================================
# 3. 지능형 추천 시스템
# ==========================================================
echo ""
echo -e "${MAGENTA}🤖 === 지능형 추천 ===${NC}"

# Git 상태 기반 추천
if [ "${MODIFIED_FILES:-0}" -gt 0 ] && [ "${STAGED_FILES:-0}" -eq 0 ]; then
    echo -e "${YELLOW}💡 변경사항이 스테이징되지 않았습니다:${NC}"
    echo "   git add . && git commit -m \"$WORK_DONE\""
fi

# 진행률 기반 추천
if [ $PROGRESS -ge 50 ] && [ ! -f "${PROJECT_DIR}/README.md" ]; then
    echo -e "${YELLOW}📝 README.md 작성을 권장합니다${NC}"
fi

if [ $PROGRESS -ge 70 ] && [ ! -d "${PROJECT_DIR}/tests" ]; then
    echo -e "${YELLOW}🧪 테스트 디렉토리 생성을 권장합니다${NC}"
fi

# 브랜치 전략 추천
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${YELLOW}🌿 feature 브랜치 생성을 고려하세요:${NC}"
    echo "   git checkout -b feature/$(echo $NEXT_WORK | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | head -c 20)"
fi

# ==========================================================
# 4. 완료 요약
# ==========================================================
echo ""
echo -e "${CYAN}📋 === 업데이트 완료 요약 ===${NC}"
echo -e "  ${GREEN}✓${NC} 진행률: ${PROGRESS}%"
echo -e "  ${GREEN}✓${NC} 작업 로그 기록됨"
echo -e "  ${GREEN}✓${NC} 상태 문서 업데이트됨"
echo -e "  ${GREEN}✓${NC} Git 상태 분석됨"
echo ""
echo -e "${BLUE}🚀 다음 세션 시작:${NC}"
echo "   ./scripts/restore_context.sh"
echo ""
echo -e "${GREEN}✨ === 지능형 상태 업데이트 완료! ===${NC}"

# 알림음 (macOS의 경우)
if [[ "$OSTYPE" == "darwin"* ]]; then
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
fi