# Group Rotation Position Drift Fix

## Problem Description
When rotating a group of lockers, grid snapping was causing position drift. Lockers that were initially adjacent would develop gaps after rotation due to rounding errors.

## Root Cause
The `rotateSelectedLockers` function was snapping positions to a 20px grid after calculating rotation:
- Calculated position: (62.43, 82.84)
- After grid snap: (60, 80)
- Loss: 2.43px horizontal, 2.84px vertical
- These errors accumulated across all lockers, creating visible gaps

## Solution Applied

### Change in `rotateSelectedLockers` function (line ~2538-2540):

**Before (with grid snapping):**
```javascript
lockerStore.updateLocker(locker.id, {
  x: Math.round(newX / 20) * 20,  // Snap to grid - CAUSES DRIFT
  y: Math.round(newY / 20) * 20,  // Snap to grid - CAUSES DRIFT
  rotation: newRotation
})
```

**After (pixel-perfect rounding only):**
```javascript
lockerStore.updateLocker(locker.id, {
  x: Math.round(newX),  // Just round to nearest pixel
  y: Math.round(newY),  // Just round to nearest pixel
  rotation: newRotation
})
```

## Why This Fix Works

1. **Preserves Relative Distances**: Without grid snapping, the mathematical rotation preserves exact distances between lockers
2. **Prevents Accumulation**: Small rounding errors don't accumulate into visible gaps
3. **Maintains Formation**: The group stays together as a cohesive unit

## Testing Instructions

### Test 1: Adjacent Lockers
1. Place 3 lockers side by side with no gaps:
   ```
   [L1][L2][L3]
   ```
2. Select all (Ctrl+A)
3. Press R to rotate 45°

**Expected Result:**
- Lockers remain adjacent after rotation
- No gaps appear between them
- Formation rotates as one unit

### Test 2: Multiple Rotations
1. Create an L-shape:
   ```
   [L1][L2]
   [L3]
   ```
2. Select all and press R multiple times (8 times = 360°)

**Expected Result:**
- After 360° rotation, lockers return to exact original positions
- No position drift accumulates
- Formation integrity maintained

### Test 3: Complex Formation
1. Create a 2x2 grid:
   ```
   [L1][L2]
   [L3][L4]
   ```
2. Rotate by 45°

**Expected Result:**
- Diamond shape forms with correct spacing
- All relative distances preserved
- No unexpected gaps

## Visual Comparison

### Before Fix (with grid snapping):
Initial:
```
[L1][L2][L3]
```
After 45° rotation - GAPS APPEAR:
```
  [L1]
     [L2]  <- Gap!
        [L3]
```

### After Fix (pixel-perfect):
Initial:
```
[L1][L2][L3]
```
After 45° rotation - NO GAPS:
```
  [L1]
  [L2]
  [L3]
```

## Console Output
Watch for position updates without grid snapping:
```
[Rotate] Locker L1: position (40,100) → (62,83), rotation 0° → 45°
[Rotate] Locker L2: position (80,100) → (91,111), rotation 0° → 45°
```
Note: Positions are now precise (62, 83) instead of snapped (60, 80)

## Trade-offs

### Benefits:
- ✅ Preserves formation perfectly
- ✅ No position drift
- ✅ Mathematically accurate rotation
- ✅ Works for any rotation angle

### Considerations:
- ⚠️ Lockers may not align to grid after rotation
- ⚠️ Manual positioning still snaps to grid (drag operations)
- This is acceptable as rotation accuracy is more important than grid alignment

## Additional Notes

1. **Grid Snapping Still Works for Dragging**: When manually dragging lockers, they still snap to the 20px grid
2. **SVG Rendering Fixed**: The SVG component uses `logicalDimensions` for correct rotation center
3. **Single Locker Rotation**: Unaffected by this change as it only rotates orientation

## Summary
The fix removes grid snapping from group rotation calculations, allowing precise mathematical rotation that preserves the exact relative positions of all lockers in the group. This eliminates position drift and maintains formation integrity through multiple rotations.