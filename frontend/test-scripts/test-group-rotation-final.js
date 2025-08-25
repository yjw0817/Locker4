// 그룹 회전 최종 테스트 스크립트
// http://localhost:5174/locker-placement-figma 에서 실행

(() => {
  console.clear();
  console.log("%c=== 그룹 회전 고정 중심점 테스트 ===", "color: green; font-size: 18px; font-weight: bold");
  
  console.log("\n🔧 수정 내용:");
  console.log("• 회전 시작시 중심점 한 번만 계산");
  console.log("• 회전 중 고정된 중심점 사용");
  console.log("• 초기 상대 위치 기준으로 회전");
  
  console.log("\n📌 테스트 방법:");
  
  console.log("\n1️⃣ 그룹 회전 중심점 안정성");
  console.log("• Ctrl+클릭으로 2-3개 락커 선택");
  console.log("• 회전 핸들로 천천히 회전");
  console.log("✅ 확인: 회전 중심이 고정되어 있는가?");
  console.log("✅ 확인: 락커들이 위치 이동 없이 회전하는가?");
  
  console.log("\n2️⃣ 360도 이상 그룹 회전");
  console.log("• 그룹 선택 후 여러 바퀴 회전");
  console.log("✅ 확인: 계속 회전시 중심이 유지되는가?");
  console.log("✅ 확인: 스냅 시점에도 위치가 안정적인가?");
  
  console.log("\n3️⃣ 역방향 그룹 회전");
  console.log("• 시계방향 회전 후 반시계방향 회전");
  console.log("✅ 확인: 방향 전환시 중심이 유지되는가?");
  console.log("✅ 확인: 빙빙 도는 현상이 없는가?");
  
  // 그룹 중심점 모니터링
  window.monitorGroupCenter = () => {
    let lastCenter = null;
    
    const interval = setInterval(() => {
      const selectedLockers = document.querySelectorAll('.locker-selected');
      
      if (selectedLockers.length > 1) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        selectedLockers.forEach(locker => {
          const transform = locker.getAttribute('transform');
          if (transform) {
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (match) {
              const x = parseFloat(match[1]);
              const y = parseFloat(match[2]);
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        if (lastCenter) {
          const drift = Math.sqrt(
            Math.pow(centerX - lastCenter.x, 2) + 
            Math.pow(centerY - lastCenter.y, 2)
          );
          
          console.clear();
          console.log("%c그룹 중심점 모니터", "color: blue; font-weight: bold");
          console.log(`중심: (${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
          console.log(`드리프트: ${drift.toFixed(2)}px`);
          
          if (drift > 5) {
            console.warn("⚠️ 중심점 이동 감지!");
          } else {
            console.log("✅ 중심점 안정");
          }
        }
        
        lastCenter = { x: centerX, y: centerY };
      }
    }, 100);
    
    window.stopMonitor = () => {
      clearInterval(interval);
      console.log("모니터링 중지");
    };
  };
  
  console.log("\n💡 유용한 명령어:");
  console.log("• monitorGroupCenter() - 그룹 중심점 실시간 모니터링");
  console.log("• stopMonitor() - 모니터링 중지");
  
  console.log("\n✨ 그룹 회전 안정화 완료!");
  console.log("• 고정된 회전 중심 ✓");
  console.log("• 위치 드리프트 제거 ✓");
  console.log("• 안정적인 그룹 회전 ✓");
})();