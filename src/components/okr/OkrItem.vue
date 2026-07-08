<template>
  <div class="flex items-center gap-1 py-1 hover:bg-rice-200/50 rounded-lg px-1 group text-sm">
    <span class="truncate text-rice-800 flex-1">{{ okr.title }}</span>
    <button
      class="text-rice-400 hover:text-red-500 invisible group-hover:visible flex-shrink-0 text-sm"
      @click="$emit('delete')"
      title="删除"
    >✕</button>
  </div>
</template>

<script setup>
defineProps({
  okr: { type: Object, required: true },
  level: { type: String, default: 'month' },
})

defineEmits(['delete'])
</script>
