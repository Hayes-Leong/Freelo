<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base font-bold text-rice-800">OKR 目标</h2>
      <button
        @click="showModal = true"
        class="px-2 py-1 text-sm text-terracotta-500 hover:bg-rice-200 rounded-lg font-semibold transition-colors"
      >+ 添加</button>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!data" class="text-sm text-rice-400">加载中...</div>
    <div v-else>
      <!-- 季度标签 -->
      <div class="text-sm font-bold text-ink-500 mb-3 pb-2 border-b-2 border-rice-300">
        {{ data.quarterLabel }}
      </div>

      <!-- 季度 OKR -->
      <template v-if="data.quarters && data.quarters.length">
        <div v-for="q in data.quarters" :key="'q'+q.id" class="mb-2 ml-1">
          <OkrItem :okr="q" level="quarter" @delete="handleDelete(q.id)" />
          <KrList :krs="q.krs || []" :okr-id="q.id" @refresh="$emit('refresh')" />
        </div>
      </template>
      <p v-else class="text-sm text-rice-400 ml-1 mb-3">暂无季度 OKR</p>

      <div class="border-t border-rice-300 my-2"></div>

      <!-- 月份 -->
      <template v-for="mo in (data.months || [])" :key="'mo'+mo.month">
        <div class="ml-1 mb-2">
          <div
            class="flex items-center gap-1.5 cursor-pointer text-sm py-1 hover:bg-rice-200/50 rounded-lg px-1 transition-colors"
            @click="toggleMonth(mo.month)"
          >
            <span class="text-rice-500 w-4 flex-shrink-0 font-bold">
              {{ collapsedMonths[mo.month] ? '▸' : '▾' }}
            </span>
            <span class="font-semibold text-rice-700">📆 {{ mo.label }}</span>
            <span v-if="!mo.okrs.length" class="text-rice-400 font-normal"> (暂无)</span>
          </div>

          <div v-show="!collapsedMonths[mo.month]" class="ml-4">
            <template v-for="mOkr in mo.okrs" :key="'m'+mOkr.id">
              <OkrItem :okr="mOkr" level="month" @delete="handleDelete(mOkr.id)" />
              <KrList :krs="mOkr.krs || []" :okr-id="mOkr.id" @refresh="$emit('refresh')" />

              <!-- 周度子 OKR -->
              <template v-for="wOkr in (mOkr.weeks || [])" :key="'w'+wOkr.id">
                <div class="ml-3 border-l-2 border-rice-300 pl-3 mb-2">
                  <div class="text-sm text-rice-500 mb-0.5">
                    📋 {{ fmtWeek(wOkr.start_date, wOkr.end_date) }}
                  </div>
                  <OkrItem :okr="wOkr" level="week" @delete="handleDelete(wOkr.id)" />
                  <KrList :krs="wOkr.krs || []" :okr-id="wOkr.id" @refresh="$emit('refresh')" />
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>
    </div>

    <!-- OKR 创建弹窗 -->
    <OkrFormModal
      v-if="showModal"
      :data="data"
      :current-month="currentMonth"
      @close="showModal = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import OkrItem from './OkrItem.vue'
import KrList from './KrList.vue'
import OkrFormModal from './OkrFormModal.vue'
import { useApi } from '../../composables/useApi.js'

const api = useApi()

const props = defineProps({
  data: { type: Object, default: null },
  currentMonth: { type: String, default: '' },
})

const emit = defineEmits(['refresh'])
// 使用 App.vue 提供的确认弹窗（必须 inject，不能用 useConfirm）
const confirm = inject('appConfirm', () => Promise.resolve(false))

const showModal = ref(false)
const collapsedMonths = reactive({})

function toggleMonth(month) {
  collapsedMonths[month] = !collapsedMonths[month]
}

function fmtWeek(s, e) {
  const sm = new Date(s + 'T00:00:00').getMonth() + 1
  const sd = new Date(s + 'T00:00:00').getDate()
  const em = new Date(e + 'T00:00:00').getMonth() + 1
  const ed = new Date(e + 'T00:00:00').getDate()
  return `${sm}/${sd}-${em}/${ed}`
}

async function handleDelete(id) {
  const ok = await confirm('确定删除此 OKR 及其子 OKR 和关键结果？')
  if (!ok) return
  try {
    await api.del(`/api/okrs/${id}`)
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

function handleSaved() {
  showModal.value = false
  emit('refresh')
}
</script>
