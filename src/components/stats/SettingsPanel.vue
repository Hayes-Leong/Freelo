<template>
  <Transition name="slide">
    <div v-if="visible" class="fixed inset-y-0 right-0 w-96 bg-rice-50 shadow-2xl z-[87] border-l border-rice-400 flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-rice-400">
        <h3 class="text-lg font-bold text-rice-800 flex items-center gap-2">
          <SvgIcon name="settings" :size="20" class="text-rice-600" /> 设置
        </h3>
        <button @click="visible = false" class="w-8 h-8 rounded-lg hover:bg-rice-200 flex items-center justify-center text-rice-600 transition-colors">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <!-- 番茄钟 -->
        <div class="bg-rice-200/50 rounded-xl p-4">
          <h4 class="text-sm font-bold text-rice-700 mb-3 flex items-center gap-2"><SvgIcon name="clock" :size="16" class="text-terracotta-500" /> 番茄钟默认时长</h4>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <label class="text-xs text-rice-500 mb-1 block">专注（分钟）</label>
              <select v-model.number="cfg.focusDuration" @change="save" class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                <option v-for="m in [15,20,25,30,35,40,45,50,55,60]" :key="m" :value="m">{{ m }} 分钟</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="text-xs text-rice-500 mb-1 block">休息（分钟）</label>
              <select v-model.number="cfg.restDuration" @change="save" class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
                <option v-for="m in [3,5,10,15,20]" :key="m" :value="m">{{ m }} 分钟</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 香蕉换算 -->
        <div class="bg-rice-200/50 rounded-xl p-4">
          <h4 class="text-sm font-bold text-rice-700 mb-3 flex items-center gap-2"><SvgIcon name="clock" :size="16" class="text-yellow-500" /> 香蕉换算</h4>
          <div>
            <label class="text-xs text-rice-500 mb-1 block">每工作多少分钟 = 1 根香蕉</label>
            <select v-model.number="cfg.bananaThreshold" @change="save" class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
              <option v-for="m in [15,20,25,30,45,60]" :key="m" :value="m">{{ m }} 分钟</option>
            </select>
          </div>
        </div>

        <!-- 打卡奖励 -->
        <div class="bg-rice-200/50 rounded-xl p-4">
          <h4 class="text-sm font-bold text-rice-700 mb-3 flex items-center gap-2"><SvgIcon name="check" :size="16" class="text-ink-500" /> 打卡奖励</h4>
          <div>
            <label class="text-xs text-rice-500 mb-1 block">每次打卡奖励（天）</label>
            <select v-model.number="cfg.rewardPerCheckin" @change="save" class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
              <option v-for="v in [0.25,0.5,1,1.5,2]" :key="v" :value="v">{{ v }} 天</option>
            </select>
          </div>
        </div>

        <!-- 时区 -->
        <div class="bg-rice-200/50 rounded-xl p-4">
          <h4 class="text-sm font-bold text-rice-700 mb-3 flex items-center gap-2"><SvgIcon name="calendar" :size="16" class="text-rice-600" /> 时区</h4>
          <div>
            <label class="text-xs text-rice-500 mb-1 block">选择时区</label>
            <select v-model="cfg.timezone" @change="save" class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300">
              <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
            </select>
            <p class="text-xs text-rice-400 mt-2">当前时区时间：{{ currentTime }}</p>
          </div>
        </div>

        <p class="text-xs text-rice-400 text-center">选择即自动保存</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import SvgIcon from '../common/SvgIcon.vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const toast = inject('appToast', () => {})
const visible = ref(false)

const cfg = ref({ focusDuration: 25, restDuration: 5, rewardPerCheckin: 0.5, timezone: 'UTC+8', bananaThreshold: 25 })

const timezones = [
  { value: 'UTC-12', label: 'UTC-12 国际日期变更线西' },
  { value: 'UTC-8', label: 'UTC-8 太平洋时间（洛杉矶）' },
  { value: 'UTC-5', label: 'UTC-5 东部时间（纽约）' },
  { value: 'UTC+0', label: 'UTC+0 格林威治（伦敦）' },
  { value: 'UTC+1', label: 'UTC+1 中欧时间（巴黎）' },
  { value: 'UTC+8', label: 'UTC+8 北京时间（上海）' },
  { value: 'UTC+9', label: 'UTC+9 东京时间' },
]

function getOffset(tz) {
  const m = tz.match(/UTC([+-]\d+)/); if (!m) return 0
  return parseInt(m[1]) * 60 + new Date().getTimezoneOffset()
}

const currentTime = computed(() => {
  const d = new Date(Date.now() - getOffset(cfg.value.timezone) * 60000)
  return d.toLocaleString('zh-CN', { hour12: false })
})

async function load() {
  try {
    const d = await api.get('/api/config'); const c = d.config || {}
    if (c.focus_duration) cfg.value.focusDuration = Number(c.focus_duration)
    if (c.rest_duration) cfg.value.restDuration = Number(c.rest_duration)
    if (c.reward_per_checkin) cfg.value.rewardPerCheckin = Number(c.reward_per_checkin)
    if (c.banana_threshold) cfg.value.bananaThreshold = Number(c.banana_threshold)
    if (c.timezone) cfg.value.timezone = c.timezone
  } catch (e) { /* ignore */ }
}

async function save() {
  try {
    await api.put('/api/config', { key: 'focus_duration', value: String(cfg.value.focusDuration) })
    await api.put('/api/config', { key: 'rest_duration', value: String(cfg.value.restDuration) })
    await api.put('/api/config', { key: 'reward_per_checkin', value: String(cfg.value.rewardPerCheckin) })
    await api.put('/api/config', { key: 'banana_threshold', value: String(cfg.value.bananaThreshold) })
    await api.put('/api/config', { key: 'timezone', value: cfg.value.timezone })
    toast('设置已保存', 'success')
  } catch (e) { toast('保存失败', 'error') }
}

function open() { visible.value = true; load() }

defineExpose({ open })
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
