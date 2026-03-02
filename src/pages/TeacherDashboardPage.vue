<script setup lang="ts">
import { computed, ref } from "vue";

interface ClassMetric {
  className: string;
  covered: number;
  assessmentRate: number;
  reportRate: number;
  taskRate: number;
  direction: { employment: number; postgraduate: number; civil: number };
}

const classMetrics = ref<ClassMetric[]>([
  { className: "1班", covered: 42, assessmentRate: 0.86, reportRate: 0.81, taskRate: 0.72, direction: { employment: 20, postgraduate: 15, civil: 7 } },
  { className: "2班", covered: 38, assessmentRate: 0.79, reportRate: 0.74, taskRate: 0.68, direction: { employment: 18, postgraduate: 12, civil: 8 } },
  { className: "3班", covered: 40, assessmentRate: 0.83, reportRate: 0.78, taskRate: 0.71, direction: { employment: 16, postgraduate: 16, civil: 8 } }
]);

const cards = computed(() => {
  const totalCovered = classMetrics.value.reduce((s, c) => s + c.covered, 0);
  const avg = (key: "assessmentRate" | "reportRate" | "taskRate") =>
    classMetrics.value.reduce((s, c) => s + c[key], 0) / classMetrics.value.length;

  return {
    covered: totalCovered,
    assessment: avg("assessmentRate"),
    report: avg("reportRate"),
    task: avg("taskRate")
  };
});

const trend = ref([52, 55, 57, 60, 61, 64, 66, 69, 70, 74]);

const funnel = ref([
  { name: "激活", value: 120 },
  { name: "测评", value: 100 },
  { name: "报告", value: 92 },
  { name: "任务", value: 84 },
  { name: "参与", value: 76 }
]);
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">教师端驾驶舱</h1>

    <div class="grid gap-3 md:grid-cols-4">
      <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">覆盖人数</p><p class="mt-1 text-xl font-bold">{{ cards.covered }}</p></article>
      <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">测评完成率</p><p class="mt-1 text-xl font-bold">{{ (cards.assessment*100).toFixed(1) }}%</p></article>
      <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">报告生成率</p><p class="mt-1 text-xl font-bold">{{ (cards.report*100).toFixed(1) }}%</p></article>
      <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">任务完成率</p><p class="mt-1 text-xl font-bold">{{ (cards.task*100).toFixed(1) }}%</p></article>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold text-slate-900">柱状图｜班级对比（测评完成率）</h2>
        <div class="mt-3 space-y-2">
          <div v-for="item in classMetrics" :key="item.className" class="text-xs">
            <div class="mb-1 flex justify-between"><span>{{ item.className }}</span><span>{{ (item.assessmentRate*100).toFixed(1) }}%</span></div>
            <div class="h-2 rounded bg-slate-100"><div class="h-2 rounded bg-brand-500" :style="{ width: `${item.assessmentRate*100}%` }"></div></div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold text-slate-900">堆叠柱｜方向分布</h2>
        <div class="mt-3 space-y-2">
          <div v-for="item in classMetrics" :key="`${item.className}-stack`" class="text-xs">
            <div class="mb-1">{{ item.className }}</div>
            <div class="flex h-3 overflow-hidden rounded bg-slate-100">
              <div class="bg-sky-500" :style="{ width: `${(item.direction.employment/item.covered)*100}%` }"></div>
              <div class="bg-violet-500" :style="{ width: `${(item.direction.postgraduate/item.covered)*100}%` }"></div>
              <div class="bg-amber-500" :style="{ width: `${(item.direction.civil/item.covered)*100}%` }"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold text-slate-900">折线图｜30天趋势（示意）</h2>
        <svg class="mt-3 h-32 w-full" viewBox="0 0 300 120">
          <polyline
            fill="none"
            stroke="#0b7285"
            stroke-width="3"
            :points="trend.map((v, i) => `${i*30},${120-v}`).join(' ')"
          />
        </svg>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold text-slate-900">漏斗图｜转化链路</h2>
        <div class="mt-3 space-y-2">
          <div v-for="(item, idx) in funnel" :key="item.name" class="text-xs">
            <div class="mb-1 flex justify-between"><span>{{ idx+1 }}. {{ item.name }}</span><span>{{ item.value }}</span></div>
            <div class="h-2 rounded bg-slate-100"><div class="h-2 rounded bg-brand-500" :style="{ width: `${(item.value / funnel[0].value) * 100}%` }"></div></div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
