# Locker Grouping System - Final Specification

## Overview

The locker grouping system organizes lockers into hierarchical groups based on their proximity and door direction. This system enables efficient management and visualization of locker arrangements in both floor view and front view modes.

## Core Concepts

### 1. Distance Measurement
- **Corner-Based Calculation**: Distance between two lockers is determined by measuring all possible corner-to-corner distances
- **16 Combinations**: Each locker has 4 corners, resulting in 4×4 = 16 possible distance measurements
- **Minimum Distance**: The smallest value among all 16 corner combinations is used

### 2. Relationship Types

#### Adjacent (인접)
Lockers that are very close and facing the same direction:
- **Distance Requirement**: At least 2 corner pairs must have distance < 55px
- **Direction Requirement**: Same door direction (identical rotation angle)
- **Purpose**: Identifies lockers that form a cohesive unit

#### Connected (연결)
Lockers that are close but may have different orientations:
- **Option 1**: At least 1 corner pair with distance < 55px
- **Option 2**: At least 2 corner pairs with distance < 55px AND different door directions
- **Purpose**: Identifies lockers that are related but not necessarily aligned

## Group Hierarchy

### Minor Groups (소그룹)
- **Definition**: Collections of adjacent lockers OR single isolated lockers
- **Formation Rule**: All lockers that are adjacent to each other form a minor group
- **Single Lockers**: Isolated lockers (not adjacent to any other) form their own minor group
- **Characteristics**:
  - All members share the same door direction (for multi-locker groups)
  - Tightly packed arrangement
  - Represent the smallest logical unit of organization

### Major Groups (대그룹)
- **Definition**: Collections of connected minor groups
- **Formation Rule**: Minor groups that have at least one connected relationship form a major group
- **Characteristics**:
  - Can contain minor groups with different door directions
  - Represent larger organizational units
  - May span across different orientations

## Technical Implementation

### Corner Calculation Functions

```javascript
// Get all 4 corners of a locker
const getLockerCorners = (locker: any): Point[] => {
  const x = locker.left || 0
  const y = locker.top || 0
  const width = locker.width || 60
  const height = locker.height || 40
  const rotation = (locker.rotation || 0) * Math.PI / 180
  const cx = x + width / 2
  const cy = y + height / 2
  
  // Define corners relative to center
  const corners = [
    { x: -width/2, y: -height/2 }, // Top-left
    { x: width/2, y: -height/2 },  // Top-right
    { x: width/2, y: height/2 },   // Bottom-right
    { x: -width/2, y: height/2 }   // Bottom-left
  ]
  
  // Apply rotation and translate to world coordinates
  return corners.map(corner => ({
    x: cx + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation),
    y: cy + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation)
  }))
}

// Calculate minimum distance between two lockers using corner points
const getMinCornerDistance = (locker1: any, locker2: any): number => {
  const corners1 = getLockerCorners(locker1)
  const corners2 = getLockerCorners(locker2)
  let minDistance = Infinity
  
  // Check all 16 corner combinations
  for (const c1 of corners1) {
    for (const c2 of corners2) {
      const distance = Math.sqrt(
        Math.pow(c1.x - c2.x, 2) + 
        Math.pow(c1.y - c2.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
    }
  }
  
  return minDistance
}

// Count corner pairs within threshold distance
const countCloseCornerPairs = (locker1: any, locker2: any, threshold: number): number => {
  const corners1 = getLockerCorners(locker1)
  const corners2 = getLockerCorners(locker2)
  let count = 0
  
  for (const c1 of corners1) {
    for (const c2 of corners2) {
      const distance = Math.sqrt(
        Math.pow(c1.x - c2.x, 2) + 
        Math.pow(c1.y - c2.y, 2)
      )
      if (distance < threshold) {
        count++
      }
    }
  }
  
  return count
}
```

### Relationship Detection

```javascript
const CORNER_THRESHOLD = 55 // pixels

// Check if two lockers are adjacent
const isAdjacent = (locker1: any, locker2: any): boolean => {
  const closeCornerPairs = countCloseCornerPairs(locker1, locker2, CORNER_THRESHOLD)
  const rotation1 = normalizeRotation(locker1.rotation || 0)
  const rotation2 = normalizeRotation(locker2.rotation || 0)
  const sameDirection = rotation1 === rotation2
  
  // Adjacent: 2+ close corner pairs AND same direction
  return closeCornerPairs >= 2 && sameDirection
}

// Check if two lockers are connected
const isConnected = (locker1: any, locker2: any): boolean => {
  const closeCornerPairs = countCloseCornerPairs(locker1, locker2, CORNER_THRESHOLD)
  
  if (closeCornerPairs >= 1) {
    // Connected if at least 1 corner pair is close
    return true
  }
  
  // Also connected if 2+ corner pairs are close with different directions
  if (closeCornerPairs >= 2) {
    const rotation1 = normalizeRotation(locker1.rotation || 0)
    const rotation2 = normalizeRotation(locker2.rotation || 0)
    const differentDirection = rotation1 !== rotation2
    return differentDirection
  }
  
  return false
}
```

## Ordering Algorithm

### Clockwise Traversal for Minor Groups

Minor groups within a major group are ordered following a clockwise traversal pattern:

1. **Starting Point**: Begin from the bottom-most locker (or the earliest in clockwise direction from bottom)
2. **Connection Chain**: Follow the chain of adjacent connections
3. **Clockwise Priority**: When multiple adjacent lockers exist, choose the one that continues the clockwise pattern
4. **Chain Completion**: Continue until all lockers in the minor group are ordered

### Visual Example

```
Image 1 Pattern:
      [L1] [L2] [L3]
            ↓
           [L7]
            ↓
           [L8]
            ↓         
           [L9]
            ↓
[L12] ← [L11] ← [L10]

Minor Group 1: L10 → L11 → L12 (bottom chain, right to left)
Minor Group 2: L9 → L8 → L7 → L3 → L2 → L1 (vertical chain up, then horizontal)

Image 2 Pattern:
      [L1] [L2] [L3]
                 ↓
               [L7]
                ↓
              [L8]
               ↓
             [L9]
           ↙
[L12] [L11] [L10]

Order: L10 → L9 → L8 → L7 → L3 → L2 → L1 → L11 → L12

Image 3 Pattern:
        [L1] [L2] [L3]
          ↑
       [L12]        [L7]
          ↑           ↓
       [L11]        [L8]
          ↑           ↓
       [L10]        [L9]
          ↑    ↓    ↓
        [L4] [L5] [L6]
          ↑
       [L16] [L17] [L18]

Multiple minor groups following clockwise chains from bottom positions
```

## Distance Display Requirements

### Information to Display

1. **Within Minor Groups**:
   - Distance between adjacent lockers
   - Show actual pixel distance values
   - Format: "Locker A ↔ Locker B: XXpx"

2. **Between Minor Groups** (within same Major Group):
   - Minimum distance between any two lockers from different minor groups
   - Format: "Minor Group 1 ↔ Minor Group 2: XXpx"

3. **Between Major Groups**:
   - Minimum distance between any two lockers from different major groups
   - Format: "Major Group 1 ↔ Major Group 2: XXpx"

### Display Format Example

```
Major Group 1:
  Minor Group 1-1:
    L1 ↔ L2: 0px (adjacent)
    L2 ↔ L3: 0px (adjacent)
  
  Minor Group 1-2:
    L7 ↔ L8: 0px (adjacent)
    L8 ↔ L9: 0px (adjacent)
  
  Minor Group 1-1 ↔ Minor Group 1-2: 15px (connected)

Major Group 2:
  Minor Group 2-1:
    L10 (single locker)
  
Major Group 1 ↔ Major Group 2: 85px (separated)
```

## Algorithm Flow

### Group Formation Process

1. **Initialize**: Start with all lockers as ungrouped
2. **Find Minor Groups**:
   ```
   For each ungrouped locker:
     - Use BFS to find all adjacent lockers
     - Form a minor group with all adjacent lockers
     - Single lockers form their own minor group
   ```
3. **Find Major Groups**:
   ```
   For each minor group:
     - Use BFS to find all connected minor groups
     - Form a major group with all connected minor groups
   ```
4. **Order Minor Groups**:
   ```
   For each major group:
     - Identify the starting minor group (bottom-most)
     - Follow clockwise traversal through connections
     - Order minor groups based on traversal sequence
   ```
5. **Calculate Distances**:
   ```
   - Calculate distances within each minor group
   - Calculate distances between minor groups
   - Calculate distances between major groups
   ```

## Configuration Constants

```javascript
// Threshold for corner-based proximity detection
const CORNER_THRESHOLD = 55 // pixels (updated from 43px)

// Rotation normalization range
const ROTATION_RANGE = 360 // degrees

// Default locker dimensions (if not specified)
const DEFAULT_WIDTH = 60 // pixels
const DEFAULT_HEIGHT = 40 // pixels
```

## Parent-Child Locker Handling

- **Exclusion Rule**: Child lockers (those with `parentLockrCd` field) are excluded from grouping analysis
- **Filtering**: Apply filter `locker => !locker.parentLockrCd` before grouping
- **Display**: Only parent and standalone lockers are shown in grouping visualization

## Future Enhancements

1. **Dynamic Thresholds**: Allow users to adjust the 43px threshold based on use case
2. **Group Labels**: Automatic naming/numbering of groups
3. **Visual Indicators**: Color coding for different group types
4. **Group Operations**: Bulk operations on entire groups
5. **Performance Optimization**: Spatial indexing for large numbers of lockers

## Testing Scenarios

### Scenario 1: Simple Adjacent Group
- 3 lockers in a row with 0px gaps, same direction
- Expected: Single minor group, single major group

### Scenario 2: Connected Different Directions
- 2 lockers at 90-degree angle, corners touching
- Expected: Two minor groups (different directions), single major group

### Scenario 3: Complex Chain
- Multiple lockers forming L-shape or U-shape patterns
- Expected: Proper clockwise ordering following the chain

### Scenario 4: Isolated Groups
- Multiple clusters of lockers with >43px gaps between clusters
- Expected: Separate major groups for each cluster

## Version History

- **v2.1.0** (Current): Corner-based distance calculation with 55px threshold
- **v2.0.0**: Corner-based distance calculation with 43px threshold
- **v1.0.0** (Deprecated): Center-to-center distance with variable thresholds

## Related Documentation

- [Locker System Overview](./LOCKER_SYSTEM.md)
- [Parent-Child Hierarchy](./features/parent-child-hierarchy-implementation.md)
- [Front View Context Menu](./features/front-view-context-menu.md)