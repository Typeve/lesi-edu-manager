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
  const totalCovered = classMetrics.value.reduce((sum, item) => sum + item.covered, 0);
  const avg = (key: "assessmentRate" | "reportRate" | "taskRate") =>
    classMetrics.value.reduce((sum, item) => sum + item[key], 0) / classMetrics.value.length;

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
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <h2 class="text-xl font-bold text-slate-900">教师端驾驶舱</h2>
    </template>

    <el-row :gutter="12" class="mb-4">
      <el-col :xs="24" :md="6"><el-statistic title="覆盖人数" :value="cards.covered" /></el-col>
      <el-col :xs="24" :md="6"><el-statistic title="测评完成率" :value="cards.assessment * 100" suffix="%" :precision="1" /></el-col>
      <el-col :xs="24" :md="6"><el-statistic title="报告生成率" :value="cards.report * 100" suffix="%" :precision="1" /></el-col>
      <el-col :xs="24" :md="6"><el-statistic title="任务完成率" :value="cards.task * 100" suffix="%" :precision="1" /></el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="mb-3">
          <template #header>柱状图｜班级对比（测评完成率）</template>
          <div class="space-y-2">
            <div v-for="item in classMetrics" :key="item.className" class="text-xs">
              <div class="mb-1 flex justify-between"><span>{{ item.className }}</span><span>{{ (item.assessmentRate * 100).toFixed(1) }}%</span></div>
              <el-progress :percentage="Number((item.assessmentRate * 100).toFixed(1))" :stroke-width="10" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="mb-3">
          <template #header>堆叠柱｜方向分布</template>
          <div class="space-y-3">
            <div v-for="item in classMetrics" :key="`${item.className}-stack`" class="text-xs">
              <div class="mb-1">{{ item.className }}</div>
              <el-progress :show-text="false" :percentage="Math.round((item.direction.employment / item.covered) * 100)" color="#409eff" />
              <el-progress :show-text="false" :percentage="Math.round((item.direction.postgraduate / item.covered) * 100)" color="#67c23a" />
              <el-progress :show-text="false" :percentage="Math.round((item.direction.civil / item.covered) * 100)" color="#e6a23c" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>折线图｜30天趋势（示意）</template>
          <svg class="h-32 w-full" viewBox="0 0 300 120">
            <polyline fill="none" stroke="#409eff" stroke-width="3" :points="trend.map((v, i) => `${i * 30},${120 - v}`).join(' ')" />
          </svg>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>漏斗图｜转化链路</template>
          <div class="space-y-2">
            <div v-for="(item, idx) in funnel" :key="item.name" class="text-xs">
              <div class="mb-1 flex justify-between"><span>{{ idx + 1 }}. {{ item.name }}</span><span>{{ item.value }}</span></div>
              <el-progress :percentage="Math.round((item.value / funnel[0].value) * 100)" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>
