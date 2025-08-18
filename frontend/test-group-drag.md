# Group Dragging Fix - Test Scenarios

## Fixed Issues
1. **Leader-based movement**: Only the clicked locker (leader) determines snapping, all others maintain relative positions
2. **Collision detection**: All selected lockers are excluded from collision checks during group drag
3. **Formation preservation**: Lockers maintain their exact relative positions to the leader

## Test Steps

### Test 1: Basic Group Movement
1. Select multiple lockers (Ctrl+Click or Shift+Click)
2. Drag any selected locker
3. **Expected**: All selected lockers move together maintaining their formation
4. **Expected**: Only the dragged locker snaps to grid/edges, others follow with same delta

### Test 2: Snapping Behavior
1. Select 3-4 lockers in a formation
2. Drag the group near another locker's edge
3. **Expected**: Only the leader locker snaps to the edge
4. **Expected**: Other lockers maintain their relative positions to the leader

### Test 3: Collision Prevention
1. Select a group of lockers
2. Try to drag them into other lockers
3. **Expected**: Movement is blocked if ANY locker in the group would collide
4. **Expected**: Selected lockers don't collide with each other

### Test 4: Different Leader Selection
1. Select multiple lockers
2. Drag from different lockers in the selection
3. **Expected**: The clicked locker becomes the leader for that drag
4. **Expected**: Formation is maintained relative to the current leader

## Implementation Details

### Key Changes:
1. **startDragLocker**: 
   - Stores relative positions of all selected lockers to the leader
   - Identifies the clicked locker as the leader

2. **handleDragMove**:
   - Only applies snapping to the leader locker
   - Calculates delta from leader's movement
   - Maintains exact relative positions for followers
   - Checks collision for entire group before moving

3. **checkCollisionForLocker**:
   - Excludes all selected lockers during group drag
   - Prevents false collision detection within the group

## Console Logs
Monitor console for:
- `[Group Drag] Started with X lockers, leader: locker-id`
- `[Group Drag] Moving X lockers. Leader: locker-id, Delta: {x, y}`
- `[Group Drag] Collision detected, movement blocked` (when collision occurs)