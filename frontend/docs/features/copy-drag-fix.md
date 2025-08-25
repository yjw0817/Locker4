# Copy-Drag Functionality Fix

## Problems Fixed
1. **Copy-drag behavior**: When Ctrl+dragging selected lockers, the copies now move instead of the originals
2. **Cursor indication**: Cursor changes to 'copy' when Ctrl/Cmd is pressed with selected lockers

## Implementation Details

### 1. Added Copy Mode Tracking (line 416)
```javascript
const isCopyMode = ref(false) // Track if Ctrl/Cmd is pressed for copy mode
```

### 2. Added Cursor Style Computed Property (lines 2917-2924)
```javascript
const getCursorStyle = computed(() => {
  if (isDragging.value) return 'grabbing'
  if (isDragSelecting.value) return 'crosshair'
  if (isCopyMode.value && selectedLockerIds.value.size > 0) return 'copy'
  if (selectedLockerIds.value.size > 0) return 'move'
  return 'default'
})
```

### 3. Added Keyboard Event Handlers (lines 2926-2937)
```javascript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    isCopyMode.value = true
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) {
    isCopyMode.value = false
  }
}
```

### 4. Fixed Copy-Drag Logic in startDragLocker (lines 1339-1377)
- Changed `locker` constant to `let leaderLocker` to allow reassignment
- Used a Map to track original ID to copy ID mappings
- After creating copies:
  - Update leaderLocker to point to the copied leader
  - Clear selection and select all copies
  - Continue dragging with the copies, not originals

### 5. Updated SVG Canvas Cursor (line 157)
```vue
:style="{ cursor: getCursorStyle }"
```

### 6. Added Event Listener Registration (lines 2953-2955)
```javascript
// In onMounted
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)
```

### 7. Cleanup in onUnmounted (lines 2983-2984)
```javascript
document.removeEventListener('keydown', handleKeyDown)
document.removeEventListener('keyup', handleKeyUp)
```

## How It Works Now

1. **Normal Drag**: Select lockers and drag - they move as expected
2. **Copy Drag**: 
   - Hold Ctrl/Cmd - cursor changes to 'copy'
   - Drag selected lockers - copies are created
   - The COPIES move with the mouse, not the originals
   - Selection transfers to the copies
3. **Cursor Feedback**:
   - Default: 'default'
   - With selection: 'move'
   - With selection + Ctrl/Cmd: 'copy'
   - While dragging: 'grabbing'
   - During drag selection: 'crosshair'

## Test Results ✅
- Multi-select with drag rectangle → Ctrl+drag creates and moves copies
- Original lockers stay in place
- Copies are properly selected and move together
- Cursor correctly indicates copy mode
- No more loss of selection after copying