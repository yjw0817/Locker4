# Collision Detection Fix - Undefined Variable Error

## 🐛 Bug Description

### Issue
- **Error**: `ReferenceError: otherDims is not defined`
- **Location**: `checkCollisionForLocker` function, line ~3992
- **Impact**: Collision detection system failed, allowing lockers to overlap

### Root Cause
The collision detection function tried to log collision information using `otherDims.width` and `otherDims.height`, but the `otherDims` variable was never defined in that scope.

## 🔧 Fix Applied

### Code Change
**File**: `src/pages/LockerPlacementFigma.vue`

**Before** (broken):
```javascript
if (hasOverlap) {
  console.log('[Collision] Overlap detected between lockers:', {
    movingLocker: { x, y, width, height, rotation },
    existingLocker: { x: other.x, y: other.y, width: otherDims.width, height: otherDims.height, rotation: other.rotation },
    // ^^^^^^^^^ ReferenceError: otherDims is not defined
  })
}
```

**After** (fixed):
```javascript
if (hasOverlap) {
  // Get the dimensions of the other locker for logging
  const otherDims = getLockerDimensions(other)
  
  console.log('[Collision] Overlap detected between lockers:', {
    movingLocker: { x, y, width, height, rotation },
    existingLocker: { x: other.x, y: other.y, width: otherDims.width, height: otherDims.height, rotation: other.rotation },
    // Now otherDims is properly defined
  })
}
```

## ✅ Testing

### Test Script
A test script is available at: `test-scripts/test-collision-fix.js`

### Manual Testing Steps
1. Open the locker placement page
2. Add two lockers to the canvas
3. Drag one locker over another
4. Open browser console and verify:
   - Collision messages appear when lockers overlap
   - NO `ReferenceError` appears
   - Lockers are prevented from overlapping

### Expected Console Output
```
[Collision] Overlap detected between lockers: {
  movingLocker: { x: 100, y: 100, width: 60, height: 60, rotation: 0 },
  existingLocker: { x: 150, y: 150, width: 60, height: 60, rotation: 0 },
  overlapX: 10,
  overlapY: 10,
  checkBounds: {...},
  otherBounds: {...}
}
```

## 📊 Impact

### Before Fix
- ❌ ReferenceError thrown on every collision
- ❌ Collision detection failed silently
- ❌ Lockers could overlap without restriction

### After Fix
- ✅ Proper error-free collision logging
- ✅ Collision detection works correctly
- ✅ Lockers prevented from overlapping

## 🎯 Result

The collision detection system is now fully functional:
- No more undefined variable errors
- Proper collision prevention during drag operations
- Clear console logging for debugging
- Maintains 2px buffer between lockers

## 📝 Notes

- The fix was simple but critical for core functionality
- Similar pattern found in `checkCollision` function but it properly defines `otherDims`
- Test script added for regression testing

## Date Fixed
2024-12-22