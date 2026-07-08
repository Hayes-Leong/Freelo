<template>
  <div class="mt-6">
    <h3 class="text-base font-bold text-rice-800 mb-2">💡 代办看板</h3>
    <div class="flex gap-2 mb-3">
      <input
        v-model="content"
        type="text"
        placeholder="添加灵感事项..."
        class="flex-1 border border-rice-400 rounded-lg px-3 py-2 text-sm bg-rice-50 text-rice-800 placeholder-rice-400 focus:outline-none focus:ring-2 focus:ring-terracotta-300 transition-shadow"
        @keydown.enter="addIdea"
      />
      <button
        @click="addIdea"
        class="px-4 py-2 bg-terracotta-500 text-white rounded-lg text-sm hover:bg-terracotta-600 transition-colors shadow-sm"
      >+</button>
    </div>
    <ul class="space-y-1.5 text-sm">
      <li v-if="ideas.length === 0" class="text-sm text-rice-400">暂无灵感事项</li>
      <li
        v-for="idea in ideas"
        :key="idea.id"
        class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-rice-200/50 group transition-colors"
      >
        <span class="flex-1 truncate text-rice-700">{{ idea.content }}</span>
        <button
          class="text-rice-400 hover:text-red-500 invisible group-hover:visible text-sm"
          @click="deleteIdea(idea.id)"
        >✕</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()
const ideas = ref([])
const content = ref('')

async function loadIdeas() {
  try {
    const data = await api.get('/api/ideas')
    ideas.value = data.ideas || []
  } catch (e) {
    console.error(e)
  }
}

async function addIdea() {
  const c = content.value.trim()
  if (!c) return
  try {
    await api.post('/api/ideas', { content: c })
    content.value = ''
    await loadIdeas()
  } catch (e) {
    console.error(e)
  }
}

async function deleteIdea(id) {
  try {
    await api.del(`/api/ideas/${id}`)
    await loadIdeas()
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadIdeas)
</script>
