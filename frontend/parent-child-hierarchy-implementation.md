# Parent-Child Locker Hierarchy Implementation

## Overview
A comprehensive parent-child locker hierarchy system with dual numbering for floor and front view modes has been implemented.

## Core Concepts

### 1. Parent Lockers
- Original lockers created in floor placement mode
- Appear as bottom tier in front view
- Have zone management numbers (shown only in floor view)
- Can have multiple child lockers (tiers)

### 2. Child Lockers
- Created via "단수 입력" (Add Tiers) in front view
- Stack vertically above parent lockers
- Inherit parent's X/Y position in floor view (hidden)
- Have tier levels (1, 2, 3, etc.)
- Can have assignment numbers (shown only in front view)

### 3. Dual Numbering System
- **Floor View Numbers**: Zone management numbers (`number` field)
  - Only shown for parent lockers
  - Used for physical zone organization
  
- **Front View Numbers**: Assignment numbers (`frontViewNumber` field)
  - Shown for all lockers (parents and children)
  - Used for locker assignment to members

## Implementation Details

### Data Structure Updates
Updated `Locker` interface in `/frontend/src/stores/lockerStore.ts`:
```typescript
export interface Locker {
  // ... existing fields ...
  
  // Parent-child relationship
  parentLockerId?: string | null     // null = parent locker
  childLockerIds?: string[]          // IDs of child lockers
  tierLevel?: number                 // 0 = parent, 1+ = child tiers
  
  // Front view specific
  frontViewX?: number                // X position in front view
  frontViewY?: number                // Y position in front view  
  frontViewNumber?: string           // Assignment number for front view
  actualHeight?: number              // Actual height for front view rendering
  
  // Visibility control
  isVisible?: boolean                // Control visibility in floor view
  isAnimating?: boolean              // Animation state flag
  hasError?: boolean                 // Error state flag
}
```

### Key Features Implemented

#### 1. Mode-Specific Visibility
- **Floor View**: Only parent lockers visible
- **Front View**: All lockers visible (parents + children)

```javascript
const displayLockers = computed(() => {
  const filteredLockers = currentLockers.value.filter(locker => {
    if (currentViewMode.value === 'floor') {
      return !locker.parentLockerId  // Only parents
    }
    return true  // All lockers
  })
  // ... transformation logic
})
```

#### 2. Front View Selection Fix
Selection now works correctly at transformed positions:
```javascript
if (currentViewMode.value === 'front') {
  // Use front view positions for hit detection
  const frontX = locker.frontViewX !== undefined ? locker.frontViewX : locker.x
  const frontY = locker.frontViewY !== undefined ? locker.frontViewY : locker.y
  // ... selection logic
}
```

#### 3. Parent Deletion Protection
Warns user when deleting parent lockers with children:
```javascript
if (parentLockersWithChildren.length > 0) {
  const confirmed = confirm(
    `락커 ${lockerNumbers}에 배치된 상위 락커가 있습니다.\n` +
    `삭제하시면 배치된 모든 상위 락커가 함께 삭제됩니다.\n` +
    `계속하시겠습니까?`
  )
  if (!confirmed) return
  // Add all children to deletion list
}
```

#### 4. Tier Management
"단수 입력" (Add Tiers) creates proper parent-child relationships:
```javascript
const newLocker = {
  // Parent-child relationship
  parentLockerId: parentLocker.id,
  tierLevel: newTierLevel,
  
  // Front view position (stack above)
  frontViewX: parentLocker.frontViewX || parentLocker.x,
  frontViewY: (parentLocker.frontViewY || parentLocker.y) - ((tierHeight + gap) * newTierLevel),
  
  // Dual numbering
  number: '',  // Floor view number (empty for children)
  frontViewNumber: '',  // Front view assignment number
}
```

#### 5. Dual Number Display
Numbers displayed based on current view mode:
```javascript
const getDisplayNumber = () => {
  if (props.viewMode === 'floor') {
    // Show zone management number (only for parents)
    return !props.locker.parentLockerId ? props.locker.number : ''
  } else {
    // Show assignment number
    return props.locker.frontViewNumber || ''
  }
}
```

#### 6. Context Menu Integration
Number assignment/deletion respects current view mode:
```javascript
if (isFloorView) {
  lockerStore.updateLocker(locker.id, { number: `L${currentNum}` })
} else {
  lockerStore.updateLocker(locker.id, { frontViewNumber: `L${currentNum}` })
}
```

## Usage Guide

### Floor View Mode (평면배치모드)
1. **Visibility**: Only parent lockers shown
2. **Numbers**: Zone management numbers displayed
3. **Selection**: ✅ Enabled
4. **Movement**: ✅ Enabled
5. **Copy/Paste**: ✅ Enabled
6. **Context Menu**: ❌ Disabled

### Front View Mode (세로배치모드)
1. **Visibility**: All lockers shown (parents + children)
2. **Numbers**: Assignment numbers displayed
3. **Selection**: ✅ Enabled (works at transformed positions)
4. **Movement**: ❌ Disabled
5. **Copy/Paste**: ❌ Disabled
6. **Context Menu**: ✅ Enabled
   - 단수 입력 (Add Tiers): Creates child lockers
   - 번호 부여 (Assign Numbers): Assigns front view numbers
   - 번호 삭제 (Delete Numbers): Removes front view numbers

## Testing Checklist

✅ **Data Structure**
- Locker interface updated with parent-child fields
- Dual numbering fields added

✅ **Selection**
- Front view selection works at transformed positions
- Multi-select works in both views

✅ **Deletion Protection**
- Parent deletion warns about children
- Cascading deletion works correctly

✅ **Tier Management**
- "단수 입력" creates proper child lockers
- Children stack above parents in front view
- Parent-child relationships maintained

✅ **Visibility**
- Floor view shows only parents
- Front view shows all lockers

✅ **Dual Numbering**
- Floor view shows zone numbers (parents only)
- Front view shows assignment numbers (all lockers)
- Number assignment respects view mode
- Number deletion respects view mode

## Future Enhancements

1. **Animation System**
   - Smooth transitions between views
   - Unfold/fold animations for tiers

2. **Member Assignment**
   - Integrate with member database
   - Display member info on hover
   - Expiry date management

3. **Advanced Features**
   - Bulk tier operations
   - Tier templates
   - Export/import configurations

4. **Visual Enhancements**
   - Color coding by status
   - Tier level indicators
   - Parent-child connection lines

## Files Modified

1. `/frontend/src/stores/lockerStore.ts` - Data structure updates
2. `/frontend/src/pages/LockerPlacementFigma.vue` - Main implementation
3. `/frontend/src/components/locker/LockerSVG.vue` - Display logic

The implementation provides a solid foundation for a comprehensive locker management system with proper parent-child relationships and dual numbering support.