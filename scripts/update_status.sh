#!/bin/bash
if [ -z "$1" ]; then
    echo "사용법: ./update_status.sh '완료된 작업 설명'"
    exit 1
fi

echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> project_context/work_log.md
echo "✅ 상태 업데이트 완료: $1"
echo ""
echo "현재 status 파일을 수동으로 업데이트하세요:"
echo "- project_context/current_status.md"
echo "- project_context/next_actions.md"