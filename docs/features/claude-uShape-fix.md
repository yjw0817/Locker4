## Task: Simplify and Fix U-Shape Detection for Front View

**Project Path**: `/Users/yunjeong-won/Desktop/Locker4`

**Main File**: 
- `frontend/src/pages/LockerPlacementFigma.vue`

### Current Problem
The U-shape detection and unfolding logic is too complex and not working properly. Need a simpler, more reliable approach.

### Implementation Requirements

```javascript
// Simplified approach: Sort all lockers by position and unfold in walking order

const transformToFrontView = () => {
  console.log('[Front View] Starting transformation with user perspective')
  
  const lockers = currentLockers.value
  
  if (lockers.length === 0) {
    console.log('[Front View] No lockers to transform')
    return
  }
  
  // Simple approach: Detect U-shape by checking if lockers form 3 sides
  const bounds = {
    minX: Math.min(...lockers.map(l => l.x)),
    maxX: Math.max(...lockers.map(l => l.x + l.width)),
    minY: Math.min(...lockers.map(l => l.y)),
    maxY: Math.max(...lockers.map(l => l.y + (l.depth || l.height)))
  }
  
  // Categorize lockers by position
  const topRow = []
  const rightColumn = []
  const bottomRow = []
  const leftColumn = []
  const middle = []
  
  lockers.forEach(locker => {
    const isTop = Math.abs(locker.y - bounds.minY) < 30
    const isBottom = Math.abs(locker.y + (locker.depth || locker.height) - bounds.maxY) < 30
    const isLeft = Math.abs(locker.x - bounds.minX) < 30
    const isRight = Math.abs(locker.x + locker.width - bounds.maxX) < 30
    
    if (isTop && !isLeft && !isRight) {
      topRow.push(locker)
    } else if (isBottom && !isLeft && !isRight) {
      bottomRow.push(locker)
    } else if (isRight && !isTop && !isBottom) {
      rightColumn.push(locker)
    } else if (isLeft && !isTop && !isBottom) {
      leftColumn.push(locker)
    } else if (isTop && isRight) {
      // Top-right corner
      rightColumn.push(locker) // Include in right column
    } else if (isBottom && isRight) {
      // Bottom-right corner
      rightColumn.push(locker) // Include in right column
    } else {
      middle.push(locker)
    }
  })
  
  // Sort each group
  topRow.sort((a, b) => a.x - b.x) // Left to right
  rightColumn.sort((a, b) => a.y - b.y) // Top to bottom
  bottomRow.sort((a, b) => b.x - a.x) // Right to left
  leftColumn.sort((a, b) => b.y - a.y) // Bottom to top
  
  // Build unfolded sequence based on detected shape
  let unfoldedSequence = []
  
  // U-shape (ㄷ) pattern
  if (topRow.length > 0 && rightColumn.length > 0 && bottomRow.length > 0) {
    console.log('[U-Shape] Detected ㄷ pattern')
    unfoldedSequence = [...topRow, ...rightColumn, ...bottomRow]
    
    console.log('[U-Shape] Walking order:', {
      top: topRow.map(l => \`L\${l.number}\`).join('→'),
      right: rightColumn.map(l => \`L\${l.number}\`).join('→'),
      bottom: bottomRow.map(l => \`L\${l.number}\`).join('→'),
      total: unfoldedSequence.map(l => \`L\${l.number}\`).join('→')
    })
  }
  // Back-to-back columns
  else if (leftColumn.length > 0 && rightColumn.length > 0) {
    console.log('[Back-to-Back] Detected two columns')
    unfoldedSequence = [...leftColumn, ...rightColumn]
  }
  // Simple row
  else {
    console.log('[Simple Row] Single line of lockers')
    unfoldedSequence = [...lockers].sort((a, b) => a.x - b.x)
  }
  
  // Add any middle lockers not categorized
  if (middle.length > 0) {
    console.log('[Middle] Adding uncategorized lockers:', middle.length)
    unfoldedSequence.push(...middle)
  }
  
  // Verify all lockers are included
  const originalCount = lockers.length
  const unfoldedCount = unfoldedSequence.length
  
  if (originalCount !== unfoldedCount) {
    console.error('[Transform] Locker count mismatch!', {
      original: originalCount,
      unfolded: unfoldedCount
    })
    
    // Find missing lockers
    const unfoldedIds = new Set(unfoldedSequence.map(l => l.id))
    const missing = lockers.filter(l => !unfoldedIds.has(l.id))
    console.log('[Missing] Lockers not included:', missing.map(l => \`L\${l.number}\`))
    
    // Add missing lockers at the end
    unfoldedSequence.push(...missing)
  }
  
  // Position lockers in front view
  positionLockersInFrontView(unfoldedSequence)
}

// Simplified positioning
const positionLockersInFrontView = (lockerSequence) => {
  const FLOOR_Y = 400
  let currentX = 50
  
  lockerSequence.forEach((locker, index) => {
    // Use actual height in front view
    const displayHeight = locker.actualHeight || locker.height || 60
    
    locker.frontViewX = currentX
    locker.frontViewY = FLOOR_Y - displayHeight
    currentX += locker.width + 5 // Small gap between lockers
    
    console.log(\`[Position] L\${locker.number} at index \${index}: x=\${locker.frontViewX}, y=\${locker.frontViewY}\`)
  })
  
  console.log('[Front View] Transformation complete:', {
    totalLockers: lockerSequence.length,
    totalWidth: currentX
  })
}
```

### Testing
When you have a ㄷ shape with L1-L14:
- Top row: L1, L2, L3, L4, L5
- Right column: L6, L7, L8, L9
- Bottom row: L14, L13, L12, L11, L10

Expected output: L1→L2→L3→L4→L5→L6→L7→L8→L9→L10→L11→L12→L13→L14