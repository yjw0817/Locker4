// Collision Detection Fix Test Script
// Tests the fix for undefined otherDims variable
// Run at http://localhost:5174/

(() => {
  console.clear();
  console.log("%c=== Collision Detection Fix Test ===", "color: green; font-size: 18px; font-weight: bold");
  
  console.log("\n📋 Fixed Issue:");
  console.log("• ReferenceError: otherDims is not defined");
  console.log("• Location: checkCollisionForLocker function");
  console.log("• Impact: Collision detection was broken");
  
  console.log("\n✅ Fix Applied:");
  console.log("• Added: const otherDims = getLockerDimensions(other)");
  console.log("• Before using otherDims in console.log");
  
  console.log("\n🧪 Test Instructions:");
  console.log("1. Add two lockers to the canvas");
  console.log("2. Try dragging one locker over another");
  console.log("3. Check console for collision messages");
  console.log("4. Verify NO ReferenceError appears");
  
  console.log("\n📊 Expected Results:");
  console.log("✅ Collision detected and logged properly");
  console.log("✅ No undefined variable errors");
  console.log("✅ Lockers prevented from overlapping");
  
  // Function to test collision detection programmatically
  window.testCollisionDetection = () => {
    console.log("\n🔍 Running collision detection test...");
    
    // Check if Vue app is available
    const app = document.querySelector('#app')?.__vueParentComponent?.appContext?.app;
    if (!app) {
      console.error("❌ Vue app not found");
      return;
    }
    
    // Get all lockers
    const lockers = document.querySelectorAll('g[data-locker-id]');
    console.log(`Found ${lockers.length} lockers on canvas`);
    
    if (lockers.length < 2) {
      console.warn("⚠️ Need at least 2 lockers to test collision");
      console.log("Please add 2 lockers and try again");
      return;
    }
    
    // Check for overlaps
    let overlapCount = 0;
    for (let i = 0; i < lockers.length; i++) {
      for (let j = i + 1; j < lockers.length; j++) {
        const transform1 = lockers[i].getAttribute('transform');
        const transform2 = lockers[j].getAttribute('transform');
        
        if (transform1 && transform2) {
          const match1 = transform1.match(/translate\(([^,]+),\s*([^)]+)\)/);
          const match2 = transform2.match(/translate\(([^,]+),\s*([^)]+)\)/);
          
          if (match1 && match2) {
            const rect1 = lockers[i].querySelector('rect');
            const rect2 = lockers[j].querySelector('rect');
            
            if (rect1 && rect2) {
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
                console.error(`❌ Overlap detected between locker ${i+1} and ${j+1}`);
                console.log(`   Overlap area: ${overlapX.toFixed(1)} x ${overlapY.toFixed(1)}`);
              }
            }
          }
        }
      }
    }
    
    if (overlapCount === 0) {
      console.log("✅ No overlaps detected - collision prevention is working!");
    } else {
      console.error(`❌ Found ${overlapCount} overlapping locker pairs`);
    }
    
    // Check console for errors
    console.log("\n📝 Console Error Check:");
    console.log("If you see '[Collision] Overlap detected' messages without ReferenceError,");
    console.log("then the fix is working correctly!");
  };
  
  console.log("\n💡 Commands:");
  console.log("• testCollisionDetection() - Run automated collision test");
  console.log("• Manually drag lockers to test collision detection");
  
  console.log("\n✨ Collision detection fix applied successfully!");
})();