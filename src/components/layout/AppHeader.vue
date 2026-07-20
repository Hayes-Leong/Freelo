<template>
  <header class="bg-rice-50/80 backdrop-blur border-b border-rice-400 px-6 py-3 flex items-center justify-between flex-shrink-0">
    <h1 style="font-family:'Playfair Display',serif;font-style:italic;font-size:1.5rem;letter-spacing:0.15em;font-weight:700;color:#4a3f35;">
      Freelo
    </h1>
    <div class="flex items-center gap-2">
      <button @click="$emit('prevMonth')" class="px-3 py-1.5 rounded-lg hover:bg-rice-200 text-rice-700 transition-colors text-lg">‹</button>
      <span class="text-base font-semibold text-rice-800 w-32 text-center">{{ formattedMonth }}</span>
      <button @click="$emit('nextMonth')" class="px-3 py-1.5 rounded-lg hover:bg-rice-200 text-rice-700 transition-colors text-lg">›</button>

      <!-- 三个独立面板入口 -->
      <span class="text-rice-300 mx-1">|</span>
      <button @click="$emit('openStats')" class="px-3 py-1.5 text-sm text-rice-600 hover:bg-rice-200 rounded-lg transition-colors font-medium flex items-center gap-1" title="时间统计"><SvgIcon name="chart" :size="16" /> 统计</button>
      <button @click="$emit('openAchievements')" class="px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium flex items-center gap-1" title="成就"><SvgIcon name="award" :size="16" /> 成就</button>
      <button @click="$emit('openSettings')" class="px-3 py-1.5 text-sm text-rice-500 hover:bg-rice-200 rounded-lg transition-colors font-medium flex items-center gap-1" title="设置"><SvgIcon name="settings" :size="16" /> 设置</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '../common/SvgIcon.vue'

const props = defineProps({
  currentMonth: { type: String, required: true },
})

defineEmits(['prevMonth', 'nextMonth', 'openStats', 'openAchievements', 'openSettings'])

const formattedMonth = computed(() => {
  const [y, m] = props.currentMonth.split('-')
  return `${y}年${m}月`
})
</script>
