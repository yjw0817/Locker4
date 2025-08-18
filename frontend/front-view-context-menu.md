# Front View Context Menu Implementation

## Changes Made

### 1. **Enabled Selection in Front View Mode**
- Selection now works in both floor view and front view (세로배치모드)
- Click selection and drag rectangle selection both functional in front view
- Movement and dragging remain disabled in front view (as required)

### 2. **Context Menu - ONLY in Front View**
- Modified `showContextMenu` function (line 2132-2142)
  - Changed condition from `currentViewMode.value !== 'floor'` to `currentViewMode.value !== 'front'`
  - Context menu now appears ONLY in front view mode
- Updated template (line 395-416)
  - Added condition `v-if="contextMenuVisible && currentViewMode === 'front'"`
  - Menu only visible when in front view mode

### 3. **Disabled Copy/Paste in Front View**
- Modified keyboard shortcuts (lines 3107-3135)
  - Ctrl+C copy disabled in front view
  - Ctrl+V paste disabled in front view
  - Console logs show "Disabled in front view mode"
- Drag-to-move already disabled (line 1426-1428)

### 4. **"단수 입력" (Add Floors) Enhancement**
- Updated `addFloors` function (lines 2156-2190)
  - Detects current view mode
  - In front view: uses actual locker height + 10px gap for vertical spacing
  - In floor view: uses standard height spacing
  - New lockers stack vertically above selected ones

### 5. **"번호 부여" (Assign Numbers) Feature**
- Works identically in both views
- Sorts by position (horizontal or vertical)
- Skip already assigned numbers
- Shows gap warnings

### 6. **"번호 삭제" (Delete Numbers) Feature**
- Works identically in both views
- Removes numbers from selected lockers

## How It Works

### In Floor View (평면배치모드):
- Selection: ✅ Enabled
- Drag Movement: ✅ Enabled
- Copy/Paste: ✅ Enabled
- Context Menu: ❌ Disabled

### In Front View (세로배치모드):
- Selection: ✅ Enabled
- Drag Movement: ❌ Disabled
- Copy/Paste: ❌ Disabled
- Context Menu: ✅ Enabled

## Testing Instructions

1. Switch to Front View mode (세로배치모드)
2. Click on lockers to select them
3. Try drag rectangle to select multiple lockers
4. Right-click on selected lockers → Context menu appears
5. Test each menu option:
   - 단수 입력: Creates stacked lockers above
   - 번호 부여: Assigns sequential numbers
   - 번호 삭제: Removes locker numbers
6. Try Ctrl+C and Ctrl+V → Should be disabled
7. Try dragging lockers → Should be disabled

## Key Implementation Details

- Context menu condition: `currentViewMode.value !== 'front'` (line 2134)
- Template condition: `v-if="contextMenuVisible && currentViewMode === 'front'"` (line 397)
- Copy disabled check: `if (currentViewMode.value === 'front') return` (line 3110)
- Paste disabled check: `if (currentViewMode.value === 'front') return` (line 3132)
- Drag disabled check: Already present at line 1426

The implementation successfully enables selection and context menu ONLY in front view while keeping movement and copy/paste disabled.