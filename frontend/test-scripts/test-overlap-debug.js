// 락커 겹침 디버그 스크립트
// http://localhost:5174/locker-placement-figma 에서 실행

(() => {
  console.clear();
  console.log("%c=== 락커 겹침 디버그 ===", "color: red; font-size: 18px; font-weight: bold");
  
  // Vue 인스턴스 찾기
  const app = document.querySelector('#app').__vueParentComponent?.appContext?.app;
  if (!app) {
    console.error("Vue app not found");
    return;
  }
  
  // 모든 락커 가져오기
  const lockers = Array.from(document.querySelectorAll('g[data-locker-id]'));
  console.log(`\n총 ${lockers.length}개의 락커 발견`);
  
  // 각 락커의 실제 위치와 크기 확인
  lockers.forEach((lockerElement, index) => {
    const lockerId = lockerElement.getAttribute('data-locker-id');
    const transform = lockerElement.getAttribute('transform');
    const rect = lockerElement.querySelector('rect');
    
    if (rect) {
      const width = parseFloat(rect.getAttribute('width'));
      const height = parseFloat(rect.getAttribute('height'));
      
      // transform에서 translate와 rotate 파싱
      const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      const rotateMatch = transform.match(/rotate\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
      
      if (translateMatch) {
        const x = parseFloat(translateMatch[1]);
        const y = parseFloat(translateMatch[2]);
        const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
        
        console.log(`\n락커 ${index + 1} (${lockerId}):`);
        console.log(`  위치: (${x}, ${y})`);
        console.log(`  크기: ${width} x ${height}`);
        console.log(`  회전: ${rotation}°`);
        console.log(`  영역: [${x}, ${y}] ~ [${x + width}, ${y + height}]`);
      }
    }
  });
  
  // 겹침 검사
  console.log("\n%c=== 겹침 검사 ===", "color: orange; font-weight: bold");
  
  for (let i = 0; i < lockers.length; i++) {
    for (let j = i + 1; j < lockers.length; j++) {
      const locker1 = lockers[i];
      const locker2 = lockers[j];
      
      const transform1 = locker1.getAttribute('transform');
      const transform2 = locker2.getAttribute('transform');
      
      const rect1 = locker1.querySelector('rect');
      const rect2 = locker2.querySelector('rect');
      
      if (rect1 && rect2) {
        const translateMatch1 = transform1.match(/translate\(([^,]+),\s*([^)]+)\)/);
        const translateMatch2 = transform2.match(/translate\(([^,]+),\s*([^)]+)\)/);
        
        if (translateMatch1 && translateMatch2) {
          const x1 = parseFloat(translateMatch1[1]);
          const y1 = parseFloat(translateMatch1[2]);
          const w1 = parseFloat(rect1.getAttribute('width'));
          const h1 = parseFloat(rect1.getAttribute('height'));
          
          const x2 = parseFloat(translateMatch2[1]);
          const y2 = parseFloat(translateMatch2[2]);
          const w2 = parseFloat(rect2.getAttribute('width'));
          const h2 = parseFloat(rect2.getAttribute('height'));
          
          // 겹침 체크 (회전 무시하고 기본 AABB로)
          const overlapX = Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2);
          const overlapY = Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2);
          
          if (overlapX > 0 && overlapY > 0) {
            console.error(`⚠️ 겹침 발견! 락커 ${i+1}과 ${j+1}`);
            console.log(`  겹침 영역: ${overlapX} x ${overlapY}`);
            console.log(`  락커 ${i+1}: [${x1}, ${y1}] ~ [${x1+w1}, ${y1+h1}]`);
            console.log(`  락커 ${j+1}: [${x2}, ${y2}] ~ [${x2+w2}, ${y2+h2}]`);
          }
        }
      }
    }
  }
  
  console.log("\n✅ 겹침 검사 완료");
})();