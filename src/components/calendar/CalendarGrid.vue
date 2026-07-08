<template>
  <div>
    <!-- 星期标题 -->
    <div class="grid grid-cols-7 text-center text-sm font-semibold text-rice-700 border-b border-rice-400 py-2.5 bg-rice-200/50">
      <div class="text-red-400">日</div>
      <div>一</div>
      <div>二</div>
      <div>三</div>
      <div>四</div>
      <div>五</div>
      <div class="text-terracotta-400">六</div>
    </div>
    <!-- 日历网格 -->
    <div class="grid grid-cols-7 flex-1">
      <CalendarCell
        v-for="day in days"
        :key="day.date"
        :day="day"
        :is-selected="day.date === selectedDate"
        @click="$emit('selectDate', day.date)"
      />
    </div>
  </div>
</template>

<script setup>
import CalendarCell from './CalendarCell.vue'

defineProps({
  days: { type: Array, default: () => [] },
  selectedDate: { type: String, default: null },
})

defineEmits(['selectDate'])
</script>
