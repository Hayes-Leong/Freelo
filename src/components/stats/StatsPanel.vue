<template>
  <!-- 统计抽屉 -->
  <Transition name="slide">
    <div v-if="visible" class="fixed inset-y-0 right-0 w-96 bg-rice-50 shadow-2xl z-[85] border-l border-rice-400 flex flex-col">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-rice-400">
        <h3 class="text-lg font-bold text-rice-800 flex items-center gap-2">
          <svg class="w-5 h-5 text-terracotta-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          时间统计
        </h3>
        <button
          @click="visible = false"
          class="w-8 h-8 rounded-lg hover:bg-rice-200 flex items-center justify-center text-rice-600 transition-colors"
        >✕</button>
      </div>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-5">
        <!-- 时间跨度切换 -->
        <div class="flex gap-1 mb-5 bg-rice-200 rounded-lg p-1">
          <button
            v-for="opt in spanOptions"
            :key="opt.value"
            @click="span = opt.value"
            :class="span === opt.value
              ? 'bg-rice-50 text-rice-800 shadow-sm'
              : 'text-rice-600 hover:text-rice-800'"
            class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
          >{{ opt.label }}</button>
        </div>

        <!-- 每日总结 -->
        <div class="mb-5">
          <h4 class="text-sm font-bold text-rice-700 mb-2">今日总结</h4>

          <!-- 有今日数据：统计卡片 -->
          <div v-if="hasTodayData" class="grid grid-cols-3 gap-3">
            <div class="bg-rice-200 rounded-xl p-3 text-center">
              <svg class="w-5 h-5 mx-auto mb-1 text-terracotta-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div class="text-xl font-bold text-terracotta-500">{{ fmtMin(dailySummary.total_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">总耗时</div>
            </div>
            <div class="bg-rice-300/30 rounded-xl p-3 text-center">
              <svg class="w-5 h-5 mx-auto mb-1 text-rice-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M12 12v.01"/>
              </svg>
              <div class="text-xl font-bold text-rice-800">{{ fmtMin(dailySummary.work_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">工作</div>
            </div>
            <div class="bg-ink-400/10 rounded-xl p-3 text-center">
              <svg class="w-5 h-5 mx-auto mb-1 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
              </svg>
              <div class="text-xl font-bold text-ink-600">{{ fmtMin(dailySummary.study_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">学习</div>
            </div>
          </div>

          <!-- 今日无数据 -->
          <div v-else class="bg-rice-200/50 rounded-xl p-4 text-center">
            <svg class="w-8 h-8 mx-auto mb-2 text-rice-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p class="text-sm text-rice-500">今日暂无时间记录</p>
            <p v-if="lastRecordDate" class="text-xs text-rice-400 mt-1">
              最近记录：{{ lastRecordDate }} · {{ fmtMin(lastRecordTotal) }}
            </p>
            <p v-else class="text-xs text-rice-400 mt-1">开始计时后，数据将自动汇总到这里</p>
          </div>
        </div>

        <!-- 趋势图 -->
        <div>
          <h4 class="text-sm font-bold text-rice-700 mb-2">时间趋势</h4>
          <TimeChart
            v-if="hasChartData"
            :data="chartData"
            :span="span"
          />
          <div v-else class="bg-rice-200/50 rounded-xl p-6 text-center">
            <svg class="w-10 h-10 mx-auto mb-2 text-rice-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p class="text-sm text-rice-500">暂无趋势数据</p>
            <p class="text-xs text-rice-400 mt-1">完成计时后将生成时间变化曲线</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TimeChart from './TimeChart.vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const visible = ref(false)

const span = ref('week')
const spanOptions = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' },
]

const dailySummary = ref({ total_minutes: 0, work_minutes: 0, study_minutes: 0, completed_todos: 0 })
const chartData = ref(null)

const hasTodayData = computed(() => (dailySummary.value?.total_minutes || 0) > 0)
const hasChartData = computed(() =>
  chartData.value?.days?.some(d => (d.total_minutes || 0) > 0) ?? false
)

// 从图表数据中找最近有记录的日期
const lastRecordDate = computed(() => {
  const days = chartData.value?.days || []
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total_minutes > 0) return days[i].date
  }
  return null
})
const lastRecordTotal = computed(() => {
  const days = chartData.value?.days || []
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].total_minutes > 0) return days[i].total_minutes
  }
  return 0
})

function fmtMin(m) {
  const h = Math.floor((m || 0) / 60)
  const mm = (m || 0) % 60
  if (h > 0 && mm > 0) return `${h}h${mm}m`
  if (h > 0) return `${h}h`
  return `${mm}m`
}

function getDateRange() {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  let start
  const d = new Date(today)
  if (span.value === 'week') {
    d.setDate(d.getDate() - 6)
  } else if (span.value === 'month') {
    d.setDate(d.getDate() - 29)
  } else {
    d.setDate(d.getDate() - 89)
  }
  start = d.toISOString().slice(0, 10)
  return { start, end }
}

async function loadStats() {
  if (!visible.value) return
  try {
    const today = new Date().toISOString().slice(0, 10)
    const daily = await api.get(`/api/stats/daily?date=${today}`)
    dailySummary.value = daily
    const { start, end } = getDateRange()
    const range = await api.get(`/api/stats/range?start=${start}&end=${end}`)
    chartData.value = range
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

function open() {
  visible.value = true
  loadStats()
}

watch(span, () => {
  if (visible.value) loadStats()
})

defineExpose({ open })
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
