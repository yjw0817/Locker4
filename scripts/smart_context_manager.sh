#!/bin/bash

# ==========================================================
# 스마트 컨텍스트 관리자
# 인증 및 리소스 관리 통합 시스템
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
RESOURCES_FILE="${CONTEXT_DIR}/resources_status.json"
AUTH_FILE="${CONTEXT_DIR}/.auth_session"

# 컨텍스트 디렉토리 생성 (없는 경우)
mkdir -p "$CONTEXT_DIR"

# ==========================================================
# 인증 관리 함수
# ==========================================================
check_authentication() {
    if [ -f "$AUTH_FILE" ]; then
        local session_time=$(cat "$AUTH_FILE" 2>/dev/null)
        local current_time=$(date +%s)
        local time_diff=$((current_time - session_time))
        
        # 세션 타임아웃 (1시간)
        if [ $time_diff -gt 3600 ]; then
            echo -e "${YELLOW}⚠️  세션이 만료되었습니다. 재인증 필요${NC}"
            return 1
        else
            local remaining=$((3600 - time_diff))
            echo -e "${GREEN}✅ 인증 상태 유효 (남은 시간: $((remaining/60))분)${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ 인증되지 않은 세션${NC}"
        return 1
    fi
}

authenticate() {
    echo -e "${CYAN}🔐 인증 프로세스 시작...${NC}"
    
    # 간단한 인증 시뮬레이션 (실제로는 더 복잡한 인증 로직)
    echo -n "프로젝트 키 입력: "
    read -s project_key
    echo ""
    
    if [ "$project_key" = "locker4" ] || [ -z "$project_key" ]; then
        date +%s > "$AUTH_FILE"
        echo -e "${GREEN}✅ 인증 성공!${NC}"
        return 0
    else
        echo -e "${RED}❌ 인증 실패${NC}"
        return 1
    fi
}

# ==========================================================
# 리소스 모니터링 함수
# ==========================================================
monitor_resources() {
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
    local memory_usage=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//' 2>/dev/null || echo "0")
    local disk_usage=$(df -h "$PROJECT_DIR" | tail -1 | awk '{print $5}' | sed 's/%//' 2>/dev/null || echo "0")
    
    # JSON 형식으로 저장
    cat > "$RESOURCES_FILE" << EOF
{
    "timestamp": "$TIMESTAMP",
    "cpu_usage": "${cpu_usage:-0}",
    "memory_available": "${memory_usage:-0}",
    "disk_usage": "${disk_usage:-0}",
    "project_dir": "$PROJECT_DIR",
    "context_files": $(ls -1 "$CONTEXT_DIR" | wc -l)
}
EOF
    
    # 리소스 상태 표시
    echo -e "${BLUE}📊 === 시스템 리소스 상태 ===${NC}"
    echo -e "  CPU 사용률: ${cpu_usage:-N/A}%"
    echo -e "  메모리 여유: ${memory_usage:-N/A} pages"
    echo -e "  디스크 사용: ${disk_usage:-N/A}%"
    echo -e "  컨텍스트 파일: $(ls -1 "$CONTEXT_DIR" | wc -l)개"
    
    # 리소스 경고
    if [ "${disk_usage:-0}" -gt 90 ]; then
        echo -e "${RED}⚠️  디스크 공간 부족 경고!${NC}"
    fi
}

# ==========================================================
# 프로젝트 정보 수집 함수
# ==========================================================
collect_project_info() {
    local vue_version=""
    local node_version=""
    local npm_version=""
    
    # Node.js 버전 확인
    if command -v node &> /dev/null; then
        node_version=$(node -v 2>/dev/null || echo "N/A")
    fi
    
    # npm 버전 확인
    if command -v npm &> /dev/null; then
        npm_version=$(npm -v 2>/dev/null || echo "N/A")
    fi
    
    # Vue 버전 확인
    if [ -f "${PROJECT_DIR}/frontend/package.json" ]; then
        vue_version=$(grep '"vue"' "${PROJECT_DIR}/frontend/package.json" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1 || echo "N/A")
    fi
    
    echo -e "${BLUE}🛠️  === 개발 환경 정보 ===${NC}"
    echo -e "  Node.js: $node_version"
    echo -e "  npm: $npm_version"
    echo -e "  Vue: ${vue_version:-N/A}"
}

# ==========================================================
# 스마트 복구 함수
# ==========================================================
smart_restore() {
    echo -e "${CYAN}🔄 === 스마트 컨텍스트 복구 시작 ===${NC}"
    echo ""
    
    # 1. 인증 체크
    if ! check_authentication; then
        if ! authenticate; then
            echo -e "${RED}복구 실패: 인증 필요${NC}"
            exit 1
        fi
    fi
    
    echo ""
    
    # 2. 리소스 모니터링
    monitor_resources
    echo ""
    
    # 3. 개발 환경 정보
    collect_project_info
    echo ""
    
    # 4. 프로젝트 상태
    echo -e "${CYAN}📊 === 프로젝트 상태 ===${NC}"
    if [ -f "${CONTEXT_DIR}/current_status.md" ]; then
        local progress=$(grep "전체 진행률:" "${CONTEXT_DIR}/current_status.md" | grep -o '[0-9]\+' | head -1 || echo "0")
        local last_work=$(grep -A 2 "최근 완료된 작업" "${CONTEXT_DIR}/current_status.md" | grep "작업:" | sed 's/.*작업: //')
        local next_work=$(grep -A 2 "다음 작업" "${CONTEXT_DIR}/current_status.md" | grep "계획:" | sed 's/.*계획: //')
        
        echo -e "  진행률: ${GREEN}${progress}%${NC}"
        echo -e "  최근 작업: $last_work"
        echo -e "  다음 작업: $next_work"
    else
        echo -e "  ${YELLOW}상태 파일 없음${NC}"
    fi
    
    echo ""
    
    # 5. 추천 액션
    echo -e "${MAGENTA}💡 === 추천 액션 ===${NC}"
    
    # 개발 서버 상태 확인
    if lsof -i :5173 &> /dev/null; then
        echo -e "  ${GREEN}✅ 개발 서버 실행 중${NC}"
    else
        echo -e "  ${YELLOW}💡 개발 서버 시작 권장:${NC}"
        echo "     cd frontend && npm run dev"
    fi
    
    # Git 상태 기반 추천
    if [ -d "${PROJECT_DIR}/.git" ]; then
        local uncommitted=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        if [ "$uncommitted" -gt 0 ]; then
            echo -e "  ${YELLOW}💡 커밋되지 않은 변경사항 $uncommitted개${NC}"
            echo "     git add . && git commit -m 'Update'"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}✨ === 스마트 복구 완료! ===${NC}"
}

# ==========================================================
# 스마트 업데이트 함수
# ==========================================================
smart_update() {
    echo -e "${CYAN}📝 === 스마트 상태 업데이트 ===${NC}"
    echo ""
    
    # 인증 체크
    if ! check_authentication; then
        echo -e "${RED}업데이트 실패: 인증 필요${NC}"
        exit 1
    fi
    
    # 기존 스크립트 호출
    "${PROJECT_DIR}/scripts/update_status_smart.sh" "$@"
    
    # 리소스 상태 업데이트
    monitor_resources > /dev/null 2>&1
    
    echo -e "${GREEN}✅ 스마트 업데이트 완료${NC}"
}

# ==========================================================
# 메인 명령 처리
# ==========================================================
case "${1:-restore}" in
    restore|r)
        smart_restore
        ;;
    update|u)
        shift
        smart_update "$@"
        ;;
    auth|a)
        authenticate
        ;;
    monitor|m)
        monitor_resources
        ;;
    info|i)
        collect_project_info
        ;;
    clean|c)
        echo -e "${YELLOW}🧹 임시 파일 정리 중...${NC}"
        find "$CONTEXT_DIR" -name "*.tmp" -delete
        find "$CONTEXT_DIR" -name "*.bak" -delete
        echo -e "${GREEN}✅ 정리 완료${NC}"
        ;;
    help|h)
        echo -e "${CYAN}📚 === 스마트 컨텍스트 관리자 도움말 ===${NC}"
        echo ""
        echo "사용법: $0 [명령] [옵션]"
        echo ""
        echo "명령어:"
        echo "  restore, r  - 컨텍스트 복구 (기본)"
        echo "  update, u   - 상태 업데이트"
        echo "  auth, a     - 인증 수행"
        echo "  monitor, m  - 리소스 모니터링"
        echo "  info, i     - 환경 정보 표시"
        echo "  clean, c    - 임시 파일 정리"
        echo "  help, h     - 이 도움말 표시"
        echo ""
        echo "예시:"
        echo "  $0              # 컨텍스트 복구"
        echo "  $0 update       # 자동 업데이트"
        echo "  $0 update 70 '작업 완료' '다음 작업'"
        ;;
    *)
        echo -e "${RED}알 수 없는 명령: $1${NC}"
        echo "도움말을 보려면: $0 help"
        exit 1
        ;;
esac