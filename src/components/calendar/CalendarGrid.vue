<template>
  <div class="h-full flex flex-col">
    <!-- 月/周切换 -->
    <div class="flex gap-1 px-3 pt-2 pb-1">
      <button
        v-for="opt in viewOptions"
        :key="opt.value"
        @click="view = opt.value"
        :class="view === opt.value
          ? 'bg-rice-200 text-rice-800 font-medium'
          : 'text-rice-500 hover:text-rice-700'"
        class="px-3 py-1 text-xs rounded-md transition-colors"
      >{{ opt.label }}</button>
    </div>

    <!-- 月视图 -->
    <template v-if="view === 'month'">
      <div class="grid grid-cols-7 text-center text-sm font-semibold text-rice-700 border-b border-rice-400 py-2.5 bg-rice-200/50">
        <div class="text-red-400">日</div>
        <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div>
        <div class="text-terracotta-400">六</div>
      </div>
      <div class="grid grid-cols-7 flex-1">
        <CalendarCell
          v-for="day in days"
          :key="day.date"
          :day="day"
          :is-selected="day.date === selectedDate"
          @click="$emit('selectDate', day.date)"
        />
      </div>
    </template>

    <!-- 周视图 -->
    <WeekView v-else :date="selectedDate || todayStr" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CalendarCell from './CalendarCell.vue'
import WeekView from './WeekView.vue'

defineProps({
  days: { type: Array, default: () => [] },
  selectedDate: { type: String, default: null },
})

defineEmits(['selectDate'])

const view = ref('month')
const viewOptions = [
  { label: '月', value: 'month' },
  { label: '周', value: 'week' },
]
const todayStr = new Date().toISOString().slice(0, 10)
</script>
