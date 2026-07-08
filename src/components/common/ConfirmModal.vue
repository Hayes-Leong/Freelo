<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-30 z-[90] flex items-center justify-center">
    <div class="bg-rice-50 rounded-xl p-6 w-80 shadow-2xl animate-toast-in border border-rice-400">
      <p class="text-base text-rice-800 mb-5">{{ message }}</p>
      <div class="flex gap-3 justify-end">
        <button
          @click="resolve(false)"
          class="px-5 py-2 text-sm text-rice-700 hover:bg-rice-200 rounded-lg transition-colors"
        >取消</button>
        <button
          @click="resolve(true)"
          class="px-5 py-2 text-sm bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 shadow-sm transition-colors"
        >确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let pendingResolve = null

function show(msg) {
  return new Promise((resolve) => {
    message.value = msg
    visible.value = true
    pendingResolve = resolve
  })
}

function resolve(val) {
  visible.value = false
  if (pendingResolve) {
    pendingResolve(val)
    pendingResolve = null
  }
}

defineExpose({ show })
</script>
