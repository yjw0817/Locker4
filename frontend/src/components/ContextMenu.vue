<template>
  <Teleport to="body">
    <div 
      v-if="visible"
      class="context-menu-overlay"
      @click="$emit('close')"
      @contextmenu.prevent
    >
      <div 
        class="context-menu"
        :style="{ 
          left: position.x + 'px', 
          top: position.y + 'px' 
        }"
        @click.stop
      >
        <div 
          v-for="item in items" 
          :key="item.id"
          class="context-menu-item"
          :class="{ 
            disabled: item.disabled,
            separator: item.type === 'separator'
          }"
          @click="handleItemClick(item)"
        >
          <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
          <span class="item-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="item-shortcut">{{ item.shortcut }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// No imports needed for this component

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  type?: 'item' | 'separator'
  action?: () => void
}

defineProps<{
  visible: boolean
  position: { x: number; y: number }
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  close: []
  select: [item: ContextMenuItem]
}>()

const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled || item.type === 'separator') return
  
  if (item.action) {
    item.action()
  }
  
  emit('select', item)
  emit('close')
}
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 4px;
  min-width: 200px;
  z-index: 9999;
  font-size: 14px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.context-menu-item:hover:not(.disabled):not(.separator) {
  background: #f3f4f6;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.separator {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
  padding: 0;
  cursor: default;
}

.item-icon {
  margin-right: 8px;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.item-label {
  flex: 1;
  color: #374151;
}

.item-shortcut {
  margin-left: 20px;
  color: #9ca3af;
  font-size: 12px;
}
</style>