<template>
  <li class="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-rice-200/50 group transition-colors">
    <!-- 完成复选框 -->
    <input
      type="checkbox"
      :checked="todo.completed === 1"
      class="w-4 h-4 accent-terracotta-500 flex-shrink-0"
      @change="handleToggle"
    />

    <!-- 任务类型标签 -->
    <span
      :class="typeBadgeClass"
      class="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
    >{{ typeLabel }}</span>

    <!-- 预估时间 -->
    <span class="text-xs text-rice-500 flex-shrink-0" :title="'预估 ' + todo.estimated_duration + ' 分钟'">
      {{ formatDuration(todo.estimated_duration) }}
    </span>

    <!-- 内容 -->
    <span
      :class="contentClass"
      class="flex-1 truncate"
    >{{ todo.content }}</span>

    <!-- 已记录时长 -->
    <span
      v-if="todo.total_elapsed > 0"
      class="text-xs text-ink-500 flex-shrink-0 font-medium"
    >{{ formatDuration(todo.total_elapsed) }}</span>

    <!-- 计时按钮 -->
    <button
      v-if="!timerActive"
      :disabled="todo.completed === 1"
      class="text-rice-400 hover:text-ink-500 invisible group-hover:visible text-sm flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
      title="开始计时"
      @click="$emit('startTimer')"
    >▶</button>

    <!-- 设为核心 -->
    <button
      v-if="!todo.is_core"
      class="text-rice-400 hover:text-amber-500 invisible group-hover:visible text-sm flex-shrink-0"
      title="设为核心"
      @click="handleSetCore"
    >⭐</button>
    <span v-else class="text-amber-500 text-sm flex-shrink-0" title="当前核心">⭐</span>

    <!-- 删除 -->
    <button
      class="text-rice-400 hover:text-red-500 invisible group-hover:visible text-sm flex-shrink-0"
      title="删除"
      @click="handleDelete"
    >✕</button>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { inject } from 'vue'

const props = defineProps({
  todo: { type: Object, required: true },
  timerActive: { type: Boolean, default: false },
})

const emit = defineEmits(['changed', 'startTimer'])

// 注入 API 和刷新方法
const api = inject('appApi')
const toast = inject('appToast', () => {})

const typeLabel = computed(() => props.todo.task_type === 'study' ? '学习' : '工作')
const typeBadgeClass = computed(() =>
  props.todo.task_type === 'study'
    ? 'bg-ink-400/15 text-ink-600'
    : 'bg-rice-300 text-rice-800'
)

const contentClass = computed(() => {
  const classes = []
  if (props.todo.completed) classes.push('line-through', 'text-rice-400')
  if (props.todo.is_core) classes.push('font-bold', 'text-rice-900')
  return classes
})

// 直接调用 API
async function handleToggle() {
  try {
    const completed = props.todo.completed ? 0 : 1
    await api.put(`/api/todos/${props.todo.id}`, { completed })
    emit('changed')
  } catch (e) {
    toast('操作失败', 'error')
  }
}

async function handleSetCore() {
  try {
    await api.put(`/api/todos/${props.todo.id}`, { is_core: 1 })
    emit('changed')
  } catch (e) {
    toast('操作失败', 'error')
  }
}

async function handleDelete() {
  try {
    await api.del(`/api/todos/${props.todo.id}`)
    emit('changed')
  } catch (e) {
    toast('操作失败', 'error')
  }
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
</script>
