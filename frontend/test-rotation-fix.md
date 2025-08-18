# Group Rotation Fix - Test Scenarios

## Fixed Issues
1. **Individual Rotation**: Each locker now rotates around its own center, not a group center
2. **Keyboard Support**: R key properly handles both single and multiple selection
3. **Consistent Angles**: All rotations use 45° increments consistently
4. **View Mode Safety**: Rotation values preserved but visually reset in front view

## Implementation Details

### Key Changes:

1. **rotateSelectedLockers**:
   - Removed group center calculation
   - Each locker rotates independently around its own center
   - No position changes during rotation
   - Simplified to just update rotation value

2. **rotateMultipleLockers**:
   - Similar simplification for angle-based rotation
   - Each locker rotates around its own center
   - Maintains 0-359° normalization

3. **Keyboard Handler**:
   - Now checks for multiple selection
   - Calls appropriate function based on selection count
   - Maintains continuous rotation when held

4. **View Mode Handling**:
   - Front view sets rotation to 0 for display only
   - Actual rotation values are preserved in the model

## Test Steps

### Test 1: Single Locker Rotation
1. Select a single locker
2. Press R key
3. **Expected**: Locker rotates 45° clockwise around its own center
4. Press Shift+R
5. **Expected**: Locker rotates 45° counter-clockwise

### Test 2: Multiple Locker Rotation
1. Select multiple lockers (Ctrl+Click)
2. Press R key
3. **Expected**: Each locker rotates 45° around its own center
4. **Expected**: Lockers maintain their positions (no movement)
5. **Expected**: All lockers rotate the same angle

### Test 3: Rotation Button Clicks
1. Select a locker
2. Click the rotation buttons in UI
3. **Expected**: Same behavior as keyboard shortcuts
4. Multi-select and click buttons
5. **Expected**: Each locker rotates independently

### Test 4: Continuous Rotation
1. Select locker(s)
2. Hold R key down
3. **Expected**: Continuous rotation at 100ms intervals
4. Release key
5. **Expected**: Rotation stops immediately

### Test 5: Front View Mode
1. Rotate some lockers in floor view
2. Switch to front view
3. **Expected**: All lockers appear facing forward (rotation = 0)
4. Switch back to floor view
5. **Expected**: Original rotations are preserved

### Test 6: Drag After Rotation
1. Rotate a group of lockers
2. Drag the group
3. **Expected**: Group maintains formation during drag
4. **Expected**: Rotations are preserved during drag

## Console Logs to Monitor
- `[Rotate] Single locker L1: 45°`
- `[Rotate] Locker L1: 0° → 45°`
- `[Rotate] Locker L2: 0° → 45°`
- `[Multi-Select] Rotating X lockers cw by 45°`
- `[Multi-Select] Rotation complete`
- `[Rotation] X개 락커 시계방향 45° 회전`

## Key Points
- No group center calculation
- Each locker rotates independently
- Positions remain unchanged during rotation
- 45° increments for all rotations
- Front view display override doesn't affect actual rotation values