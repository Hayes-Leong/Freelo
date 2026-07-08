<template>
  <div
    :class="cellClasses"
    class="cal-cell border-b border-r border-rice-400 p-1.5 cursor-pointer transition-all hover:shadow-md hover:z-10 relative"
    @click="$emit('click')"
  >
    <!-- 日期数字 -->
    <div class="text-right leading-none mb-1">
      <span
        v-if="day.is_padding"
        class="text-lg text-rice-400"
      >{{ dayNum }}</span>
      <span
        v-else-if="isToday"
        class="inline-block bg-terracotta-500 text-white rounded-full w-7 h-7 text-center text-lg font-black leading-7"
      >{{ dayNum }}</span>
      <span
        v-else
        class="text-xl font-black text-rice-800"
      >{{ dayNum }}</span>
    </div>

    <template v-if="!day.is_padding">
      <!-- 状态图标 -->
      <div v-if="statusIcon" class="absolute top-1 left-1 text-sm">
        {{ statusIcon }}
      </div>

      <!-- 节日/节气 -->
      <div
        v-if="day.annotation"
        class="text-right truncate leading-tight font-bold mb-1.5"
        :style="{ fontSize: '0.8rem', color: day.annotation.type === 'holiday' ? '#c17f59' : '#5b8c5a' }"
      >
        {{ day.annotation.emoji }} {{ day.annotation.name }}
      </div>

      <!-- 待办摘要 -->
      <template v-if="day.todos && day.todos.length">
        <div
          v-for="todo in coreTodos"
          :key="'c'+todo.id"
          class="truncate leading-tight font-bold mt-1"
          style="font-size:0.8rem;color:#5b8c5a"
        >★ {{ todo.content }}</div>
        <div
          v-for="todo in normalTodos"
          :key="'n'+todo.id"
          class="truncate leading-tight text-rice-700 mt-0.5"
          style="font-size:0.72rem"
        >- {{ todo.content }}</div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  day: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})

defineEmits(['click'])

const dayNum = computed(() => new Date(props.day.date + 'T00:00:00').getDate())

const isToday = computed(() => props.day.date === new Date().toISOString().slice(0, 10))

const statusIcon = computed(() => {
  if (!props.day.is_workday) return '☕'
  if (props.day.checkin_done) return '✅'
  return ''
})

const cellClasses = computed(() => {
  const classes = []
  if (props.day.is_padding) classes.push('bg-rice-100/50')
  else if (props.day.checkin_done) classes.push('bg-ink-400/10')
  else if (!props.day.is_workday) classes.push('bg-rice-200/50')
  else classes.push('bg-rice-100/30')

  if (props.isSelected) classes.push('ring-2', 'ring-terracotta-400', 'ring-inset', 'rounded')
  return classes
})

const coreTodos = computed(() => (props.day.todos || []).filter(t => t.is_core))
const normalTodos = computed(() => (props.day.todos || []).filter(t => !t.is_core))
</script>
