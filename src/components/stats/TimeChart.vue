<template>
  <div ref="chartContainer" class="w-full h-72"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Object, default: null },
  span: { type: String, default: 'week' },
})

const chartContainer = ref(null)
let chart = null

function hoursLabel(minutes) {
  if (!minutes || minutes === 0) return '0'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function buildOption() {
  if (!props.data?.days || !props.data.days.length) return null

  const days = props.data.days
  const dates = days.map(d => d.date.slice(5)) // MM-DD
  const totals = days.map(d => d.total_minutes || 0)
  const workTimes = days.map(d => d.work_minutes || 0)
  const studyTimes = days.map(d => d.study_minutes || 0)

  // 温润日式色板
  const terracotta = '#c17f59'
  const rice = '#d4a853'
  const ink = '#5b8c5a'
  const gridColor = '#ede4d3'
  const textColor = '#8b7e6e'
  const bgColor = '#fffcf7'

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: bgColor,
      borderColor: '#e8ddd0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#4a3f35', fontSize: 13, fontFamily: 'sans-serif' },
      extraCssText: 'border-radius:12px;box-shadow:0 4px 16px rgba(74,63,53,0.08);',
      formatter(params) {
        let html = `<div style="font-weight:600;margin-bottom:8px;color:#4a3f35;font-size:14px">${params[0].axisValue}</div>`
        params.forEach(p => {
          html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px">
            <span style="display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span style="color:#8b7e6e">${p.seriesName}</span>
            </span>
            <b style="color:#4a3f35">${hoursLabel(p.value)}</b>
          </div>`
        })
        return html
      },
    },
    legend: {
      data: ['总耗时', '工作', '学习'],
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 20,
      textStyle: { color: textColor, fontSize: 12 },
    },
    grid: {
      left: 0,
      right: 8,
      top: 16,
      bottom: 36,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 11, margin: 8 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        margin: 8,
        formatter(v) { return hoursLabel(v) },
      },
    },
    series: [
      {
        name: '总耗时',
        type: 'line',
        data: totals,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: terracotta, width: 2.5 },
        itemStyle: { color: terracotta, borderColor: '#fffcf7', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(193,127,89,0.12)' },
            { offset: 1, color: 'rgba(193,127,89,0)' },
          ]),
        },
      },
      {
        name: '工作',
        type: 'line',
        data: workTimes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: rice, width: 2 },
        itemStyle: { color: rice, borderColor: '#fffcf7', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(212,168,83,0.10)' },
            { offset: 1, color: 'rgba(212,168,83,0)' },
          ]),
        },
      },
      {
        name: '学习',
        type: 'line',
        data: studyTimes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: ink, width: 2 },
        itemStyle: { color: ink, borderColor: '#fffcf7', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(91,140,90,0.10)' },
            { offset: 1, color: 'rgba(91,140,90,0)' },
          ]),
        },
      },
    ],
  }
}

function render() {
  if (!chartContainer.value) return
  const option = buildOption()
  if (!option) return

  if (!chart) {
    chart = echarts.init(chartContainer.value)
  }
  chart.setOption(option, true)
}

onMounted(() => { render() })

watch(
  () => [props.data, props.span],
  () => { render() },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (chart) { chart.dispose(); chart = null }
})

function onResize() { chart?.resize() }
window.addEventListener('resize', onResize)
</script>
