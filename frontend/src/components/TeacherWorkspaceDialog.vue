<template>
  <div v-if="modelValue" class="teacher-workspace-dialog" @click.self="handleClose">
    <section :class="['teacher-workspace-dialog__panel', sizeClass]">
      <div class="teacher-workspace-dialog__head">
        <div>
          <div v-if="eyebrow" class="teacher-workspace-dialog__eyebrow">{{ eyebrow }}</div>
          <h3>{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>

        <button type="button" class="course-chip course-chip--soft" :disabled="disabled" @click="handleClose">关闭</button>
      </div>

      <div class="teacher-workspace-dialog__body">
        <slot />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description?: string
    eyebrow?: string
    size?: 'default' | 'wide'
    disabled?: boolean
  }>(),
  {
    description: '',
    eyebrow: '',
    size: 'default',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const sizeClass = computed(() => (props.size === 'wide' ? 'teacher-workspace-dialog__panel--wide' : ''))

function handleClose() {
  if (props.disabled) {
    return
  }

  emit('update:modelValue', false)
  emit('close')
}
</script>
