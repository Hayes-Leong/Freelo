<template>
  <!-- 计时悬浮面板 -->
  <div
    v-if="isActive"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-rice-50 rounded-2xl shadow-lg border-2 border-terracotta-300 px-6 py-4 min-w-[320px] animate-fade-in"
  >
    <div class="flex items-center gap-4">
      <!-- 任务信息 -->
      <div class="flex-1 min-w-0">
        <div class="text-xs text-rice-500 mb-0.5">
          <span :class="timer.state.todoContent ? '' : 'text-rice-400 italic'">
            {{ timer.state.todoContent || '无任务' }}
          </span>
        </div>
        <div class="text-xs text-rice-400">
          已记录 {{ formatDuration(timer.state.totalMinutes) }}
          <span v-if="timer.state.totalSegments.length > 0">
            · {{ timer.state.totalSegments.length }} 个分段
          </span>
        </div>
      </div>

      <!-- 时间显示 -->
      <div
        :class="[
          'text-3xl font-mono font-bold tracking-wider tabular-nums',
          timer.state.status === 'running' ? 'text-terracotta-500 animate-pulse-soft' : 'text-rice-700'
        ]"
      >
        {{ timer.displayTime.value }}
      </div>

      <!-- 按钮组 -->
      <div class="flex items-center gap-1.5">
        <!-- 暂停 -->
        <button
          v-if="timer.state.status === 'running'"
          @click="handlePause"
          class="w-9 h-9 rounded-full bg-rice-300 hover:bg-rice-400 text-rice-800 flex items-center justify-center transition-colors text-lg"
          title="暂停"
        >⏸</button>

        <!-- 继续 -->
        <button
          v-if="timer.state.status === 'paused'"
          @click="handleResume"
          class="w-9 h-9 rounded-full bg-ink-400/20 hover:bg-ink-400/40 text-ink-600 flex items-center justify-center transition-colors text-lg"
          title="继续"
        >▶</button>

        <!-- 停止 -->
        <button
          @click="handleStop"
          class="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors text-lg"
          title="停止计时"
        >⏹</button>
      </div>
    </div>

    <!-- 分段列表 -->
    <div v-if="timer.state.totalSegments.length > 0" class="mt-3 pt-3 border-t border-rice-400">
      <div class="text-xs text-rice-500 font-medium mb-1">时间分段</div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(seg, idx) in timer.state.totalSegments"
          :key="idx"
          class="text-xs bg-rice-200 text-rice-700 px-2 py-0.5 rounded font-mono"
        >
          {{ formatDuration(seg.duration_minutes) }}
        </span>
        <span
          v-if="timer.state.status === 'running'"
          class="text-xs bg-terracotta-100 text-terracotta-600 px-2 py-0.5 rounded font-mono animate-pulse-soft"
        >计时中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useTimer } from '../../composables/useTimer.js'

const timer = useTimer()

// inject 必须在 setup 顶层调用，不能在事件处理函数里
const api = inject('appApi')
const toast = inject('appToast', () => {})
const appRefresh = inject('appRefresh', {})

// 暴露 timer 实例给父组件
defineExpose({ timer })

const isActive = timer.isActive

async function handlePause() {
  try {
    await timer.pause(api)
  } catch (e) {
    toast('暂停失败: ' + e.message, 'error')
  }
}

async function handleResume() {
  try {
    await timer.resume(api)
  } catch (e) {
    toast('恢复失败: ' + e.message, 'error')
  }
}

async function handleStop() {
  try {
    await timer.stop(api)
    toast('计时已停止', 'success')
    appRefresh.refreshSelectedDate?.()
  } catch (e) {
    toast('停止失败: ' + e.message, 'error')
  }
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
</script>
