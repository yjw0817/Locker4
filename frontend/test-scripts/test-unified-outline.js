// Test unified outline functionality
// Paste this into the browser console on http://localhost:5174/locker-placement-figma

(() => {
  console.clear();
  console.log("%c=== Unified Outline Test ===", "color: blue; font-size: 16px; font-weight: bold");
  
  // Find all locker elements
  const lockers = document.querySelectorAll("[data-locker-id]");
  console.log(`📦 Found ${lockers.length} lockers on the page`);
  
  if (lockers.length < 2) {
    console.error("❌ Need at least 2 lockers to test. Please add more lockers.");
    return;
  }
  
  // Clear any existing selection
  console.log("\n🔄 Clearing existing selection...");
  document.querySelector(".locker-canvas")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  
  setTimeout(() => {
    // Select first two lockers with Ctrl
    console.log("\n📍 Selecting multiple lockers with Ctrl+Click...");
    
    // First locker
    const firstLocker = lockers[0];
    const firstId = firstLocker.getAttribute("data-locker-id");
    console.log(`  1️⃣ Selecting locker: ${firstId}`);
    firstLocker.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      metaKey: false
    }));
    
    setTimeout(() => {
      // Second locker
      const secondLocker = lockers[1];
      const secondId = secondLocker.getAttribute("data-locker-id");
      console.log(`  2️⃣ Adding locker: ${secondId}`);
      secondLocker.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        metaKey: false
      }));
      
      // If there's a third locker, add it too
      if (lockers.length > 2) {
        setTimeout(() => {
          const thirdLocker = lockers[2];
          const thirdId = thirdLocker.getAttribute("data-locker-id");
          console.log(`  3️⃣ Adding locker: ${thirdId}`);
          thirdLocker.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            metaKey: false
          }));
          
          checkResults();
        }, 300);
      } else {
        setTimeout(checkResults, 300);
      }
    }, 300);
  }, 500);
  
  function checkResults() {
    console.log("\n%c📊 Results:", "color: green; font-size: 14px; font-weight: bold");
    
    // Check selected lockers
    const selectedLockers = document.querySelectorAll(".locker-selected");
    console.log(`✅ Selected lockers: ${selectedLockers.length}`);
    
    // Check for unified outlines
    const unifiedOutlines = document.querySelectorAll(".unified-selection-outline");
    console.log(`${unifiedOutlines.length > 0 ? "✅" : "❌"} Unified outlines: ${unifiedOutlines.length}`);
    
    if (unifiedOutlines.length > 0) {
      console.log("\n📐 Unified Outline Details:");
      unifiedOutlines.forEach((outline, i) => {
        const x = outline.getAttribute("x");
        const y = outline.getAttribute("y");
        const width = outline.getAttribute("width");
        const height = outline.getAttribute("height");
        console.log(`  Group ${i + 1}:`);
        console.log(`    Position: (${x}, ${y})`);
        console.log(`    Size: ${width} x ${height}`);
        
        // Get visual bounding box
        const bbox = outline.getBBox();
        console.log(`    BBox: (${bbox.x}, ${bbox.y}) ${bbox.width} x ${bbox.height}`);
      });
    }
    
    // Check individual selection outlines
    const individualOutlines = document.querySelectorAll(".selection-outline:not(.unified-selection-outline)");
    console.log(`\n${individualOutlines.length > 0 ? "⚠️" : "✅"} Individual outlines visible: ${individualOutlines.length}`);
    
    // Look for debug messages in Vue DevTools
    console.log("\n💡 Tips:");
    console.log("  - Check the main console for adjacency detection debug logs");
    console.log("  - Adjacent lockers should show ONE unified outline");
    console.log("  - Non-adjacent lockers should show individual outlines");
    console.log("  - Try selecting lockers that are touching or very close together");
    
    // Get locker positions for debugging
    console.log("\n📍 Locker Positions:");
    selectedLockers.forEach(locker => {
      const id = locker.getAttribute("data-locker-id");
      const transform = locker.getAttribute("transform");
      console.log(`  ${id}: ${transform}`);
    });
  }
})();
