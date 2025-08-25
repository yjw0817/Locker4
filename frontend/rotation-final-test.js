// 최종 회전 시스템 테스트 스크립트
// http://localhost:5174/locker-placement-figma 에서 실행

(() => {
  console.clear();
  console.log("%c=== 회전 시스템 최종 테스트 ===", "color: green; font-size: 18px; font-weight: bold");
  
  console.log("\n📌 수정된 내용:");
  console.log("1. 그룹 회전시 각 락커의 각도도 함께 회전");
  console.log("2. 360도 경계 스냅 문제 해결");
  console.log("3. 누적 회전 추적 개선");
  
  console.log("\n🧪 테스트 케이스:");
  
  console.log("\n[테스트 1] 단일 락커 360도 회전");
  console.log("• 락커 하나 선택");
  console.log("• 시계방향으로 계속 회전 (720도 이상)");
  console.log("✅ 예상: 역회전 없이 부드럽게 회전");
  console.log("✅ 예상: 0°, 45°, 90° 등에서 정확히 스냅");
  
  console.log("\n[테스트 2] 그룹 회전");
  console.log("• Ctrl+클릭으로 2-3개 락커 선택");
  console.log("• 회전 핸들로 그룹 회전");
  console.log("✅ 예상: 모든 락커가 그룹 중심 기준으로 위치 이동");
  console.log("✅ 예상: 각 락커의 각도도 동일하게 회전");
  console.log("✅ 예상: 개별 회전 없음");
  
  console.log("\n[테스트 3] 360도 경계 스냅");
  console.log("• 락커를 355도 근처로 회전");
  console.log("• 천천히 360도/0도 지점 통과");
  console.log("✅ 예상: 360도에서 스냅 (역회전 없음)");
  console.log("✅ 예상: 다음 회전의 0도로 부드럽게 전환");
  
  // 실시간 모니터링 함수
  window.watchRotation = () => {
    const interval = setInterval(() => {
      const lockers = document.querySelectorAll('[data-locker-id]');
      const data = [];
      lockers.forEach(el => {
        const transform = el.getAttribute('transform');
        if (transform) {
          const match = transform.match(/rotate\(([^,]+)/);
          if (match) {
            data.push({
              id: el.getAttribute('data-locker-id').slice(-6),
              rotation: parseFloat(match[1]).toFixed(1) + '°'
            });
          }
        }
      });
      
      console.clear();
      console.log("%c실시간 회전 모니터", "color: blue; font-weight: bold");
      console.table(data);
      console.log("중지: Ctrl+C 또는 stopWatch()");
    }, 100);
    
    window.stopWatch = () => {
      clearInterval(interval);
      console.log("모니터링 중지됨");
    };
  };
  
  console.log("\n💡 유용한 명령어:");
  console.log("• watchRotation() - 실시간 회전값 모니터링");
  console.log("• stopWatch() - 모니터링 중지");
  
  console.log("\n✨ 모든 수정 완료!");
  console.log("• 그룹 회전 ✓");
  console.log("• 360도 경계 ✓");
  console.log("• 누적 회전 ✓");
})();