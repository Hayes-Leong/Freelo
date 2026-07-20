<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <AppHeader
      :current-month="state.currentMonth"
      @prev-month="changeMonth(-1)"
      @next-month="changeMonth(1)"
      @open-stats="() => openPanel('stats')"
      @open-achievements="() => openPanel('achievements')"
      @open-settings="() => openPanel('settings')"
    />
    <AppLayout>
      <template #left>
        <!-- 左栏 Tab -->
        <div class="flex gap-1 mb-3 bg-rice-200 rounded-lg p-0.5">
          <button @click="leftTab = 'okr'" :class="leftTab === 'okr' ? 'bg-rice-50 text-rice-800 shadow-sm' : 'text-rice-500 hover:text-rice-700'" class="flex-1 py-1 text-xs font-medium rounded-md transition-colors">OKR</button>
          <button @click="leftTab = 'ideas'" :class="leftTab === 'ideas' ? 'bg-rice-50 text-rice-800 shadow-sm' : 'text-rice-500 hover:text-rice-700'" class="flex-1 py-1 text-xs font-medium rounded-md transition-colors">代办</button>
        </div>
        <OkrPanel v-if="leftTab === 'okr'" :data="okrData" :current-month="state.currentMonth" @refresh="loadOkrs" />
        <IdeaKanban v-else />
      </template>
      <template #center>
        <CalendarGrid
          :days="calendarDays"
          :selected-date="state.selectedDate"
          @select-date="selectDate"
        />
      </template>
      <template #right>
        <!-- 未选择日期 -->
        <div v-if="!state.selectedDate" class="text-rice-700 text-sm p-4">
          <p class="text-center text-rice-400 mt-8">请在日历中点击日期</p>
        </div>

        <!-- 已选择日期 -->
        <template v-else>
          <!-- 奖池卡片 -->
          <div class="bg-gradient-to-br from-rice-200 to-rice-100 rounded-xl p-4 mb-4 border border-rice-400">
            <div class="text-sm text-rice-700 mb-1">休息奖池</div>
            <div class="text-3xl font-bold text-terracotta-500">
              {{ state.balance }} <span class="text-lg text-rice-700">天</span>
            </div>
          </div>

          <!-- 待办面板 -->
          <TodoPanel
            :date="state.selectedDate"
            :todos="todos"
            :day-info="selectedDayInfo"
            :balance="state.balance"
            :current-month="state.currentMonth"
            :timer-active="timerIsActive"
            @refresh="refreshSelectedDate"
            @start-timer="handleStartTimer"
            @checkin="doCheckin"
            @toggle-rest-day="toggleRestDay"
          />
        </template>
      </template>
    </AppLayout>

    <!-- 计时悬浮组件 -->
    <TimerWidget ref="timerWidget" />

    <!-- 统计面板 -->
    <StatsPanel ref="statsPanel" />
    <AchievementsPanel ref="achievementsPanel" />
    <SettingsPanel ref="settingsPanel" />

    <!-- Toast 容器 -->
    <ToastContainer ref="toastContainer" />

    <!-- 确认对话框 -->
    <ConfirmModal ref="confirmModal" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, provide, nextTick } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AppLayout from './components/layout/AppLayout.vue'
import CalendarGrid from './components/calendar/CalendarGrid.vue'
import TodoPanel from './components/todo/TodoPanel.vue'
import OkrPanel from './components/okr/OkrPanel.vue'
import IdeaKanban from './components/ideas/IdeaKanban.vue'
import TimerWidget from './components/timer/TimerWidget.vue'
import StatsPanel from './components/stats/StatsPanel.vue'
import AchievementsPanel from './components/stats/AchievementsPanel.vue'
import SettingsPanel from './components/stats/SettingsPanel.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import ConfirmModal from './components/common/ConfirmModal.vue'
import { useApi } from './composables/useApi.js'

const api = useApi()

// ---- 全局引用 ----
const toastContainer = ref(null)
const confirmModal = ref(null)
const timerWidget = ref(null)
const statsPanel = ref(null)
const achievementsPanel = ref(null)
const settingsPanel = ref(null)

// ---- 全局方法 ----
function toast(msg, type) {
  toastContainer.value?.addToast(msg, type)
}

function confirm(msg) {
  return confirmModal.value?.show(msg) || Promise.resolve(false)
}

// ---- provide 给所有子组件 ----
provide('appApi', api)
provide('appToast', toast)
provide('appConfirm', confirm)

// ---- 状态 ----
const state = reactive({
  currentMonth: '',
  selectedDate: null,
  balance: 0,
})

const leftTab = ref('okr')
const calendarDays = ref([])
const todos = ref([])
const okrData = ref(null)

const selectedDayInfo = computed(() => {
  if (!state.selectedDate) return null
  return calendarDays.value.find(d => d.date === state.selectedDate) || null
})

// ---- 秒表 ----
const timerInstance = ref(null)
const timerIsActive = computed(() => timerInstance.value?.isActive?.value ?? false)

onMounted(async () => {
  const now = new Date()
  state.currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await nextTick()
  timerInstance.value = timerWidget.value?.timer

  // 恢复未完成的计时
  await timerInstance.value?.restore(api)

  loadCalendar()
  loadBalance()
  loadOkrs()
})

// ---- 月份切换 ----
function changeMonth(delta) {
  const [y, m] = state.currentMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  state.currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  state.selectedDate = null
  todos.value = []
  loadCalendar()
  loadOkrs()
}

// ---- 加载日历 ----
async function loadCalendar() {
  try {
    const data = await api.get(`/api/calendar?month=${state.currentMonth}`)
    calendarDays.value = data.days
  } catch (e) { console.error(e) }
}

// ---- 加载余额 ----
async function loadBalance() {
  try {
    const data = await api.get('/api/reward/balance')
    state.balance = data.balance
  } catch (e) { console.error(e) }
}

// ---- 选择日期 ----
async function selectDate(date) {
  state.selectedDate = date
  await Promise.all([loadTodos(date), loadCalendar()])
}

// ---- 加载待办 ----
async function loadTodos(date) {
  try {
    const data = await api.get(`/api/todos?date=${date}`)
    todos.value = data.todos
  } catch (e) { console.error(e) }
}

// ---- 刷新选中日期 ----
async function refreshSelectedDate() {
  if (!state.selectedDate) return
  await Promise.all([loadTodos(state.selectedDate), loadCalendar(), loadBalance()])
}

// ---- 加载 OKR ----
async function loadOkrs() {
  try {
    okrData.value = await api.get(`/api/okrs?month=${state.currentMonth}`)
  } catch (e) { console.error(e) }
}

// ---- 秒表：开始计时 ----
async function handleStartTimer({ todo, mode }) {
  if (timerInstance.value?.state.status !== 'idle') {
    toast('请先停止当前计时', 'warn')
    return
  }
  try {
    const modeLabel = mode === 'pomodoro' ? '🍅 番茄钟' : '🍌 香蕉钟'
    await timerInstance.value?.start(api, todo.id, todo.date, todo.content, { mode })
    toast(`${modeLabel}: ${todo.content}`, 'info')
    refreshSelectedDate()
  } catch (e) {
    toast('开始计时失败: ' + e.message, 'error')
  }
}

// ---- 打卡 ----
async function doCheckin() {
  if (!state.selectedDate) return
  try {
    const res = await api.post(`/api/checkin/${state.selectedDate}`)
    if (res.error) { toast(res.error, 'error'); return }
    toast('打卡成功！+0.5 天', 'success')
    refreshSelectedDate()
  } catch (e) { toast('打卡失败: ' + e.message, 'error') }
}

// ---- 切换休息日 ----
async function toggleRestDay() {
  if (!state.selectedDate) return
  const dayInfo = selectedDayInfo.value
  if (!dayInfo) return

  if (dayInfo.is_workday) {
    if (state.balance < 1) {
      toast(`余额不足（当前 ${state.balance} 天，需要 1 天）`, 'warn')
      return
    }
    const ok = await confirm(`设为休息日将消耗 1 天余额，当前余额 ${state.balance} 天。确定？`)
    if (!ok) return
  }

  try {
    const res = await api.put(`/api/calendar/${state.selectedDate}`, {
      is_workday: dayInfo.is_workday ? 0 : 1,
    })
    if (res.error) { toast(res.error, 'error'); return }
    toast(dayInfo.is_workday ? '已设为休息日 ☕' : '已恢复工作日', 'success')
    refreshSelectedDate()
  } catch (e) { toast('操作失败', 'error') }
}

// ---- 面板 ----
function openPanel(name) {
  if (name === 'stats') statsPanel.value?.open()
  else if (name === 'achievements') achievementsPanel.value?.open()
  else if (name === 'settings') settingsPanel.value?.open()
}

// ---- provide 刷新方法 ----
provide('appRefresh', { loadCalendar, loadBalance, loadOkrs, refreshSelectedDate, loadTodos })
</script>
