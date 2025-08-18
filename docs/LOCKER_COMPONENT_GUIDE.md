# Locker Design System - Complete Vue Component Implementation Guide

## Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Core Components](#core-components)
3. [Locker-Specific Components](#locker-specific-components)
4. [Form Components](#form-components)
5. [Layout Components](#layout-components)
6. [Utility Components](#utility-components)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

## Design System Overview

The Locker Design System is built with Vue 3 Composition API and follows a token-based design approach using CSS custom properties.

### Design Tokens Structure
```
frontend/src/styles/
├── tokens/
│   ├── colors.css       # Color system & semantic colors
│   ├── typography.css   # Font sizes, weights, line heights
│   └── spacing.css      # Spacing scale & layout tokens
└── globals.css          # Global styles & utilities
```

### Core Design Principles
- **Consistency**: Use design tokens for all styling
- **Composability**: Build complex UIs from simple components
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lazy loading and optimized rendering
- **Responsiveness**: Mobile-first approach

## Core Components

### 1. BaseButton Component

A versatile button component with multiple variants and states.

```vue
<template>
  <button
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      {
        'base-button--disabled': disabled,
        'base-button--loading': loading,
        'base-button--block': block
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="button-spinner">
      <svg class="spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" 
                stroke-width="3" fill="none" stroke-linecap="round" />
      </svg>
    </span>
    <span v-if="icon && iconPosition === 'left'" class="button-icon">
      <component :is="icon" />
    </span>
    <span class="button-content">
      <slot />
    </span>
    <span v-if="icon && iconPosition === 'right'" class="button-icon">
      <component :is="icon" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: any
  iconPosition?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
  iconPosition: 'left'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: inherit;
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  user-select: none;
}

/* Size variants */
.base-button--sm {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.base-button--md {
  height: 40px;
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}

.base-button--lg {
  height: 48px;
  padding: 0 var(--space-6);
  font-size: var(--text-lg);
}

/* Variant styles */
.base-button--primary {
  background: var(--primary-color);
  color: var(--text-white);
  border: none;
}

.base-button--primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.base-button--secondary {
  background: var(--surface-sunken);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.base-button--secondary:hover:not(:disabled) {
  background: var(--border-light);
  border-color: var(--border-dark);
}

.base-button--danger {
  background: var(--color-error);
  color: var(--text-white);
  border: none;
}

.base-button--danger:hover:not(:disabled) {
  background: #DC2626;
}

.base-button--ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid transparent;
}

.base-button--ghost:hover:not(:disabled) {
  background: var(--surface-sunken);
}

.base-button--link {
  background: transparent;
  color: var(--primary-color);
  border: none;
  padding: 0;
  height: auto;
}

.base-button--link:hover:not(:disabled) {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* States */
.base-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button--loading {
  color: transparent;
}

.base-button--block {
  width: 100%;
}

/* Loading spinner */
.button-spinner {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 60;
  stroke-dashoffset: 45;
  animation: spinner-dash 1.5s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spinner-dash {
  0% {
    stroke-dashoffset: 45;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: 45;
  }
}
</style>
```

**Usage Examples:**
```vue
<!-- Primary button -->
<BaseButton @click="handleSave">Save Changes</BaseButton>

<!-- Secondary button with icon -->
<BaseButton variant="secondary" :icon="EditIcon">
  Edit Locker
</BaseButton>

<!-- Loading state -->
<BaseButton :loading="isSubmitting">
  {{ isSubmitting ? 'Saving...' : 'Save' }}
</BaseButton>

<!-- Danger button -->
<BaseButton variant="danger" @click="deleteLock">
  Delete Locker
</BaseButton>

<!-- Full width button -->
<BaseButton block size="lg">
  Register New Locker
</BaseButton>
```

### 2. BaseCard Component

A flexible card component for content containers.

```vue
<template>
  <div 
    :class="[
      'base-card',
      {
        'base-card--hoverable': hoverable,
        'base-card--selected': selected,
        'base-card--bordered': bordered
      }
    ]"
    @click="handleClick"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>
    
    <div class="card-body" :style="{ padding: bodyPadding }">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  hoverable?: boolean
  selected?: boolean
  bordered?: boolean
  bodyPadding?: string
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  selected: false,
  bordered: true,
  bodyPadding: 'var(--space-6)'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (props.hoverable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-card {
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-fast);
}

.base-card--bordered {
  border: 1px solid var(--border-default);
}

.base-card--hoverable {
  cursor: pointer;
}

.base-card--hoverable:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.base-card--selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-light);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  background: var(--surface-sunken);
  border-top: 1px solid var(--border-light);
}
</style>
```

### 3. BaseModal Component (Already Implemented)

The modal component is already implemented in your codebase. Here's how to use it effectively:

```vue
<!-- Usage Example -->
<template>
  <BaseModal
    :is-open="isModalOpen"
    title="Locker Registration"
    width="600px"
    @close="closeModal"
  >
    <!-- Modal Content -->
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Locker Number</label>
        <input v-model="lockerNumber" type="text" />
      </div>
    </form>
    
    <!-- Modal Footer -->
    <template #footer>
      <BaseButton variant="secondary" @click="closeModal">
        Cancel
      </BaseButton>
      <BaseButton @click="handleSubmit">
        Register
      </BaseButton>
    </template>
  </BaseModal>
</template>
```

## Locker-Specific Components

### 4. LockerStatusBadge Component

Display locker status with appropriate colors and icons.

```vue
<template>
  <span :class="['status-badge', `status-badge--${status}`]">
    <span class="status-indicator"></span>
    <span class="status-text">{{ statusText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type LockerStatus = 'available' | 'occupied' | 'expired' | 'maintenance' | 'selected'

interface Props {
  status: LockerStatus
}

const props = defineProps<Props>()

const statusText = computed(() => {
  const texts = {
    available: '사용 가능',
    occupied: '사용 중',
    expired: '기간 만료',
    maintenance: '정비 중',
    selected: '선택됨'
  }
  return texts[props.status]
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Status variants */
.status-badge--available {
  background: var(--locker-available-bg);
  color: var(--locker-available-text);
  border: 1px solid var(--locker-available-border);
}

.status-badge--available .status-indicator {
  background: var(--locker-available);
}

.status-badge--occupied {
  background: var(--locker-occupied-bg);
  color: var(--locker-occupied-text);
  border: 1px solid var(--locker-occupied-border);
}

.status-badge--occupied .status-indicator {
  background: var(--locker-occupied);
}

.status-badge--expired {
  background: var(--locker-expired-bg);
  color: var(--locker-expired-text);
  border: 1px solid var(--locker-expired-border);
}

.status-badge--expired .status-indicator {
  background: var(--locker-expired);
  animation: pulse 2s infinite;
}

.status-badge--maintenance {
  background: var(--locker-maintenance-bg);
  color: var(--locker-maintenance-text);
  border: 1px solid var(--locker-maintenance-border);
}

.status-badge--maintenance .status-indicator {
  background: var(--locker-maintenance);
}

.status-badge--selected {
  background: var(--locker-selected-bg);
  color: var(--primary-color);
  border: 1px solid var(--locker-selected-border);
}

.status-badge--selected .status-indicator {
  background: var(--locker-selected);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
```

### 5. LockerGrid Component

A responsive grid layout for displaying multiple lockers.

```vue
<template>
  <div class="locker-grid">
    <div class="grid-header">
      <h2 class="grid-title">{{ title }}</h2>
      <div class="grid-controls">
        <slot name="controls">
          <select v-model="viewMode" class="view-selector">
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
          </select>
        </slot>
      </div>
    </div>
    
    <div v-if="viewMode === 'grid'" class="grid-container">
      <div
        v-for="locker in lockers"
        :key="locker.id"
        :class="[
          'locker-item',
          `locker-item--${locker.status}`,
          { 'locker-item--selected': locker.id === selectedId }
        ]"
        @click="selectLocker(locker)"
      >
        <div class="locker-number">{{ locker.number }}</div>
        <LockerStatusBadge :status="locker.status" />
        <div v-if="locker.user" class="locker-user">
          {{ locker.user.name }}
        </div>
      </div>
    </div>
    
    <div v-else class="list-container">
      <table class="locker-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>상태</th>
            <th>사용자</th>
            <th>만료일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="locker in lockers"
            :key="locker.id"
            :class="{ 'selected-row': locker.id === selectedId }"
            @click="selectLocker(locker)"
          >
            <td>{{ locker.number }}</td>
            <td>
              <LockerStatusBadge :status="locker.status" />
            </td>
            <td>{{ locker.user?.name || '-' }}</td>
            <td>{{ formatDate(locker.expiryDate) }}</td>
            <td>
              <BaseButton size="sm" variant="ghost" @click.stop="editLocker(locker)">
                Edit
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LockerStatusBadge from './LockerStatusBadge.vue'
import BaseButton from './BaseButton.vue'

interface Locker {
  id: string
  number: string
  status: 'available' | 'occupied' | 'expired' | 'maintenance'
  user?: {
    name: string
    email: string
  }
  expiryDate?: Date
}

interface Props {
  title: string
  lockers: Locker[]
  selectedId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [locker: Locker]
  edit: [locker: Locker]
}>()

const viewMode = ref<'grid' | 'list'>('grid')

const selectLocker = (locker: Locker) => {
  emit('select', locker)
}

const editLocker = (locker: Locker) => {
  emit('edit', locker)
}

const formatDate = (date?: Date) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-KR').format(date)
}
</script>

<style scoped>
.locker-grid {
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}

.grid-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.view-selector {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-elevated);
  font-size: var(--text-sm);
}

/* Grid View */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-4);
}

.locker-item {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 2px solid;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.locker-item--available {
  background: var(--locker-available-bg);
  border-color: var(--locker-available-border);
}

.locker-item--occupied {
  background: var(--locker-occupied-bg);
  border-color: var(--locker-occupied-border);
}

.locker-item--expired {
  background: var(--locker-expired-bg);
  border-color: var(--locker-expired-border);
}

.locker-item--maintenance {
  background: var(--locker-maintenance-bg);
  border-color: var(--locker-maintenance-border);
}

.locker-item--selected {
  border-color: var(--locker-selected-border);
  box-shadow: 0 0 0 3px var(--locker-selected-bg);
}

.locker-item:hover {
  transform: scale(1.05);
}

.locker-number {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.locker-user {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* List View */
.locker-table {
  width: 100%;
  border-collapse: collapse;
}

.locker-table th {
  text-align: left;
  padding: var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-default);
}

.locker-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.locker-table tr {
  cursor: pointer;
  transition: background var(--transition-fast);
}

.locker-table tr:hover {
  background: var(--surface-sunken);
}

.selected-row {
  background: var(--locker-selected-bg);
}
</style>
```

## Form Components

### 6. BaseInput Component

A comprehensive input component with validation support.

```vue
<template>
  <div class="input-wrapper">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    
    <div class="input-container">
      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </span>
      
      <input
        :id="inputId"
        v-model="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="[
          'base-input',
          {
            'input--error': hasError,
            'input--disabled': disabled,
            'input--with-prefix': $slots.prefix,
            'input--with-suffix': $slots.suffix
          }
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      
      <span v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix" />
      </span>
    </div>
    
    <p v-if="hint && !hasError" class="input-hint">{{ hint }}</p>
    <p v-if="hasError && errorMessage" class="input-error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue: string | number
  type?: string
  label?: string
  placeholder?: string
  hint?: string
  errorMessage?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
}>()

const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
const hasError = computed(() => !!props.errorMessage)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.required-mark {
  color: var(--color-error);
  margin-left: var(--space-1);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input {
  flex: 1;
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--surface-elevated);
  transition: all var(--transition-fast);
}

.base-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.base-input::placeholder {
  color: var(--text-placeholder);
}

.input--error {
  border-color: var(--color-error);
}

.input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input--disabled {
  background: var(--surface-sunken);
  cursor: not-allowed;
  opacity: 0.6;
}

.input--with-prefix {
  padding-left: 40px;
}

.input--with-suffix {
  padding-right: 40px;
}

.input-prefix,
.input-suffix {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  color: var(--text-secondary);
}

.input-prefix {
  left: 0;
}

.input-suffix {
  right: 0;
}

.input-hint {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
}

.input-error {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin: 0;
}
</style>
```

### 7. BaseSelect Component

A styled select dropdown component.

```vue
<template>
  <div class="select-wrapper">
    <label v-if="label" :for="selectId" class="select-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    
    <div class="select-container">
      <select
        :id="selectId"
        v-model="modelValue"
        :disabled="disabled"
        :required="required"
        :class="[
          'base-select',
          {
            'select--error': hasError,
            'select--disabled': disabled
          }
        ]"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <span class="select-arrow">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" 
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
    
    <p v-if="hasError && errorMessage" class="select-error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number
  options: Option[]
  label?: string
  placeholder?: string
  errorMessage?: string
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [value: string | number]
}>()

const selectId = `select-${Math.random().toString(36).substr(2, 9)}`
const hasError = computed(() => !!props.errorMessage)

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', target.value)
}
</script>

<style scoped>
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.select-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.required-mark {
  color: var(--color-error);
  margin-left: var(--space-1);
}

.select-container {
  position: relative;
}

.base-select {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--surface-elevated);
  appearance: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.base-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.select--error {
  border-color: var(--color-error);
}

.select--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.select--disabled {
  background: var(--surface-sunken);
  cursor: not-allowed;
  opacity: 0.6;
}

.select-arrow {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-secondary);
}

.select-error {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin: 0;
}
</style>
```

## Layout Components

### 8. AppLayout Component

Main application layout with sidebar navigation.

```vue
<template>
  <div class="app-layout">
    <aside :class="['sidebar', { 'sidebar--collapsed': isSidebarCollapsed }]">
      <div class="sidebar-header">
        <img src="/logo.svg" alt="Locker System" class="logo" />
        <h1 v-if="!isSidebarCollapsed" class="app-title">Locker System</h1>
      </div>
      
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="!isSidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
      
      <button @click="toggleSidebar" class="sidebar-toggle">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path :d="toggleIconPath" stroke="currentColor" 
                stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </aside>
    
    <div class="main-container">
      <header class="app-header">
        <div class="header-content">
          <slot name="header-left">
            <h2 class="page-title">{{ pageTitle }}</h2>
          </slot>
          <div class="header-actions">
            <slot name="header-right">
              <BaseButton variant="ghost" size="sm">
                <UserIcon />
                {{ userName }}
              </BaseButton>
            </slot>
          </div>
        </div>
      </header>
      
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from './BaseButton.vue'

interface NavItem {
  path: string
  label: string
  icon: any
}

interface Props {
  navItems: NavItem[]
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'Admin'
})

const route = useRoute()
const isSidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  const currentNav = props.navItems.find(item => item.path === route.path)
  return currentNav?.label || 'Dashboard'
})

const toggleIconPath = computed(() => {
  return isSidebarCollapsed.value
    ? 'M5 10L10 5L15 10' // Expand icon
    : 'M15 10L10 5L5 10' // Collapse icon
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--background-main);
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--surface-elevated);
  border-right: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
}

.sidebar--collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border-bottom: 1px solid var(--border-light);
}

.logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.app-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-item:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}

.nav-item--active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: var(--font-medium);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.sidebar-toggle {
  margin: var(--space-4);
  padding: var(--space-2);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.sidebar-toggle:hover {
  background: var(--surface-sunken);
}

/* Main Container */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border-default);
  padding: var(--space-4) var(--space-6);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.app-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar--mobile-open {
    transform: translateX(0);
  }
  
  .main-container {
    margin-left: 0;
  }
}
</style>
```

## Best Practices

### 1. Component Composition
```vue
<!-- Compose complex UIs from simple components -->
<BaseCard title="Locker Details" :hoverable="true">
  <div class="locker-info">
    <LockerStatusBadge :status="locker.status" />
    <p>Number: {{ locker.number }}</p>
    <p>Zone: {{ locker.zone }}</p>
  </div>
  
  <template #footer>
    <BaseButton size="sm" variant="secondary">Edit</BaseButton>
    <BaseButton size="sm" variant="danger">Delete</BaseButton>
  </template>
</BaseCard>
```

### 2. Form Validation Pattern
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseInput
      v-model="formData.lockerNumber"
      label="Locker Number"
      :error-message="errors.lockerNumber"
      :required="true"
      @blur="validateField('lockerNumber')"
    />
    
    <BaseSelect
      v-model="formData.zone"
      label="Zone"
      :options="zoneOptions"
      :error-message="errors.zone"
      :required="true"
    />
    
    <BaseButton type="submit" :loading="isSubmitting">
      Save Locker
    </BaseButton>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'

const formData = reactive({
  lockerNumber: '',
  zone: ''
})

const errors = reactive({
  lockerNumber: '',
  zone: ''
})

const isSubmitting = ref(false)

const validateField = (field) => {
  if (!formData[field]) {
    errors[field] = 'This field is required'
  } else {
    errors[field] = ''
  }
}

const handleSubmit = async () => {
  // Validate all fields
  Object.keys(formData).forEach(validateField)
  
  if (Object.values(errors).some(error => error)) {
    return
  }
  
  isSubmitting.value = true
  try {
    // Submit logic
    await saveLocker(formData)
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

### 3. State Management with Pinia
```typescript
// stores/lockerStore.ts
import { defineStore } from 'pinia'

export const useLockerStore = defineStore('locker', {
  state: () => ({
    lockers: [],
    selectedLockerId: null,
    filters: {
      status: 'all',
      zone: 'all'
    }
  }),
  
  getters: {
    filteredLockers: (state) => {
      return state.lockers.filter(locker => {
        if (state.filters.status !== 'all' && locker.status !== state.filters.status) {
          return false
        }
        if (state.filters.zone !== 'all' && locker.zone !== state.filters.zone) {
          return false
        }
        return true
      })
    },
    
    selectedLocker: (state) => {
      return state.lockers.find(l => l.id === state.selectedLockerId)
    }
  },
  
  actions: {
    async fetchLockers() {
      const response = await api.getLockers()
      this.lockers = response.data
    },
    
    selectLocker(id) {
      this.selectedLockerId = id
    },
    
    updateFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    }
  }
})
```

### 4. Responsive Design Patterns
```vue
<style scoped>
/* Mobile First Approach */
.container {
  padding: var(--space-4);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
```

## Real-World Examples

### Complete Locker Management Page
```vue
<template>
  <AppLayout :nav-items="navItems">
    <div class="locker-management">
      <!-- Filters Section -->
      <BaseCard class="filters-card">
        <div class="filter-grid">
          <BaseSelect
            v-model="filters.zone"
            label="Zone"
            :options="zoneOptions"
            placeholder="All Zones"
          />
          <BaseSelect
            v-model="filters.status"
            label="Status"
            :options="statusOptions"
            placeholder="All Status"
          />
          <BaseInput
            v-model="searchQuery"
            label="Search"
            placeholder="Search locker number..."
            type="search"
          />
        </div>
        <template #footer>
          <BaseButton variant="secondary" @click="resetFilters">
            Reset Filters
          </BaseButton>
          <BaseButton @click="applyFilters">
            Apply Filters
          </BaseButton>
        </template>
      </BaseCard>
      
      <!-- Statistics -->
      <div class="stats-grid">
        <BaseCard v-for="stat in statistics" :key="stat.label">
          <div class="stat-item">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
            <LockerStatusBadge v-if="stat.status" :status="stat.status" />
          </div>
        </BaseCard>
      </div>
      
      <!-- Locker Grid -->
      <LockerGrid
        title="All Lockers"
        :lockers="filteredLockers"
        :selected-id="selectedLockerId"
        @select="handleLockerSelect"
        @edit="handleLockerEdit"
      />
      
      <!-- Add New Locker Button -->
      <BaseButton
        class="fab"
        size="lg"
        @click="openAddModal"
      >
        + Add Locker
      </BaseButton>
      
      <!-- Modals -->
      <BaseModal
        :is-open="isAddModalOpen"
        title="Add New Locker"
        @close="closeAddModal"
      >
        <LockerForm
          @submit="handleAddLocker"
          @cancel="closeAddModal"
        />
      </BaseModal>
      
      <BaseModal
        :is-open="isEditModalOpen"
        title="Edit Locker"
        @close="closeEditModal"
      >
        <LockerForm
          :initial-data="selectedLocker"
          @submit="handleUpdateLocker"
          @cancel="closeEditModal"
        />
      </BaseModal>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLockerStore } from '@/stores/lockerStore'
import AppLayout from '@/components/AppLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseSelect from '@/components/BaseSelect.vue'
import LockerGrid from '@/components/LockerGrid.vue'
import LockerForm from '@/components/LockerForm.vue'
import LockerStatusBadge from '@/components/LockerStatusBadge.vue'

const lockerStore = useLockerStore()

// Navigation items
const navItems = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/lockers', label: 'Lockers', icon: LockerIcon },
  { path: '/users', label: 'Users', icon: UserIcon },
  { path: '/reports', label: 'Reports', icon: ReportIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon }
]

// Filters
const filters = ref({
  zone: '',
  status: ''
})

const searchQuery = ref('')

const zoneOptions = [
  { label: 'All Zones', value: '' },
  { label: 'Zone A', value: 'zone-a' },
  { label: 'Zone B', value: 'zone-b' },
  { label: 'Zone C', value: 'zone-c' }
]

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Expired', value: 'expired' },
  { label: 'Maintenance', value: 'maintenance' }
]

// Modal states
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)

// Computed
const filteredLockers = computed(() => {
  let result = lockerStore.filteredLockers
  
  if (searchQuery.value) {
    result = result.filter(locker =>
      locker.number.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return result
})

const selectedLocker = computed(() => lockerStore.selectedLocker)
const selectedLockerId = computed(() => lockerStore.selectedLockerId)

const statistics = computed(() => {
  const lockers = lockerStore.lockers
  return [
    {
      label: 'Total Lockers',
      value: lockers.length,
      status: null
    },
    {
      label: 'Available',
      value: lockers.filter(l => l.status === 'available').length,
      status: 'available'
    },
    {
      label: 'Occupied',
      value: lockers.filter(l => l.status === 'occupied').length,
      status: 'occupied'
    },
    {
      label: 'Maintenance',
      value: lockers.filter(l => l.status === 'maintenance').length,
      status: 'maintenance'
    }
  ]
})

// Methods
const applyFilters = () => {
  lockerStore.updateFilters(filters.value)
}

const resetFilters = () => {
  filters.value = { zone: '', status: '' }
  searchQuery.value = ''
  applyFilters()
}

const handleLockerSelect = (locker) => {
  lockerStore.selectLocker(locker.id)
}

const handleLockerEdit = (locker) => {
  lockerStore.selectLocker(locker.id)
  isEditModalOpen.value = true
}

const openAddModal = () => {
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const handleAddLocker = async (data) => {
  await lockerStore.addLocker(data)
  closeAddModal()
}

const handleUpdateLocker = async (data) => {
  await lockerStore.updateLocker(selectedLockerId.value, data)
  closeEditModal()
}

// Lifecycle
onMounted(() => {
  lockerStore.fetchLockers()
})
</script>

<style scoped>
.locker-management {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.filters-card {
  margin-bottom: var(--space-4);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
}

.fab {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  box-shadow: var(--shadow-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .filter-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .fab {
    bottom: var(--space-4);
    right: var(--space-4);
  }
}
</style>
```

## Deployment Checklist

1. **Component Library Setup**
   - [ ] Create `components/` directory structure
   - [ ] Implement base components (Button, Card, Modal, Input, Select)
   - [ ] Create Locker-specific components
   - [ ] Set up component auto-import with unplugin-vue-components

2. **Design Tokens**
   - [ ] Verify CSS custom properties are loaded
   - [ ] Test color schemes across all components
   - [ ] Validate spacing and typography scales

3. **State Management**
   - [ ] Set up Pinia stores for locker data
   - [ ] Implement API integration layer
   - [ ] Add error handling and loading states

4. **Testing**
   - [ ] Unit tests for components
   - [ ] Integration tests for forms
   - [ ] E2E tests for critical workflows

5. **Performance**
   - [ ] Implement lazy loading for routes
   - [ ] Optimize bundle size with code splitting
   - [ ] Add loading skeletons for better UX

6. **Accessibility**
   - [ ] Keyboard navigation support
   - [ ] ARIA labels and roles
   - [ ] Color contrast compliance
   - [ ] Screen reader testing

This guide provides a comprehensive foundation for implementing the Locker Design System in your Vue application. Each component is production-ready and follows Vue 3 best practices with TypeScript support.