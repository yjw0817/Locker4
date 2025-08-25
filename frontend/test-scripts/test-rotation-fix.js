// Test script for verifying rotation fixes
// Run this in the browser console at http://localhost:5174/locker-placement-figma

(() => {
  console.clear();
  console.log("%c=== Rotation Fix Test ===", "color: blue; font-size: 16px; font-weight: bold");
  
  // Test 1: Check cumulative rotation tracking
  console.log("\n📐 Test 1: Cumulative Rotation Tracking");
  console.log("Instructions:");
  console.log("1. Select a single locker");
  console.log("2. Rotate it past 270 degrees");
  console.log("3. Continue rotating past 360 degrees");
  console.log("Expected: Smooth continuous rotation without reverse spinning");
  
  // Test 2: Group rotation
  console.log("\n👥 Test 2: Multi-Selection Group Rotation");
  console.log("Instructions:");
  console.log("1. Select multiple lockers with Ctrl+Click");
  console.log("2. Rotate the group using any locker's rotation handle");
  console.log("Expected: All lockers rotate together as a group around common center");
  console.log("Expected: Individual lockers should NOT rotate around their own centers");
  
  // Test 3: Snap functionality
  console.log("\n🧲 Test 3: Snap Functionality with Cumulative Rotation");
  console.log("Instructions:");
  console.log("1. Rotate a locker multiple times around (720+ degrees)");
  console.log("2. Check snap points at 0°, 45°, 90°, etc.");
  console.log("Expected: Snap should work at every 45-degree interval regardless of full rotations");
  
  // Helper function to monitor rotation values
  window.monitorRotation = () => {
    const lockers = document.querySelectorAll('[data-locker-id]');
    const rotationData = [];
    
    lockers.forEach(locker => {
      const transform = locker.getAttribute('transform');
      const id = locker.getAttribute('data-locker-id');
      if (transform && transform.includes('rotate')) {
        const match = transform.match(/rotate\(([^)]+)\)/);
        if (match) {
          rotationData.push({
            id: id,
            rotation: match[1]
          });
        }
      }
    });
    
    console.table(rotationData);
    return rotationData;
  };
  
  console.log("\n💡 Helper Commands:");
  console.log("- Type 'monitorRotation()' to see current rotation values");
  console.log("- Watch the console for rotation debug messages");
  
  // Test rotation boundaries
  console.log("\n🔄 Boundary Test Results:");
  const testAngles = [0, 90, 180, 270, 360, 450, 540, 630, 720];
  testAngles.forEach(angle => {
    const normalized = ((angle % 360) + 360) % 360;
    console.log(`Angle: ${angle}° → Normalized: ${normalized}°`);
  });
  
  console.log("\n✅ If all tests pass:");
  console.log("- No reverse rotation at 270/360 degree boundaries");
  console.log("- Multi-selection rotates as unified group");
  console.log("- Snap points work correctly at all rotation values");
})();