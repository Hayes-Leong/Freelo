<template>
  <div>
    <!-- KR 项 -->
    <div v-for="kr in krs" :key="kr.id" class="ml-4 flex items-center gap-2 text-sm py-0.5 group">
      <input
        type="checkbox"
        :checked="kr.completed === 1"
        class="w-3.5 h-3.5 accent-terracotta-500"
        @change="toggleKr(kr.id, ($event.target).checked)"
      />
      <span
        :class="kr.completed ? 'line-through text-rice-400' : 'text-rice-700'"
        class="flex-1 truncate"
      >{{ kr.content }}</span>
      <button
        class="text-rice-400 hover:text-red-500 invisible group-hover:visible text-sm"
        @click="deleteKr(kr.id)"
      >✕</button>
    </div>

    <!-- 添加 KR 输入框 -->
    <div class="ml-4 flex items-center gap-1 mb-1">
      <input
        v-model="newKrContent"
        type="text"
        class="flex-1 border border-rice-400 rounded-lg px-2 py-0.5 text-sm bg-rice-50 focus:outline-none focus:ring-1 focus:ring-terracotta-300"
        placeholder="添加关键结果..."
        @keydown.enter="addKr"
      />
      <button
        class="text-terracotta-400 hover:text-terracotta-600 text-sm font-semibold"
        @click="addKr"
      >+</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '../../composables/useApi.js'

const props = defineProps({
  krs: { type: Array, default: () => [] },
  okrId: { type: Number, required: true },
})

const emit = defineEmits(['refresh'])
const api = useApi()
const newKrContent = ref('')

async function toggleKr(id, completed) {
  try {
    await api.put(`/api/okrs/krs/${id}`, { completed: completed ? 1 : 0 })
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

async function deleteKr(id) {
  try {
    await api.del(`/api/okrs/krs/${id}`)
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

async function addKr() {
  const c = newKrContent.value.trim()
  if (!c) return
  try {
    await api.post(`/api/okrs/${props.okrId}/krs`, { content: c })
    newKrContent.value = ''
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}
</script>
