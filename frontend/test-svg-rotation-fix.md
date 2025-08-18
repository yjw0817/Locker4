# SVG Group Rotation Rendering Fix

## Problems Fixed

### Issue 1: SVG Transform Using Wrong Dimensions
**Before:** Used `locker.width/2` and `locker.height/2` directly
**After:** Uses `logicalDimensions.width/2` and `logicalDimensions.height/2` which correctly accounts for view mode

### Issue 2: Rotation Center Calculation
**Before:** Rotated locker's top-left corner around group center
**After:** Rotates locker's center point around group center

## Code Changes

### 1. LockerSVG.vue (Line 4)
```vue
// Before:
:transform="`translate(${locker.x}, ${locker.y}) rotate(${locker.rotation || 0}, ${locker.width/2}, ${locker.height/2})`"

// After:
:transform="`translate(${locker.x}, ${locker.y}) rotate(${locker.rotation || 0}, ${logicalDimensions.width/2}, ${logicalDimensions.height/2})`"
```

### 2. LockerPlacementFigma.vue (rotateSelectedLockers function)
```javascript
// Before: Used top-left corner for rotation
const relX = locker.x - centerX
const relY = locker.y - centerY

// After: Uses locker's center for rotation
const lockerCenterX = locker.x + dims.width / 2
const lockerCenterY = locker.y + dims.height / 2
const relX = lockerCenterX - centerX
const relY = lockerCenterY - centerY

// And converts back to top-left after rotation:
const newX = newCenterX - dims.width / 2
const newY = newCenterY - dims.height / 2
```

## How It Works Now

1. **Group Center Calculation**: Finds the center of all selected lockers' bounding box
2. **Individual Center Calculation**: For each locker, calculates its center point
3. **Rotation Math**: Rotates each locker's center around the group center
4. **Position Update**: Converts the new center back to top-left corner coordinates
5. **SVG Rendering**: SVG properly rotates around each locker's own center using correct dimensions

## Testing Instructions

### Test 1: Basic Group Rotation
1. Place 3 lockers in a row: `[1][2][3]`
2. Select all three (Ctrl+A)
3. Press R to rotate 45°

**Expected Result:**
- The entire row rotates as one unit
- Lockers maintain their relative positions
- Each locker also rotates individually by 45°

### Test 2: L-Shape Formation
1. Create an L-shape with lockers:
   ```
   [1][2]
   [3]
   ```
2. Select all and press R

**Expected Result:**
- The L-shape rotates around its center
- Formation is preserved
- After 90° rotation, should look like:
   ```
      [3]
   [2][1]
   ```

### Test 3: Grid Snapping
1. Create any formation
2. Rotate by 45°

**Expected Result:**
- After rotation, all positions snap to 20px grid
- Lockers remain aligned to grid lines

## Console Output
Watch for these messages:
```
[Multi-Select] Rotating 3 lockers as GROUP cw by 45°
[Multi-Select] Group center: {centerX: 100, centerY: 100}
[Rotate] Locker L1: position (40,80) → (60,60), rotation 0° → 45°
[Rotate] Locker L2: position (80,80) → (100,80), rotation 0° → 45°
[Rotate] Locker L3: position (120,80) → (120,120), rotation 0° → 45°
[Multi-Select] Group rotation complete
```

## Visual Verification

### Before Fix:
- Lockers would appear to move to new positions
- But each would rotate around its own center
- Formation would appear distorted

### After Fix:
- Entire formation rotates as one cohesive unit
- Individual rotations are correct
- Formation is preserved perfectly

## Key Points
- Single locker rotation still works normally (rotates around its own center)
- Group rotation now correctly rotates the formation around the group center
- Both position and rotation are updated correctly
- SVG rendering now uses the correct dimensions and rotation center