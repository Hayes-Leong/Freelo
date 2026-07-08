<template>
  <header class="bg-rice-50/80 backdrop-blur border-b border-rice-400 px-6 py-3 flex items-center justify-between flex-shrink-0">
    <h1 style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.5rem;letter-spacing:0.15em;font-weight:700;color:#4a3f35;">
      Freelo
    </h1>
    <div class="flex items-center gap-2">
      <button
        @click="$emit('prevMonth')"
        class="px-3 py-1.5 rounded-lg hover:bg-rice-200 text-rice-700 transition-colors text-lg"
      >‹</button>
      <span class="text-base font-semibold text-rice-800 w-32 text-center">
        {{ formattedMonth }}
      </span>
      <button
        @click="$emit('nextMonth')"
        class="px-3 py-1.5 rounded-lg hover:bg-rice-200 text-rice-700 transition-colors text-lg"
      >›</button>
      <!-- 统计入口 -->
      <button
        @click="$emit('openStats')"
        class="ml-3 px-3 py-1.5 text-terracotta-500 hover:bg-rice-200 rounded-lg transition-colors flex items-center gap-1"
        title="时间统计"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentMonth: { type: String, required: true },
})

defineEmits(['prevMonth', 'nextMonth', 'openStats'])

const formattedMonth = computed(() => {
  const [y, m] = props.currentMonth.split('-')
  return `${y}年${m}月`
})
</script>
