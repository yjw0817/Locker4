## Task: Fix Backspace Key Not Working in Locker Registration Modal

**Project Path**: `/Users/yunjeong-won/Desktop/Locker4`

**Main Files**: 
- `frontend/src/components/modals/LockerRegistrationModal.vue`
- `frontend/src/pages/LockerPlacementFigma.vue`

### Current Issue
Backspace key doesn't work in the description field of the locker registration modal.

### Root Cause
Likely caused by:
1. Global keyboard event handler preventing default behavior
2. Event propagation being stopped
3. Keyboard shortcut conflicts (Delete key for locker deletion)

### Implementation Requirements

#### 1. Check Global Keyboard Event Handlers
Find and fix any global keyboard handlers that might interfere:

```javascript
// In LockerPlacementFigma.vue or global handlers
const handleKeyPress = (event: KeyboardEvent) => {
  // Skip keyboard shortcuts when typing in input/textarea
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return; // Don't process shortcuts when typing
  }
  
  // Also check if modal is open
  if (isModalOpen.value) {
    return; // Don't process shortcuts when modal is open
  }
  
  // Rest of keyboard shortcut logic
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // Only delete locker if not typing
    if (selectedLocker.value) {
      event.preventDefault(); // Only prevent default here
      deleteSelectedLocker();
    }
  }
};
```

#### 2. Fix Modal Input Event Handling
In the modal component, ensure events aren't being blocked:

```javascript
// LockerRegistrationModal.vue
<textarea
  v-model="formData.description"
  @keydown.stop  // Stop propagation to parent
  @keyup.stop
  @keypress.stop
  placeholder="락커 설명 입력"
  class="description-input"
/>
```

#### 3. Add Modal State Check
Ensure the parent component knows when modal is open:

```javascript
const isRegistrationModalOpen = ref(false);

// When opening modal
const openRegistrationModal = () => {
  isRegistrationModalOpen.value = true;
};

// In keyboard handler
onMounted(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't handle shortcuts when modal is open
    if (isRegistrationModalOpen.value) {
      return;
    }
    
    // Handle shortcuts only when modal is closed
    if (event.key === 'Delete' && selectedLocker.value) {
      event.preventDefault();
      deleteSelectedLocker();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
});
```

### Testing Requirements
- [ ] Backspace key deletes characters in description field
- [ ] Delete key also works
- [ ] All text editing keys work
- [ ] Keyboard shortcuts don't trigger in modal
- [ ] After closing modal, shortcuts work again

### Console Logging
```javascript
console.log('[Modal] Input state:', {
  isModalOpen: isRegistrationModalOpen.value,
  activeElement: document.activeElement?.tagName,
  keyboardEvent: 'handled/ignored'
});
```