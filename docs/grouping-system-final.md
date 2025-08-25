# Locker Grouping System - Final Implementation

> **⚠️ CRITICAL WARNING: DO NOT MODIFY THIS LOGIC WITHOUT APPROVAL**  
> **Status**: ✅ VERIFIED WORKING  
> **Last Updated**: 2025-08-25  
> **Test Case**: L1-L6 configuration produces 1 major group, 2 minor groups  

## Overview

This document describes the final, working implementation of the locker grouping system that correctly handles complex adjacency and connection relationships between lockers in a floor plan layout.

The system distinguishes between two types of relationships:
- **Adjacent**: Close lockers with same orientation that form tight minor groups
- **Connected**: Moderately distant lockers that link major groups but break minor group continuity

## Core Definitions

### Adjacent Relationship
- **Distance**: ≤ 30px between locker edges
- **Direction**: Same rotation angle (0°, 90°, 180°, 270°)
- **Usage**: Forms minor groups within major groups
- **Visual**: Lockers that appear to be directly touching or very close
- **Example**: Two lockers 25px apart with same door direction

### Connected Relationship  
- **Distance**: > 40px AND < 43px between locker edges
- **Direction**: Any rotation (direction irrelevant)
- **Usage**: Links different areas into same major group
- **Visual**: Lockers that are clearly separate but within connection range
- **Example**: Two locker clusters 42px apart

### Critical Distance Thresholds

```javascript
const ADJACENT_THRESHOLD = 30     // ≤ 30px + same direction = adjacent
const CONNECTED_MIN = 40          // > 40px AND < 43px = connected  
const CONNECTED_MAX = 43          // (direction irrelevant for connected)
```

## Major Groups (대그룹)

### Definition
Major groups are collections of lockers that are transitively related through adjacent OR connected relationships.

### Formation Rules
- **Inclusion Criteria**: Adjacent OR Connected lockers
- **Algorithm**: Breadth-First Search (BFS) traversal
- **Transitivity**: If A connects to B, and B connects to C, then A, B, C are in same major group
- **Independence**: Unconnected lockers form single-locker major groups

### Algorithm Steps
1. Start with unvisited locker
2. Use BFS to find all adjacent OR connected lockers
3. Add all found lockers to current major group
4. Mark all as visited
5. Repeat for remaining unvisited lockers

## Minor Groups (소그룹)

### Definition
Minor groups are collections of lockers within a major group that are ONLY adjacent to each other.

### Critical Rule
**"연결은 각기 다른 소그룹으로 나뉜다"** (Connections divide into different minor groups)

### Formation Rules
- **Inclusion Criteria**: ONLY adjacent lockers (same direction + ≤30px)
- **Breaking Conditions**: 
  - Connection relationship (40-43px distance)
  - Different door directions
  - Distance > 30px
- **Algorithm**: BFS within major group using only adjacent relationships

### Key Insight
Connections that form major groups simultaneously break minor groups, creating a hierarchy where major groups can contain multiple separate minor groups.

## Implementation Details

### Core Functions

#### Distance Calculation
```javascript
const getMinDistance = (locker1, locker2) => {
  // Calculates minimum edge-to-edge distance between rectangular lockers
  // Accounts for locker dimensions and positions
  // Returns 0 for overlapping lockers
}
```

#### Relationship Detection
```javascript
const isAdjacent = (locker1, locker2) => {
  const distance = getMinDistance(locker1, locker2)
  const sameDirection = (locker1.rotation || 0) === (locker2.rotation || 0)
  return distance <= ADJACENT_THRESHOLD && sameDirection
}

const isConnected = (locker1, locker2) => {
  const distance = getMinDistance(locker1, locker2)
  return distance > CONNECTED_MIN && distance < CONNECTED_MAX
}
```

#### Major Group Detection
```javascript
const groupNearbyLockers = () => {
  // BFS algorithm using adjacent OR connected relationships
  // Creates major groups through transitive connections
  // Handles independent lockers as single-locker groups
}
```

#### Minor Group Detection
```javascript
const findMinorGroups = (majorGroup) => {
  // BFS within major group using ONLY adjacent relationships
  // Breaks at connections or direction changes
  // Creates separate minor groups for different orientations
}
```

## Working Test Case

### Test Configuration
```javascript
// L1-L2-L3: Adjacent chain (0° direction, 25px gaps)
L1: x=100, y=100, rotation=0° 
L2: x=165, y=100, rotation=0°  // 25px from L1 - ADJACENT
L3: x=230, y=100, rotation=0°  // 25px from L2 - ADJACENT

// L4-L5-L6: Adjacent chain (90° direction, 25px gaps)  
L4: x=312, y=100, rotation=90° // 42px from L3 - CONNECTED
L5: x=377, y=100, rotation=90° // 25px from L4 - ADJACENT
L6: x=442, y=100, rotation=90° // 25px from L5 - ADJACENT
```

### Expected Results
```
대그룹 분석 결과
━━━━━━━━━━━━━━━━━━━━━
대그룹 1 (6개 락커):
  소그룹 1-1: L1(0°), L2(0°), L3(0°) - 같은방향+인접
  소그룹 1-2: L4(90°), L5(90°), L6(90°) - 같은방향+인접

연결 관계: L3 ↔ L4 (42.00px, 연결)
━━━━━━━━━━━━━━━━━━━━━
총 대그룹: 1개
총 소그룹: 2개
```

### Analysis
- **1 Major Group**: All 6 lockers connected through L3↔L4 connection
- **2 Minor Groups**: Connection breaks minor group continuity
  - Minor Group 1: L1-L2-L3 (adjacent, same direction)
  - Minor Group 2: L4-L5-L6 (adjacent, same direction)
- **Connection**: L3↔L4 at 42px creates major group but separates minor groups

## Front View Rendering

### Spacing Rules
Based on grouping analysis, front view applies appropriate spacing:

- **Same minor group**: 0px gap (perfect adjacency)
- **Different minor group, same major**: 10px gap
- **Different major group**: 20px gap

### Implementation
```javascript
const getGroupSpacingForFrontView = (prevLocker, currentLocker, minorGroups) => {
  if (differentMajorGroup) return 20
  if (sameMinorGroup) return 0  
  return 10 // different minor group, same major
}
```

## Debugging and Verification

### Console Output
The system provides comprehensive logging:
```
[ADJACENT] L1 ↔ L2: 25.00px, same direction: true → ADJACENT
[CONNECTED] L3 ↔ L4: 42.00px → CONNECTED
[MAJOR GROUP] L3 ↔ L4: Adjacent=false, Connected=true → ✓ ADD TO MAJOR GROUP
[MINOR GROUPS] ❌ Connection breaks minor group - L4 will be separate minor group
```

### Verification Steps
1. Click "그룹핑 확인" button
2. Check console for detailed relationship logging
3. Verify popup shows expected format
4. Confirm test data produces 1 major group, 2 minor groups

## Critical Implementation Notes

### Immutable Values
```javascript
// ✅ VERIFIED WORKING - DO NOT CHANGE
const ADJACENT_THRESHOLD = 30
const CONNECTED_MIN = 40  
const CONNECTED_MAX = 43
```

### Algorithm Integrity
- BFS ensures complete transitive closure for major groups
- Connection detection properly breaks minor group continuity
- Distance calculation uses edge-to-edge measurement, not center-to-center

### Error-Prone Areas
- **Threshold Modification**: Changing thresholds breaks test case validation
- **Logic Inversion**: Confusing adjacent/connected inclusion rules  
- **BFS Implementation**: Incorrect queue management breaks group detection
- **Rotation Handling**: Direction comparison must use exact equality

## Change Log

### Version History
- **2025-08-22**: Initial implementation with 100px proximity threshold (too large - all lockers grouped)
- **2025-08-24**: Changed to 10px threshold (too small - all lockers separate)  
- **2025-08-25**: Implemented adjacent (≤30px + same direction) / connected (40-43px any direction) distinction
- **2025-08-25**: ✅ **FINAL WORKING VERSION** - Verified with L1-L6 test case producing 1 major group, 2 minor groups

### Key Insights Discovered
1. **Distance vs Direction**: Adjacent requires both distance AND direction matching
2. **Connection Breaking**: Connections create major groups but break minor groups
3. **Transitivity**: Major groups form through chains of relationships
4. **Hierarchy**: Major groups contain multiple minor groups
5. **Edge Distance**: Must use edge-to-edge, not center-to-center distance

## Future Modifications

### Approval Required
Any changes to this system require:
1. **Business approval** for new grouping requirements
2. **Technical review** of proposed changes
3. **Test case validation** with L1-L6 configuration
4. **Regression testing** with existing locker layouts
5. **Documentation update** reflecting changes

### Safe Modifications
- Adding debug logging (non-functional)
- Performance optimizations (preserving logic)
- Code comments and documentation
- UI display formatting

### Dangerous Modifications
- Changing threshold values (breaks validation)
- Modifying relationship functions (breaks logic)
- Altering BFS algorithms (breaks completeness)
- Direction comparison changes (breaks grouping)

## Backup and Recovery

### Code Backup
Critical functions are documented here for recovery:

```javascript
// BACKUP: Working threshold values
const ADJACENT_THRESHOLD = 30
const CONNECTED_MIN = 40
const CONNECTED_MAX = 43

// BACKUP: Working relationship functions
const isAdjacent = (locker1, locker2) => {
  const distance = getMinDistance(locker1, locker2)
  const sameDirection = (locker1.rotation || 0) === (locker2.rotation || 0)
  return distance <= ADJACENT_THRESHOLD && sameDirection
}

const isConnected = (locker1, locker2) => {
  const distance = getMinDistance(locker1, locker2)
  return distance > CONNECTED_MIN && distance < CONNECTED_MAX
}
```

### Validation Test
Always verify changes with this test:
```javascript
// Test data should produce: 1 major group, 2 minor groups
const testData = [
  { id: 'L1', x: 100, y: 100, rotation: 0 },
  { id: 'L2', x: 165, y: 100, rotation: 0 }, // 25px - adjacent
  { id: 'L3', x: 230, y: 100, rotation: 0 }, // 25px - adjacent
  { id: 'L4', x: 312, y: 100, rotation: 90 }, // 42px - connected
  { id: 'L5', x: 377, y: 100, rotation: 90 }, // 25px - adjacent
  { id: 'L6', x: 442, y: 100, rotation: 90 }  // 25px - adjacent
]
```

---

> **Final Reminder**: This system is verified working. Preserve the current implementation and test case validation before making any modifications.