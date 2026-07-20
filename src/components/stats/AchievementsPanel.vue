<template>
  <Transition name="slide">
    <div v-if="visible" class="fixed inset-y-0 right-0 w-96 bg-rice-50 shadow-2xl z-[86] border-l border-rice-400 flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-rice-400">
        <h3 class="text-lg font-bold text-rice-800 flex items-center gap-2">
          <SvgIcon name="award" :size="20" class="text-amber-500" /> 成就
        </h3>
        <button @click="visible = false" class="w-8 h-8 rounded-lg hover:bg-rice-200 flex items-center justify-center text-rice-600 transition-colors">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-5 space-y-3">
        <!-- 连续打卡 -->
        <div class="bg-gradient-to-br from-amber-50 to-rice-100 rounded-2xl p-5 border border-rice-300/50">
          <div class="flex items-center gap-4">
            <SvgIcon name="zap" :size="40" class="text-amber-500" />
            <div>
              <div class="text-3xl font-bold text-rice-900">{{ data.streak_days }}</div>
              <div class="text-sm text-rice-600">连续打卡天数</div>
              <div v-if="data.streak_days >= 7" class="text-xs text-amber-600 mt-1 font-medium">🏆 周打卡成就达成</div>
            </div>
          </div>
        </div>
        <!-- 累计番茄 -->
        <div class="bg-gradient-to-br from-red-50 to-rice-100 rounded-2xl p-5 border border-rice-300/50">
          <div class="flex items-center gap-4">
            <SvgIcon name="clock" :size="40" class="text-red-400" />
            <div>
              <div class="text-3xl font-bold text-rice-900">{{ data.total_pomodoros }}</div>
              <div class="text-sm text-rice-600">累计番茄数</div>
              <div class="text-xs text-rice-500 mt-1">每次 25 分钟专注完成 = 1 个番茄</div>
              <div v-if="data.total_pomodoros >= 25" class="text-xs text-red-500 mt-1 font-medium">🏆 番茄达人</div>
            </div>
          </div>
        </div>
        <!-- 累计香蕉 -->
        <div class="bg-gradient-to-br from-yellow-50 to-rice-100 rounded-2xl p-5 border border-rice-300/50">
          <div class="flex items-center gap-4">
            <SvgIcon name="briefcase" :size="40" class="text-yellow-500" />
            <div>
              <div class="text-3xl font-bold text-rice-900">{{ data.total_bananas }}</div>
              <div class="text-sm text-rice-600">累计香蕉数</div>
              <div class="text-xs text-rice-500 mt-1">每次手动正计时 = 1 个香蕉</div>
              <div v-if="data.total_bananas >= 50" class="text-xs text-yellow-600 mt-1 font-medium">🏆 勤劳香蕉</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, inject } from 'vue'
import SvgIcon from '../common/SvgIcon.vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const visible = ref(false)
const data = ref({ streak_days: 0, total_pomodoros: 0, total_bananas: 0 })

async function load() {
  try { data.value = await api.get('/api/stats/achievements') } catch (e) { /* ignore */ }
}

function open() { visible.value = true; load() }

defineExpose({ open })
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
