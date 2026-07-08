<template>
  <div class="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
    <div class="bg-rice-50 rounded-xl p-5 w-80 shadow-2xl animate-toast-in border border-rice-400">
      <h3 class="text-base font-bold text-rice-800 mb-4">添加 OKR</h3>

      <!-- 层级选择 -->
      <select
        v-model="level"
        class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-3 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        @change="onLevelChange"
      >
        <option value="quarter">季度</option>
        <option value="month">月度</option>
        <option value="week">周度</option>
      </select>

      <!-- 月度：选择月份 -->
      <select
        v-if="level === 'month'"
        v-model="monthStart"
        class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-3 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
      >
        <option v-for="mo in data.months" :key="mo.start" :value="mo.start">
          {{ mo.label }}
        </option>
      </select>

      <!-- 周度：选择月份 + 父OKR + 周范围 -->
      <template v-if="level === 'week'">
        <select
          v-model="weekMonth"
          class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-3 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
          @change="onWeekMonthChange"
        >
          <option v-for="mo in data.months" :key="mo.start" :value="mo.start">
            {{ mo.label }}
          </option>
        </select>
        <select
          v-model="weekParentId"
          class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-3 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        >
          <option value="">父级月度 OKR（可选）</option>
          <option v-for="o in weekParentOptions" :key="o.id" :value="o.id">
            {{ o.title }}
          </option>
        </select>
        <select
          v-model="weekRange"
          class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-3 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        >
          <option value="">选择周范围</option>
          <option v-for="w in weekRangeOptions" :key="w.start" :value="w.start + '|' + w.end">
            {{ w.label }}
          </option>
        </select>
      </template>

      <!-- 标题输入 -->
      <input
        ref="titleInput"
        v-model="title"
        type="text"
        placeholder="目标标题"
        class="w-full border border-rice-400 rounded-lg px-3 py-2 text-sm mb-4 bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300"
        @keydown.enter="save"
      />

      <!-- 按钮 -->
      <div class="flex gap-3 justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-rice-700 hover:bg-rice-200 rounded-lg transition-colors"
        >取消</button>
        <button
          @click="save"
          class="px-4 py-2 text-sm bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 shadow-sm transition-colors"
        >保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useApi } from '../../composables/useApi.js'

const props = defineProps({
  data: { type: Object, default: null },
  currentMonth: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])
const api = useApi()

const level = ref('quarter')
const title = ref('')
const monthStart = ref('')
const weekMonth = ref('')
const weekParentId = ref('')
const weekRange = ref('')
const titleInput = ref(null)

const weekParentOptions = computed(() => {
  const mo = props.data?.months?.find(m => m.start === weekMonth.value)
  return mo?.okrs || []
})

const weekRangeOptions = computed(() => {
  const mo = props.data?.months?.find(m => m.start === weekMonth.value)
  return mo?.weeks || []
})

function onLevelChange() {
  if (props.data?.months?.length) {
    monthStart.value = props.data.months[0].start
    weekMonth.value = props.data.months[0].start
  }
}

function onWeekMonthChange() {
  weekParentId.value = ''
  weekRange.value = ''
}

onMounted(async () => {
  await nextTick()
  titleInput.value?.focus()
  onLevelChange()
})

async function save() {
  const t = title.value.trim()
  if (!t) return

  const body = { level: level.value, title: t, month: props.currentMonth }

  if (level.value === 'month') {
    body.month = monthStart.value
  }
  if (level.value === 'week') {
    if (weekParentId.value) body.parent_id = Number(weekParentId.value)
    if (weekRange.value) {
      const [ws, we] = weekRange.value.split('|')
      body.weekStart = ws
      body.weekEnd = we
    }
    if (!body.weekStart) return
  }

  try {
    await api.post('/api/okrs', body)
    emit('saved')
  } catch (e) {
    console.error(e)
  }
}
</script>
