<template>
  <li class="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-rice-200/50 group transition-colors relative">
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

    <!-- 计时按钮 + 模式选择 -->
    <div v-if="!timerActive" class="relative flex-shrink-0">
      <!-- 模式选择弹窗 -->
      <div v-if="showModePicker" class="absolute bottom-full right-0 mb-1 bg-rice-50 border border-rice-400 rounded-xl shadow-lg p-2 z-50 flex gap-1.5 whitespace-nowrap animate-fade-in">
        <button
          @click.stop="startWithMode('stopwatch')"
          class="px-3 py-1.5 text-xs rounded-lg bg-rice-300/50 hover:bg-rice-300 text-rice-800 font-medium transition-colors"
        >🍌 香蕉钟</button>
        <button
          @click.stop="startWithMode('pomodoro')"
          class="px-3 py-1.5 text-xs rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
        >🍅 番茄钟</button>
      </div>
      <!-- 触发按钮 -->
      <button
        :disabled="todo.completed === 1"
        class="text-rice-400 hover:text-ink-500 invisible group-hover:visible text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        title="开始计时"
        @click.stop="showModePicker = !showModePicker"
      >▶</button>
    </div>

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
import { ref, inject } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  todo: { type: Object, required: true },
  timerActive: { type: Boolean, default: false },
})

const emit = defineEmits(['changed', 'startTimer'])

const api = inject('appApi')
const toast = inject('appToast', () => {})

const showModePicker = ref(false)

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

function startWithMode(mode) {
  showModePicker.value = false
  emit('startTimer', { todo: props.todo, mode })
}

async function handleToggle() {
  try {
    const completed = props.todo.completed ? 0 : 1
    await api.put(`/api/todos/${props.todo.id}`, { completed })
    emit('changed')
  } catch (e) { toast('操作失败', 'error') }
}

async function handleSetCore() {
  try {
    await api.put(`/api/todos/${props.todo.id}`, { is_core: 1 })
    emit('changed')
  } catch (e) { toast('操作失败', 'error') }
}

async function handleDelete() {
  try {
    await api.del(`/api/todos/${props.todo.id}`)
    emit('changed')
  } catch (e) { toast('操作失败', 'error') }
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
