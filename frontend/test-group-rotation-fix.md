# Group Rotation Fix - Testing Guide

## Problem Fixed
The keyboard handler was calling `rotateMultipleLockers(angle)` which rotated each locker individually around its own center, instead of `rotateSelectedLockers(direction)` which rotates the group as a whole around a common center point.

## Code Change Made
In `handleKeyDown` function (line ~2691-2702):

### Before (Incorrect):
```javascript
if (selectedCount > 1) {
  // Multiple lockers selected - rotate each around its own center
  if (!rotateInterval) {
    // First rotation
    rotateMultipleLockers(angle)  // ❌ Individual rotation
    
    // Continuous rotation if key is held
    rotateInterval = window.setInterval(() => {
      rotateMultipleLockers(angle)  // ❌ Individual rotation
    }, 100)
  }
}
```

### After (Fixed):
```javascript
if (selectedCount > 1) {
  // Multiple lockers selected - rotate as GROUP around common center
  if (!rotateInterval) {
    // First rotation
    const direction = angle > 0 ? 'cw' : 'ccw'
    rotateSelectedLockers(direction)  // ✅ Group rotation
    
    // Continuous rotation if key is held
    rotateInterval = window.setInterval(() => {
      rotateSelectedLockers(direction)  // ✅ Group rotation
    }, 100)
  }
}
```

## Testing Instructions

### Test 1: Group Rotation
1. Open http://localhost:3003/locker-placement
2. Double-click to place 3-4 lockers on the canvas
3. Select all lockers with Ctrl+A or select multiple with Ctrl+Click
4. Press R key

**Expected Result:**
- All selected lockers rotate as a GROUP around their collective center
- The formation is maintained (relative positions preserved)
- Each locker's position changes as it orbits around the group center
- Like rotating a photograph with multiple objects

### Test 2: Counter-clockwise Rotation
1. Select multiple lockers
2. Press Shift+R

**Expected Result:**
- Group rotates counter-clockwise around common center
- Formation maintained

### Test 3: Continuous Rotation
1. Select multiple lockers
2. Hold R key down

**Expected Result:**
- Group continues rotating every 100ms
- Smooth rotation around group center
- Release key to stop

### Test 4: Single Locker Rotation (Unchanged)
1. Select only one locker
2. Press R

**Expected Result:**
- Single locker rotates around its own center
- Behavior unchanged from before

## Console Output to Verify
Watch for these console messages when rotating a group:

```
[Multi-Select] Rotating 3 lockers as GROUP cw by 45°
[Multi-Select] Group center: {centerX: 150, centerY: 200}
[Rotate] Locker L1: position (100,150) → (120,180), rotation 0° → 45°
[Rotate] Locker L2: position (150,150) → (150,180), rotation 0° → 45°
[Rotate] Locker L3: position (200,150) → (180,180), rotation 0° → 45°
[Multi-Select] Group rotation complete
```

## Visual Verification
- Before rotation: Lockers in a formation (e.g., square, L-shape)
- During rotation: Entire formation rotates as one unit
- After rotation: Formation preserved but rotated 45°
- Positions are snapped to 20px grid after rotation

## Key Differences
| Aspect | Before (Bug) | After (Fixed) |
|--------|--------------|---------------|
| Function Called | `rotateMultipleLockers` | `rotateSelectedLockers` |
| Rotation Center | Each locker's own center | Group's common center |
| Position Change | No position changes | Positions change (orbit) |
| Formation | Not preserved | Preserved |
| Visual Effect | Individual spinning | Group rotation |