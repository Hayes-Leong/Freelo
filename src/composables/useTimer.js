import { reactive, computed, onUnmounted } from 'vue'

/**
 * 秒表状态机 composable
 *
 * 模式: stopwatch (香蕉钟正计时) | pomodoro (番茄钟倒计时)
 * 状态: idle | running | paused
 *
 * 番茄钟模式:
 *   focus (25min) → auto-stop → rest (5min) → 提示 → 手动下一个
 *   每完成一个 focus = 一个番茄，标记 record_type: 'pomodoro'
 */
export function useTimer() {
  const state = reactive({
    // 通用状态
    status: 'idle',          // idle | running | paused
    mode: 'stopwatch',       // stopwatch | pomodoro
    todoId: null,
    todoContent: '',
    date: '',
    startTime: null,
    totalSegments: [],
    totalMinutes: 0,

    // 正计时专用
    elapsedSeconds: 0,

    // 番茄钟专用
    pomodoroPhase: 'idle',   // idle | focus | rest
    focusDuration: 25,       // 分钟
    restDuration: 5,         // 分钟
    remainingSeconds: 0,     // 当前阶段剩余秒数
    todayPomodoroCount: 0,   // 今日番茄数
  })

  let intervalId = null
  let startTimestamp = null

  // ---- 显示时间 ----
  const displayTime = computed(() => {
    if (state.mode === 'pomodoro' && (state.status === 'running' || state.status === 'paused')) {
      // 倒计时格式 MM:SS
      const total = state.remainingSeconds
      const m = Math.floor(total / 60)
      const s = total % 60
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    // 正计时格式 H:MM:SS 或 MM:SS
    const total = state.elapsedSeconds
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const isActive = computed(() => state.status === 'running' || state.status === 'paused')

  // ---- 内部 tick ----
  function tick() {
    if (state.status !== 'running' || !startTimestamp) return

    if (state.mode === 'pomodoro') {
      // 倒计时模式
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
      const totalSeconds = state.pomodoroPhase === 'focus'
        ? state.focusDuration * 60
        : state.restDuration * 60
      state.remainingSeconds = Math.max(0, totalSeconds - elapsed)
    } else {
      // 正计时模式
      state.elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000)
    }
  }

  function startTicking() {
    stopTicking()
    tick()
    intervalId = setInterval(tick, 250) // 250ms 更流畅
  }

  function stopTicking() {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
  }

  // ---- 恢复计时 ----
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

      // 恢复后默认进入 stopwatch 模式
      state.mode = data.mode || 'stopwatch'

      if (data.start_time) {
        state.startTime = data.start_time
        startTimestamp = new Date(data.start_time).getTime()
        if (state.mode === 'pomodoro') {
          const total = (state.pomodoroPhase === 'focus' ? state.focusDuration : state.restDuration) * 60
          const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
          state.remainingSeconds = Math.max(0, total - elapsed)
        } else {
          state.elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000)
        }
        if (state.status === 'running') startTicking()
      }

      // 获取今日番茄数
      await loadTodayPomodoros(api)
      return true
    } catch (e) {
      console.error('恢复计时失败:', e)
      return false
    }
  }

  async function loadTodayPomodoros(api) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const data = await api.get(`/api/stats/daily?date=${today}`)
      state.todayPomodoroCount = data.pomodoro_count || 0
    } catch (e) { /* ignore */ }
  }

  // ---- 开始 ----
  async function start(api, todoId, date, todoContent, opts = {}) {
    const mode = opts.mode || state.mode
    // 始终以 manual (香蕉) 开始，番茄完成后由 onFocusComplete 升级为 pomodoro
    const recordType = 'manual'

    try {
      const data = await api.post('/api/timer/start', {
        todo_id: todoId,
        date,
        record_type: recordType,
      })

      state.status = 'running'
      state.mode = mode
      state.todoId = todoId
      state.todoContent = todoContent
      state.date = date
      state.startTime = data.start_time
      state.totalSegments = data.segments || []
      state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      startTimestamp = new Date(data.start_time).getTime()

      if (mode === 'pomodoro') {
        state.pomodoroPhase = 'focus'
        state.focusDuration = opts.focusDuration || 25
        state.restDuration = opts.restDuration || 5
        state.remainingSeconds = state.focusDuration * 60
      } else {
        state.elapsedSeconds = 0
      }

      startTicking()
      return data
    } catch (e) { throw e }
  }

  // ---- 暂停 ----
  async function pause(api) {
    try {
      const data = await api.post('/api/timer/pause')
      state.status = 'paused'
      stopTicking()
      if (data.segments) {
        state.totalSegments = data.segments
        state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      }
      state.elapsedSeconds = 0
      return data
    } catch (e) { throw e }
  }

  // ---- 继续 ----
  async function resume(api) {
    try {
      const data = await api.post('/api/timer/resume')
      state.status = 'running'
      state.startTime = data.start_time
      startTimestamp = new Date(data.start_time).getTime()

      if (state.mode === 'pomodoro') {
        const total = (state.pomodoroPhase === 'focus' ? state.focusDuration : state.restDuration) * 60
        state.remainingSeconds = total
      } else {
        state.elapsedSeconds = 0
      }

      startTicking()
      return data
    } catch (e) { throw e }
  }

  // ---- 停止 ----
  async function stop(api) {
    try {
      const data = await api.post('/api/timer/stop')

      state.status = 'idle'
      stopTicking()
      state.totalSegments = data.segments || []
      state.totalMinutes = state.totalSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0)
      state.elapsedSeconds = 0
      state.remainingSeconds = 0

      state.todoId = null
      state.todoContent = ''
      state.pomodoroPhase = 'idle'
      startTimestamp = null

      return data
    } catch (e) { throw e }
  }

  // ---- 番茄钟：专注完成 → 自动切休息 ----
  async function onFocusComplete(api) {
    const savedTodoId = state.todoId
    const savedTodoContent = state.todoContent
    const stopData = await stop(api)

    // 将刚完成的 focus 分段升级为 pomodoro (番茄)
    if (stopData.last_record_id) {
      try {
        await api.put(`/api/timer/record/${stopData.last_record_id}`, { record_type: 'pomodoro' })
        state.todayPomodoroCount++
      } catch (e) { /* ignore */ }
    }

    // 进入休息阶段
    state.status = 'running'
    state.mode = 'pomodoro'
    state.pomodoroPhase = 'rest'
    state.remainingSeconds = state.restDuration * 60
    state.todoId = savedTodoId
    state.todoContent = savedTodoContent
    // 为休息创建一个新的 time_record（不关联 todo，纯计时）
    try {
      const data = await api.post('/api/timer/start', {
        todo_id: state.todoId,
        date: state.date || new Date().toISOString().slice(0, 10),
        record_type: 'pomodoro_rest',
      })
      state.startTime = data.start_time
      startTimestamp = new Date(data.start_time).getTime()
      startTicking()
    } catch (e) {
      // 如果启动休息计时失败，直接开始倒计时（仅前端）
      startTimestamp = Date.now()
      startTicking()
    }
  }

  // ---- 番茄钟：休息完成 → 提示 ----
  async function onRestComplete(api) {
    // 停止休息计时
    await stop(api)
    state.pomodoroPhase = 'idle'
    state.status = 'idle'
  }

  // ---- 切换模式 ----
  function switchMode(mode) {
    if (state.status !== 'idle') return false // 运行中不能切换
    state.mode = mode
    if (mode === 'pomodoro') {
      state.pomodoroPhase = 'idle'
      state.remainingSeconds = 0
    }
    return true
  }

  // ---- tick 中的番茄钟完成检测 ----
  function checkPomodoroComplete() {
    if (state.mode !== 'pomodoro' || state.status !== 'running') return null
    if (state.remainingSeconds <= 0) {
      if (state.pomodoroPhase === 'focus') return 'focus_done'
      if (state.pomodoroPhase === 'rest') return 'rest_done'
    }
    return null
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
    switchMode,
    checkPomodoroComplete,
    onFocusComplete,
    onRestComplete,
    loadTodayPomodoros,
  }
}
