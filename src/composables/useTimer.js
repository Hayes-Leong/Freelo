import { reactive, ref, computed, onUnmounted } from 'vue'

/**
 * 秒表状态机 composable
 *
 * 状态: idle | running | paused
 * 操作: start(todoId, date, todoContent) → pause() → resume() → stop()
 *
 * 后端记录 start_time，浏览器关闭后计时继续
 * 页面加载时自动恢复当前计时状态
 */
export function useTimer() {
  const state = reactive({
    status: 'idle',       // idle | running | paused
    todoId: null,
    todoContent: '',
    date: '',
    startTime: null,       // ISO string — 当前分段的开始时间
    elapsedSeconds: 0,     // 当前分段已用秒数
    totalSegments: [],     // 已完成的分段 [{duration_minutes, start_time, end_time}]
    totalMinutes: 0,       // 全部已记录分钟数 (已完成分段之和)
  })

  let intervalId = null
  let startTimestamp = null  // Date.now() 标记当前分段开始

  const displayTime = computed(() => {
    const total = state.elapsedSeconds
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const isActive = computed(() => state.status === 'running' || state.status === 'paused')

  // 每秒更新
  function tick() {
    if (state.status !== 'running' || !startTimestamp) return
    state.elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000)
  }

  function startTicking() {
    stopTicking()
    tick()
    intervalId = setInterval(tick, 1000)
  }

  function stopTicking() {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
  }

  // 从后端恢复计时
  async function restore(api) {
    try {
      const data = await api.get('/api/timer/current')
      if (!data || data.status === 'idle') return false
      state.status = data.status
      state.todoId = data.todo_id
      state.todoContent = data.todo_content || ''
      state.date = data.date
      state.totalSegments = data.segments || []
      state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      if (data.start_time) {
        state.startTime = data.start_time
        startTimestamp = new Date(data.start_time).getTime()
        state.elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000)
        if (state.status === 'running') startTicking()
      }
      return true
    } catch (e) {
      console.error('恢复计时失败:', e)
      return false
    }
  }

  // 开始计时
  async function start(api, todoId, date, todoContent) {
    try {
      const data = await api.post('/api/timer/start', { todo_id: todoId, date })
      state.status = 'running'
      state.todoId = todoId
      state.todoContent = todoContent
      state.date = date
      state.startTime = data.start_time
      state.totalSegments = data.segments || []
      state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      startTimestamp = new Date(data.start_time).getTime()
      state.elapsedSeconds = 0
      startTicking()
      return data
    } catch (e) {
      throw e
    }
  }

  // 暂停
  async function pause(api) {
    try {
      const data = await api.post('/api/timer/pause')
      state.status = 'paused'
      stopTicking()
      // 更新分段信息
      if (data.segments) {
        state.totalSegments = data.segments
        state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      }
      state.elapsedSeconds = 0
      return data
    } catch (e) {
      throw e
    }
  }

  // 继续
  async function resume(api) {
    try {
      const data = await api.post('/api/timer/resume')
      state.status = 'running'
      state.startTime = data.start_time
      startTimestamp = new Date(data.start_time).getTime()
      state.elapsedSeconds = 0
      startTicking()
      return data
    } catch (e) {
      throw e
    }
  }

  // 停止
  async function stop(api) {
    try {
      const data = await api.post('/api/timer/stop')
      state.status = 'idle'
      stopTicking()
      state.totalSegments = data.segments || []
      state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      state.elapsedSeconds = 0
      state.todoId = null
      state.todoContent = ''
      startTimestamp = null
      return data
    } catch (e) {
      throw e
    }
  }

  onUnmounted(() => stopTicking())

  return {
    state,
    displayTime,
    isActive,
    start,
    pause,
    resume,
    stop,
    restore,
  }
}
