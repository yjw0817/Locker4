# Locker Placement System Documentation

## Overview
This document describes the current implementation of the locker placement system in Locker4.

## Core Components

### 1. Main Page Component
**File**: `src/pages/LockerPlacementFigma.vue`
- Manages locker placement, selection, and manipulation
- Handles drag & drop, rotation, and snapping
- Implements collision detection and overlap prevention

### 2. Locker SVG Component
**File**: `src/components/locker/LockerSVG.vue`
- Renders individual locker SVG elements
- Handles rotation with cumulative tracking
- Manages visual scaling and transformations

## Rotation System

### Implementation
The rotation system uses cumulative rotation tracking to prevent visual glitches:

```javascript
// In LockerSVG.vue
const cumulativeRotation = ref(0) // Tracks total rotation

// SVG Transform
:transform="`translate(${locker.x}, ${locker.y}) rotate(${locker.rotation || 0}, ${width/2}, ${height/2})`"
```

### Key Features
- **Cumulative Tracking**: Rotation values accumulate (0 → 360 → 720...) instead of normalizing to 0-359°
- **Smooth Transitions**: No reverse spinning at 360° boundary
- **Group Rotation**: Fixed center point for multi-locker rotation
- **Snap Points**: 15° increments when holding Shift

## Collision Detection & Overlap Prevention

### Drag-Time Collision Detection
When dragging lockers, the system:
1. Checks for collisions with existing lockers
2. If collision detected, searches for nearest valid position
3. Auto-adjusts to prevent overlap while respecting user intent

### Snap System
- **Grid Snap**: 20px grid alignment
- **Adjacent Snap**: Automatic alignment to nearby lockers with 2px gap
- **Rotation-Aware**: Considers rotated boundaries for accurate snapping

### Overlap Resolution
- **Real-time Prevention**: Blocks overlapping during drag
- **Final Validation**: Checks and adjusts position on drag end
- **Manual Fix**: Ctrl+Shift+F to auto-fix all overlaps

## Key Improvements Implemented

### 1. Rotation Stability (Fixed)
- ✅ No more reverse spinning at 270°/360° boundaries
- ✅ Stable group rotation with fixed center point
- ✅ Accurate boundary calculation for rotated lockers

### 2. Overlap Prevention (Fixed)
- ✅ 2px buffer between lockers
- ✅ Rotation-aware collision detection
- ✅ Automatic position adjustment on conflicts

### 3. Snapping System (Enhanced)
- ✅ Works correctly with rotated lockers
- ✅ Maintains consistent gaps
- ✅ Grid and adjacent locker snapping

## Keyboard Shortcuts

- **Ctrl+A**: Select all lockers
- **Ctrl+C/V**: Copy and paste lockers
- **Delete**: Delete selected lockers
- **R**: Rotation hint (use mouse drag on rotation handle)
- **Ctrl+Shift+F**: Fix all overlapping lockers
- **Shift** (while rotating): Snap to 15° increments

## Data Structure

### Locker Object
```javascript
{
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,  // Cumulative rotation value
  status: 'available' | 'occupied',
  zoneId: string,
  // ... other properties
}
```

## Testing

### Manual Testing Points
1. **Rotation**: Rotate beyond 360° to verify smooth transitions
2. **Group Rotation**: Select multiple lockers and rotate
3. **Drag Overlap**: Try dragging lockers on top of each other
4. **Snapping**: Test grid and adjacent locker snapping
5. **Copy/Paste**: Verify copied lockers don't overlap

### Debug Scripts
Available test scripts in the root directory:
- `test-overlap-debug.js`: Check for overlapping lockers
- `test-overlap-final.js`: Final overlap validation

## Known Issues & Limitations

1. **Performance**: Large numbers of lockers (>100) may cause lag
2. **Browser Compatibility**: Tested primarily on Chrome/Edge
3. **Touch Support**: Limited touch/mobile support

## Future Improvements

1. Performance optimization for large locker counts
2. Enhanced touch/mobile support
3. Undo/redo functionality
4. Batch operations for multiple lockers