<template>
  <Transition name="slide">
    <div v-if="visible" class="fixed inset-y-0 right-0 w-96 bg-rice-50 shadow-2xl z-[85] border-l border-rice-400 flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-rice-400">
        <h3 class="text-lg font-bold text-rice-800 flex items-center gap-2">
          <SvgIcon name="chart" :size="20" class="text-terracotta-500" /> 时间统计
        </h3>
        <button @click="visible = false" class="w-8 h-8 rounded-lg hover:bg-rice-200 flex items-center justify-center text-rice-600 transition-colors">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-5">
        <div class="flex gap-1 mb-5 bg-rice-200 rounded-lg p-1">
          <button v-for="opt in spanOptions" :key="opt.value" @click="span = opt.value"
            :class="span === opt.value ? 'bg-rice-50 text-rice-800 shadow-sm' : 'text-rice-600 hover:text-rice-800'"
            class="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors">{{ opt.label }}</button>
        </div>
        <div class="mb-5">
          <h4 class="text-sm font-bold text-rice-700 mb-2">今日总结</h4>
          <div v-if="hasTodayData" class="grid grid-cols-3 gap-3">
            <div class="bg-rice-200 rounded-xl p-3 text-center">
              <SvgIcon name="clock" :size="20" class="mx-auto mb-1 text-terracotta-500" />
              <div class="text-xl font-bold text-terracotta-500">{{ fmtMin(dailySummary.total_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">总耗时</div>
            </div>
            <div class="bg-rice-300/30 rounded-xl p-3 text-center">
              <SvgIcon name="briefcase" :size="20" class="mx-auto mb-1 text-rice-600" />
              <div class="text-xl font-bold text-rice-800">{{ fmtMin(dailySummary.work_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">工作</div>
            </div>
            <div class="bg-ink-400/10 rounded-xl p-3 text-center">
              <SvgIcon name="book" :size="20" class="mx-auto mb-1 text-ink-500" />
              <div class="text-xl font-bold text-ink-600">{{ fmtMin(dailySummary.study_minutes) }}</div>
              <div class="text-xs text-rice-600 mt-0.5">学习</div>
            </div>
          </div>
          <div v-else class="bg-rice-200/50 rounded-xl p-4 text-center">
            <SvgIcon name="clock" :size="32" class="mx-auto mb-2 text-rice-400" />
            <p class="text-sm text-rice-500">今日暂无时间记录</p>
            <p v-if="lastRecordDate" class="text-xs text-rice-400 mt-1">最近记录：{{ lastRecordDate }} · {{ fmtMin(lastRecordTotal) }}</p>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-bold text-rice-700 mb-2">时间趋势</h4>
          <TimeChart v-if="hasChartData" :data="chartData" :span="span" />
          <div v-else class="bg-rice-200/50 rounded-xl p-6 text-center">
            <SvgIcon name="chart" :size="36" class="mx-auto mb-2 text-rice-400" />
            <p class="text-sm text-rice-500">暂无趋势数据</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import TimeChart from './TimeChart.vue'
import SvgIcon from '../common/SvgIcon.vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const visible = ref(false)
const span = ref('week')
const spanOptions = [{ label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const dailySummary = ref({ total_minutes: 0, work_minutes: 0, study_minutes: 0 })
const chartData = ref(null)

const hasTodayData = computed(() => (dailySummary.value?.total_minutes || 0) > 0)
const hasChartData = computed(() => chartData.value?.days?.some(d => (d.total_minutes || 0) > 0) ?? false)
const lastRecordDate = computed(() => { const d = chartData.value?.days || []; for (let i = d.length - 1; i >= 0; i--) { if (d[i].total_minutes > 0) return d[i].date } return null })
const lastRecordTotal = computed(() => { const d = chartData.value?.days || []; for (let i = d.length - 1; i >= 0; i--) { if (d[i].total_minutes > 0) return d[i].total_minutes } return 0 })

function getDateRange() {
  const d = new Date(); const end = d.toISOString().slice(0, 10); const s = new Date(d)
  if (span.value === 'week') s.setDate(s.getDate() - 6)
  else if (span.value === 'month') s.setDate(s.getDate() - 29)
  else s.setDate(s.getDate() - 89)
  return { start: s.toISOString().slice(0, 10), end }
}

async function load() {
  if (!visible.value) return
  try {
    const today = new Date().toISOString().slice(0, 10)
    dailySummary.value = await api.get(`/api/stats/daily?date=${today}`)
    const { start, end } = getDateRange()
    chartData.value = await api.get(`/api/stats/range?start=${start}&end=${end}`)
  } catch (e) { console.error(e) }
}

function open() { visible.value = true; load() }
watch(span, () => { if (visible.value) load() })

function fmtMin(m) { const h = Math.floor((m || 0) / 60); const mm = (m || 0) % 60; if (h > 0 && mm > 0) return `${h}h${mm}m`; if (h > 0) return `${h}h`; return `${mm}m` }

defineExpose({ open })
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
