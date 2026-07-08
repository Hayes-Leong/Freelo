<template>
  <div class="mb-4 space-y-2">
    <!-- 第一行：类型 + 预估时间 -->
    <div class="flex gap-2">
      <select
        v-model="taskType"
        :disabled="disabled"
        class="flex-1 border border-rice-400 rounded-lg px-2 py-1.5 text-xs bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow disabled:opacity-50"
      >
        <option value="work">💼 工作</option>
        <option value="study">📚 学习</option>
      </select>
      <select
        v-model="estimatedDuration"
        :disabled="disabled"
        class="flex-1 border border-rice-400 rounded-lg px-2 py-1.5 text-xs bg-rice-50 text-rice-800 focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow disabled:opacity-50"
      >
        <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- 第二行：输入框 + 添加按钮 -->
    <div class="flex gap-2">
      <input
        v-model="content"
        :disabled="disabled"
        type="text"
        placeholder="新待办..."
        class="flex-1 border border-rice-400 rounded-lg px-3 py-1.5 text-sm bg-rice-50 text-rice-800 placeholder-rice-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow disabled:opacity-50"
        @keydown.enter="submit"
      />
      <button
        :disabled="disabled || !content.trim()"
        class="px-4 py-1.5 bg-terracotta-500 text-white rounded-lg text-sm hover:bg-terracotta-600 transition-colors shadow-sm disabled:opacity-50"
        @click="submit"
      >+</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '../../composables/useApi.js'

const props = defineProps({
  date: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['added'])

const api = useApi()

const taskType = ref('work')
const estimatedDuration = ref(60)
const content = ref('')

// 15分钟为步长的预估时间选项（15m ~ 8h）
const durationOptions = []
for (let m = 15; m <= 480; m += 15) {
  const h = Math.floor(m / 60)
  const mm = m % 60
  const label = h > 0 && mm > 0 ? `${h}h${mm}m` : h > 0 ? `${h}h` : `${mm}m`
  durationOptions.push({ value: m, label })
}

async function submit() {
  const c = content.value.trim()
  if (!c || !props.date || props.disabled) return

  try {
    await api.post('/api/todos', {
      date: props.date,
      content: c,
      is_core: 0,
      task_type: taskType.value,
      estimated_duration: estimatedDuration.value,
    })
    content.value = ''
    emit('added')
  } catch (e) {
    console.error('创建待办失败:', e)
  }
}
</script>
