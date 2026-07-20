<template>
  <div class="flex-1 overflow-y-auto">
    <!-- 星期标题 -->
    <div class="grid grid-cols-7 text-center text-sm font-semibold text-rice-700 border-b border-rice-400 py-2.5 bg-rice-200/50 flex-shrink-0">
      <div v-for="(label, i) in dayLabels" :key="i" :class="i === 0 ? 'text-red-400' : i === 6 ? 'text-terracotta-400' : ''">
        {{ label }}
      </div>
    </div>

    <!-- 时间网格 -->
    <div v-if="loading" class="p-6 text-center text-rice-400 text-sm">加载中...</div>
    <div v-else class="relative" :style="{ minHeight: `${24 * hourHeight}px` }">
      <!-- 小时线 -->
      <div
        v-for="h in 24"
        :key="'line'+h"
        class="absolute left-0 right-0 border-t border-rice-300/50"
        :style="{ top: `${(h - 1) * hourHeight}px` }"
      >
        <span class="absolute -top-2.5 left-1 text-xs text-rice-400 bg-rice-50 px-1">
          {{ String(h - 1).padStart(2, '0') }}:00
        </span>
      </div>

      <!-- 7列 -->
      <div class="grid grid-cols-7 h-full ml-10">
        <div
          v-for="(day, di) in days"
          :key="day.date"
          class="relative border-r border-rice-300/30"
          :class="{ 'bg-rice-100/30': di === todayCol }"
        >
          <!-- 时间块 -->
          <div
            v-for="(block, bi) in day.timeBlocks"
            :key="bi"
            :class="[
              'absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden text-xs',
              block.task_type === 'study' ? 'bg-ink-400/20 text-ink-700' : 'bg-rice-300/60 text-rice-800'
            ]"
            :style="{
              top: `${(block.start_minutes / 60) * hourHeight}px`,
              height: `${Math.max((block.duration_minutes / 60) * hourHeight, 12)}px`,
            }"
            :title="`${block.content} (${block.duration_minutes}min)`"
          >
            <span class="truncate block leading-tight">{{ block.content }}</span>
            <span class="text-xs opacity-60">{{ fmtShort(block.duration_minutes) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'

const api = inject('appApi')

const props = defineProps({
  date: { type: String, default: '' },
})

const loading = ref(true)
const days = ref([])
const hourHeight = 52 // 每小时像素高度

const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

const todayStr = new Date().toISOString().slice(0, 10)
const todayCol = computed(() => {
  if (!days.value.length) return -1
  return days.value.findIndex(d => d.date === todayStr)
})

async function load() {
  loading.value = true
  try {
    const targetDate = props.date || new Date().toISOString().slice(0, 10)
    const data = await api.get(`/api/calendar/week?date=${targetDate}`)
    days.value = data.days || []
  } catch (e) {
    console.error('加载周视图失败:', e)
    days.value = []
  }
  loading.value = false
}

onMounted(load)
watch(() => props.date, load)

function fmtShort(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`
  return `${m}m`
}
</script>
