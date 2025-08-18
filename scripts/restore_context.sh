#!/bin/bash

echo "🔄 === Vue 3 락커관리 시스템 완벽 맥락 복구 ==="
echo ""

# 1. 기본 정보 표시
echo "📋 === 프로젝트 핵심 정보 ==="
echo "🎯 목표: Vue 3 기반 락커관리 시스템 개발"
echo "🔗 피그마: https://www.figma.com/design/HNPe8VljEBb1cJasZHJekA/"
echo "🛠️ 기술스택: Vue 3 + TypeScript + Pinia + SVG"
echo ""

# 2. 현재 상태 상세 표시
echo "📊 === 현재 진행 상황 ==="
if [ -f "project_context/current_status.md" ]; then
    # 진행률 추출
    PROGRESS=$(grep "전체 진행률:" project_context/current_status.md | grep -o '[0-9]\+' || echo "0")
    echo "📈 전체 진행률: ${PROGRESS}%"
    
    # 최근 작업 표시
    echo "✅ 최근 완료 작업:"
    grep -A 5 "최근 완료된 작업" project_context/current_status.md | tail -5 | grep -E "^- " | head -3
    
    # 다음 작업 표시
    echo ""
    echo "⚡ 다음 해야할 작업:"
    grep -A 3 "다음 해야할 작업" project_context/current_status.md | tail -3 | grep -v "^#"
    
    # 마지막 세션 정보
    echo ""
    echo "🕒 마지막 업데이트:"
    grep "마지막 업데이트:" project_context/current_status.md
else
    echo "⚠️ current_status.md 파일을 찾을 수 없습니다."
    echo "프로젝트를 처음 시작하는 것 같습니다."
fi

echo ""

# 3. 다음 액션 아이템 표시
echo "🎯 === 즉시 할 일 (우선순위 순) ==="
if [ -f "project_context/next_actions.md" ]; then
    # 우선순위 1 작업들 표시
    sed -n '/우선순위 1/,/우선순위 2/p' project_context/next_actions.md | grep -E "^[0-9]\." | head -3
else
    echo "1. next_actions.md 파일 확인 필요"
fi

echo ""

# 4. 중요 참고사항 표시
echo "🔧 === 기술적 주의사항 ==="
echo "• 피그마 디자인 100% 반영 필수"
echo "• SVG 기반 락커 렌더링"
echo "• Vue.Draggable.Next 사용"
echo "• Pinia 상태관리"

echo ""

# 5. 빠른 명령어 가이드
echo "⚡ === 빠른 명령어 가이드 ==="
echo "📝 작업 완료 시:"
echo "  ./scripts/update_status_smart.sh auto '완료된 작업'"
echo ""
echo "🔍 상태 확인:"
echo "  cat project_context/current_status.md"
echo ""
echo "📋 다음 작업 확인:"
echo "  head -10 project_context/next_actions.md"
echo ""
echo "🎨 피그마 체크:"
echo "  ./scripts/check_figma_design.sh"

echo ""

# 6. 자동 다음 단계 제안
if [ -f "project_context/current_status.md" ]; then
    PROGRESS=$(grep "전체 진행률:" project_context/current_status.md | grep -o '[0-9]\+' || echo "0")
    
    echo "💡 === 다음 단계 제안 ==="
    if [ $PROGRESS -eq 0 ]; then
        echo "🚀 프로젝트 초기화부터 시작하세요:"
        echo "   1. Vue 3 프로젝트 생성"
        echo "   2. 기본 폴더 구조 설정"
        echo "   3. 피그마 디자인 토큰 추출"
    elif [ $PROGRESS -lt 30 ]; then
        echo "🔧 기본 구조 완성에 집중하세요:"
        echo "   1. 컴포넌트 기본 구조"
        echo "   2. 라우팅 설정"
        echo "   3. 상태관리 설정"
    elif [ $PROGRESS -lt 70 ]; then
        echo "🎨 핵심 기능 구현을 진행하세요:"
        echo "   1. 락커 컴포넌트 완성"
        echo "   2. 드래그앤드롭 구현"
        echo "   3. 피그마 디자인 적용"
    else
        echo "🏁 마무리 단계를 진행하세요:"
        echo "   1. 통합 테스트"
        echo "   2. 성능 최적화"
        echo "   3. 배포 준비"
    fi
fi

echo ""
echo "✨ === 맥락 복구 완료! 작업을 계속 진행하세요 ==="