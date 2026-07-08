<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3" style="max-width:360px">
    <div
      v-for="item in toasts"
      :key="item.id"
      :class="[
        'px-5 py-3 rounded-xl shadow-xl text-base font-medium flex items-center gap-3 whitespace-nowrap',
        item.leaving ? 'animate-toast-out' : 'animate-toast-in',
        colorClass(item.type)
      ]"
    >
      <span class="text-lg flex-shrink-0">{{ icon(item.type) }}</span>
      <span>{{ item.msg }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0
const colors = {
  info: 'bg-rice-800 text-rice-50',
  success: 'bg-ink-500 text-white',
  error: 'bg-red-500 text-white',
  warn: 'bg-amber-500 text-white',
}

const icons = { info: '', success: '✅', error: '❌', warn: '⚠️' }

function colorClass(type) { return colors[type] || colors.info }
function icon(type) { return icons[type] || '' }

function addToast(msg, type = 'info') {
  const id = nextId++
  toasts.value.push({ id, msg, type, leaving: false })
  setTimeout(() => {
    const t = toasts.value.find(t => t.id === id)
    if (t) t.leaving = true
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 300)
  }, 3000)
}

defineExpose({ addToast })
</script>
