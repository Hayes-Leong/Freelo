<template>
  <!-- 计时悬浮面板 -->
  <div
    v-if="isActive"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-rice-50 rounded-2xl shadow-lg border-2 border-terracotta-300 px-6 py-4 min-w-[360px] animate-fade-in"
  >
    <!-- 模式切换 + 时长配置 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex gap-1 bg-rice-200 rounded-lg p-0.5">
        <button
          @click="switchTo('stopwatch')"
          :class="timer.state.mode === 'stopwatch'
            ? 'bg-rice-50 text-rice-800 shadow-sm'
            : 'text-rice-500 hover:text-rice-700'"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
        >🍌 香蕉钟</button>
        <button
          @click="switchTo('pomodoro')"
          :class="timer.state.mode === 'pomodoro'
            ? 'bg-rice-50 text-rice-800 shadow-sm'
            : 'text-rice-500 hover:text-rice-700'"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
        >🍅 番茄钟</button>
      </div>

      <!-- 番茄钟时长配置 -->
      <div v-if="timer.state.mode === 'pomodoro' && timer.state.status !== 'running'" class="flex items-center gap-1.5 text-xs text-rice-600">
        <select v-model.number="focusDur" class="bg-rice-100 border border-rice-300 rounded px-1.5 py-0.5 text-xs">
          <option :value="15">15m</option>
          <option :value="25">25m</option>
          <option :value="30">30m</option>
          <option :value="45">45m</option>
        </select>
        <span class="text-rice-400">/</span>
        <select v-model.number="restDur" class="bg-rice-100 border border-rice-300 rounded px-1.5 py-0.5 text-xs">
          <option :value="3">3m</option>
          <option :value="5">5m</option>
          <option :value="10">10m</option>
          <option :value="15">15m</option>
        </select>
      </div>
    </div>

    <!-- 主体：信息 + 时间 + 按钮 -->
    <div class="flex items-center gap-4">
      <!-- 任务信息 -->
      <div class="flex-1 min-w-0">
        <div class="text-xs text-rice-500 mb-0.5 truncate">
          <span v-if="timer.state.mode === 'pomodoro'">
            {{ timer.state.pomodoroPhase === 'focus' ? '🍅 专注' : timer.state.pomodoroPhase === 'rest' ? '☕ 休息' : '准备' }}
          </span>
          <span v-else>🍌 计时</span>
          <span v-if="timer.state.todoContent" class="ml-1">· {{ timer.state.todoContent }}</span>
        </div>
        <div class="text-xs text-rice-400">
          已记录 {{ fmtDur(timer.state.totalMinutes) }}
          <span v-if="timer.state.totalSegments.length">&nbsp;· {{ timer.state.totalSegments.length }} 段</span>
        </div>
      </div>

      <!-- 时间显示 -->
      <div
        :class="[
          'text-3xl font-mono font-bold tracking-wider tabular-nums',
          timer.state.status === 'running'
            ? timer.state.mode === 'pomodoro' && timer.state.remainingSeconds <= 60
              ? 'text-red-400 animate-pulse-soft'
              : 'text-terracotta-500 animate-pulse-soft'
            : 'text-rice-700'
        ]"
      >
        {{ timer.displayTime.value }}
      </div>

      <!-- 按钮组 -->
      <div class="flex items-center gap-1.5">
        <button
          v-if="timer.state.status === 'running'"
          @click="handlePause"
          class="w-9 h-9 rounded-full bg-rice-300 hover:bg-rice-400 text-rice-800 flex items-center justify-center transition-colors text-lg"
          title="暂停"
        >⏸</button>

        <button
          v-if="timer.state.status === 'paused'"
          @click="handleResume"
          class="w-9 h-9 rounded-full bg-ink-400/20 hover:bg-ink-400/40 text-ink-600 flex items-center justify-center transition-colors text-lg"
          title="继续"
        >▶</button>

        <button
          @click="handleStop"
          class="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors text-lg"
          title="停止计时"
        >⏹</button>
      </div>
    </div>

    <!-- 分段列表 -->
    <div v-if="timer.state.totalSegments.length > 0" class="mt-3 pt-3 border-t border-rice-400">
      <div class="text-xs text-rice-500 font-medium mb-1 flex items-center gap-2">
        <span>时间分段</span>
        <span v-if="timer.state.todayPomodoroCount > 0" class="text-terracotta-500">
          · 今日 🍅×{{ timer.state.todayPomodoroCount }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(seg, idx) in timer.state.totalSegments"
          :key="idx"
          class="text-xs bg-rice-200 text-rice-700 px-2 py-0.5 rounded font-mono"
        >
          {{ fmtDur(seg.duration_minutes) }}
        </span>
        <span
          v-if="timer.state.status === 'running'"
          class="text-xs px-2 py-0.5 rounded font-mono"
          :class="timer.state.mode === 'pomodoro' && timer.state.pomodoroPhase === 'rest'
            ? 'bg-ink-100 text-ink-600'
            : 'bg-terracotta-100 text-terracotta-600'"
        >
          {{ timer.state.mode === 'pomodoro' && timer.state.pomodoroPhase === 'rest' ? '☕ 休息中...' : '计时中...' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, inject, onUnmounted } from 'vue'
import { useTimer } from '../../composables/useTimer.js'

const timer = useTimer()

const api = inject('appApi')
const toast = inject('appToast', () => {})
const appRefresh = inject('appRefresh', {})

defineExpose({ timer })

const isActive = timer.isActive

// 番茄钟时长配置
const focusDur = ref(25)
const restDur = ref(5)

// 同步时长到 timer state
watch(focusDur, (v) => { timer.state.focusDuration = v })
watch(restDur, (v) => { timer.state.restDuration = v })

// 监听番茄钟完成
let lastSecond = -1
const pomoCheckInterval = setInterval(() => {
  if (!isActive.value || timer.state.status !== 'running' || timer.state.mode !== 'pomodoro') {
    lastSecond = -1
    return
  }
  if (timer.state.remainingSeconds === 0 && lastSecond === 1) {
    // 倒计时到 0
    if (timer.state.pomodoroPhase === 'focus') {
      timer.onFocusComplete(api).then(() => {
        toast('🍅 番茄完成！休息一下~', 'success')
        appRefresh.refreshSelectedDate?.()
      })
    } else if (timer.state.pomodoroPhase === 'rest') {
      timer.onRestComplete(api).then(() => {
        toast('☕ 休息结束，开始下一个番茄吧！', 'info')
        appRefresh.refreshSelectedDate?.()
      })
    }
  }
  lastSecond = timer.state.remainingSeconds
}, 250)

function switchTo(mode) {
  if (timer.state.status !== 'idle') {
    toast('请先停止当前计时', 'warn')
    return
  }
  timer.switchMode(mode)
}

async function handlePause() {
  try { await timer.pause(api) } catch (e) { toast('暂停失败: ' + e.message, 'error') }
}

async function handleResume() {
  try { await timer.resume(api) } catch (e) { toast('恢复失败: ' + e.message, 'error') }
}

async function handleStop() {
  try {
    await timer.stop(api)
    toast('计时已停止', 'success')
    appRefresh.refreshSelectedDate?.()
  } catch (e) { toast('停止失败: ' + e.message, 'error') }
}

function fmtDur(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

onUnmounted(() => clearInterval(pomoCheckInterval))
</script>
