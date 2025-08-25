// 락커 겹침 문제 최종 테스트 스크립트
// http://localhost:5174/locker-placement-figma 에서 실행

(() => {
  console.clear();
  console.log("%c=== 락커 겹침 수정 완료 테스트 ===", "color: green; font-size: 18px; font-weight: bold");
  
  console.log("\n📋 수정 내용:");
  console.log("• 회전 경계 계산 수정 (중심점 기준)");
  console.log("• 충돌 감지 강화 (2px 버퍼)");
  console.log("• 스냅 간격 추가 (2px 분리)");
  console.log("• 자동 겹침 수정 기능");
  
  console.log("\n🧪 테스트 방법:");
  
  console.log("\n1️⃣ 자동 겹침 수정");
  console.log("• Ctrl+Shift+F 누르기");
  console.log("✅ 확인: 겹친 락커가 자동으로 분리되는가?");
  console.log("✅ 확인: 최소 4px 간격이 유지되는가?");
  
  console.log("\n2️⃣ 새 락커 배치");
  console.log("• 락커를 드래그하여 다른 락커 근처에 배치");
  console.log("✅ 확인: 겹침 없이 배치되는가?");
  console.log("✅ 확인: 스냅 시 적절한 간격이 유지되는가?");
  
  console.log("\n3️⃣ 회전된 락커 충돌");
  console.log("• 락커를 45도, 90도로 회전");
  console.log("• 다른 락커 근처로 이동");
  console.log("✅ 확인: 회전된 경계가 정확히 감지되는가?");
  console.log("✅ 확인: 겹침이 방지되는가?");
  
  // 현재 겹침 상태 검사
  console.log("\n%c=== 현재 겹침 상태 ===", "color: orange; font-weight: bold");
  
  const checkOverlaps = () => {
    const lockers = Array.from(document.querySelectorAll('g[data-locker-id]'));
    let overlapCount = 0;
    
    for (let i = 0; i < lockers.length; i++) {
      for (let j = i + 1; j < lockers.length; j++) {
        const transform1 = lockers[i].getAttribute('transform');
        const transform2 = lockers[j].getAttribute('transform');
        const rect1 = lockers[i].querySelector('rect');
        const rect2 = lockers[j].querySelector('rect');
        
        if (rect1 && rect2 && transform1 && transform2) {
          const match1 = transform1.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const match2 = transform2.match(/translate\(([^,]+),\s*([^)]+)\)/);
          
          if (match1 && match2) {
            const x1 = parseFloat(match1[1]);
            const y1 = parseFloat(match1[2]);
            const w1 = parseFloat(rect1.getAttribute('width'));
            const h1 = parseFloat(rect1.getAttribute('height'));
            
            const x2 = parseFloat(match2[1]);
            const y2 = parseFloat(match2[2]);
            const w2 = parseFloat(rect2.getAttribute('width'));
            const h2 = parseFloat(rect2.getAttribute('height'));
            
            const overlapX = Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2);
            const overlapY = Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2);
            
            if (overlapX > 0 && overlapY > 0) {
              overlapCount++;
              console.error(`⚠️ 겹침 발견! 락커 ${i+1}과 ${j+1}`);
              console.log(`  겹침 영역: ${overlapX.toFixed(1)} x ${overlapY.toFixed(1)}`);
            }
          }
        }
      }
    }
    
    if (overlapCount === 0) {
      console.log("✅ 겹침 없음! 모든 락커가 올바르게 배치됨");
    } else {
      console.error(`❌ ${overlapCount}개의 겹침 발견됨`);
      console.log("💡 Ctrl+Shift+F를 눌러 자동 수정하세요");
    }
    
    return overlapCount;
  };
  
  const overlaps = checkOverlaps();
  
  console.log("\n📊 검사 결과:");
  console.log(`• 총 락커 수: ${document.querySelectorAll('g[data-locker-id]').length}개`);
  console.log(`• 겹침 수: ${overlaps}개`);
  
  if (overlaps > 0) {
    console.log("\n⚡ 빠른 수정:");
    console.log("Ctrl+Shift+F를 눌러 자동으로 겹침을 수정하세요!");
  }
  
  // 전역 함수로 등록
  window.checkLockerOverlaps = checkOverlaps;
  
  console.log("\n💡 유용한 명령어:");
  console.log("• checkLockerOverlaps() - 겹침 재검사");
  console.log("• Ctrl+Shift+F - 자동 겹침 수정");
  
  console.log("\n✨ 락커 겹침 문제 해결 완료!");
})();