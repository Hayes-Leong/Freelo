<template>
  <div>
    <p class="text-sm text-rice-500 mb-1">已选中：{{ date }}</p>

    <!-- 待办列表 -->
    <h3 class="text-base font-bold text-rice-800 mb-2">今日待办</h3>
    <ul class="space-y-1.5 mb-3">
      <li v-if="todos.length === 0" class="text-sm text-rice-400">暂无待办</li>
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :timer-active="timerActive"
        @changed="$emit('refresh')"
        @start-timer="$emit('startTimer', todo)"
      />
    </ul>

    <!-- 新增待办表单 -->
    <TodoForm
      :date="date"
      :disabled="!date"
      @added="$emit('refresh')"
    />

    <!-- 打卡按钮 -->
    <button
      :disabled="checkinDisabled"
      :class="checkinBtnClass"
      class="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
      @click="$emit('checkin')"
    >{{ checkinLabel }}</button>

    <!-- 休息日按钮 -->
    <button
      v-if="showRestBtn"
      :class="restBtnClass"
      class="w-full py-2.5 mt-2 rounded-lg text-sm font-semibold border transition-all"
      @click="$emit('toggleRestDay')"
    >{{ restBtnLabel }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TodoItem from './TodoItem.vue'
import TodoForm from './TodoForm.vue'

const props = defineProps({
  date: { type: String, default: '' },
  todos: { type: Array, default: () => [] },
  dayInfo: { type: Object, default: null },
  balance: { type: Number, default: 0 },
  currentMonth: { type: String, default: '' },
  timerActive: { type: Boolean, default: false },
})

defineEmits(['refresh', 'startTimer', 'checkin', 'toggleRestDay'])

const today = new Date().toISOString().slice(0, 10)

const hasCoreCompleted = computed(() =>
  props.todos.some(t => t.is_core === 1 && t.completed === 1)
)

const checkinDisabled = computed(() => {
  if (!props.dayInfo) return true
  if (props.dayInfo.date > today) return true
  if (props.dayInfo.checkin_done) return true
  if (!props.dayInfo.is_workday) return true
  if (!hasCoreCompleted.value) return true
  return false
})

const checkinLabel = computed(() => {
  if (!props.dayInfo) return '请选择日期'
  if (props.dayInfo.date > today) return '未来日期不可打卡'
  if (props.dayInfo.checkin_done) return '已打卡 ✅'
  if (!props.dayInfo.is_workday) return '休息日无需打卡 ☕'
  if (!hasCoreCompleted.value) return '打卡（请先完成核心任务）'
  return '✅ 打卡'
})

const checkinBtnClass = computed(() => {
  const d = checkinDisabled.value
  const done = props.dayInfo?.checkin_done
  if (done) return 'bg-ink-400/10 text-ink-500 cursor-not-allowed'
  if (d && props.dayInfo?.date > today) return 'bg-rice-200 text-rice-400 cursor-not-allowed'
  if (d && !props.dayInfo?.is_workday) return 'bg-rice-200 text-rice-500 cursor-not-allowed'
  if (d) return 'bg-rice-300 text-rice-600 cursor-not-allowed'
  return 'bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-sm cursor-pointer'
})

const showRestBtn = computed(() =>
  props.dayInfo && !props.dayInfo.checkin_done
)

const restBtnLabel = computed(() =>
  props.dayInfo?.is_workday ? '切为休息日（消耗1天）' : '切回工作日'
)

const restBtnClass = computed(() =>
  props.dayInfo?.is_workday
    ? 'bg-rice-300 text-rice-800 hover:bg-rice-400 border-rice-400'
    : 'bg-ink-400/10 text-ink-500 hover:bg-ink-400/20 border-ink-400'
)
</script>
