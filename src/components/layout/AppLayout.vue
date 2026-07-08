<template>
  <div class="flex flex-1 overflow-hidden">
    <!-- 左栏：OKR 面板 -->
    <aside class="bg-rice-50 border-r border-rice-400 flex-shrink-0 p-4 overflow-y-auto" style="width:20%">
      <slot name="left" />
    </aside>

    <!-- 中栏：日历 -->
    <section class="flex-1 p-3 overflow-y-auto">
      <div class="bg-rice-50 rounded-xl shadow-sm border border-rice-400 h-full flex flex-col overflow-hidden">
        <slot name="center" />
      </div>
    </section>

    <!-- 右栏：详情 -->
    <aside class="bg-rice-50 border-l border-rice-400 flex-shrink-0 p-4 overflow-y-auto" style="width:20%">
      <h2 class="text-base font-bold text-rice-800 mb-3">日期详情</h2>
      <slot name="right" />
    </aside>
  </div>
</template>
