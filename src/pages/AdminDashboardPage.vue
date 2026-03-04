<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { adminApi, type DashboardCockpitResponse, type DashboardDimension } from "../services/admin";
import { ApiError } from "../services/http";

const filters = reactive({
  dimension: "class" as DashboardDimension,
  schoolId: "",
  collegeId: "",
  majorId: "",
  classId: "",
  startDate: "",
  endDate: ""
});

const loading = ref(false);
const errorText = ref("");
const data = ref<DashboardCockpitResponse | null>(null);

const toNumberOrUndefined = (raw: string): number | undefined => {
  if (!raw.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const load = async () => {
  loading.value = true;
  errorText.value = "";

  try {
    data.value = await adminApi.getDashboardCockpit({
      dimension: filters.dimension,
      schoolId: toNumberOrUndefined(filters.schoolId),
      collegeId: toNumberOrUndefined(filters.collegeId),
      majorId: toNumberOrUndefined(filters.majorId),
      classId: toNumberOrUndefined(filters.classId),
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    });
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "驾驶舱加载失败";
    data.value = null;
  } finally {
    loading.value = false;
  }
};

watch(
  () => [filters.dimension, filters.schoolId, filters.collegeId, filters.majorId, filters.classId, filters.startDate, filters.endDate],
  async () => {
    await load();
  },
  { immediate: true }
);
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">管理员｜驾驶舱</h1>
    <p class="text-sm text-slate-600">指标卡 + 柱状图 + 堆叠柱 + 30天趋势折线 + 漏斗图，筛选联动刷新。</p>

    <div class="grid gap-2 md:grid-cols-4">
      <select v-model="filters.dimension" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="class">class</option>
        <option value="major">major</option>
        <option value="college">college</option>
      </select>
      <input v-model="filters.startDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.endDate" type="date" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.schoolId" placeholder="schoolId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.collegeId" placeholder="collegeId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.majorId" placeholder="majorId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="filters.classId" placeholder="classId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>

    <p v-if="loading" class="text-sm text-slate-500">加载中...</p>
    <p v-else-if="errorText" class="text-sm text-rose-600">{{ errorText }}</p>

    <template v-else-if="data">
      <section class="grid gap-3 md:grid-cols-5">
        <article class="rounded border border-slate-200 p-3" v-for="(value, key) in data.overview" :key="key">
          <p class="text-xs text-slate-500">{{ key }}</p>
          <p class="mt-1 text-lg font-semibold text-slate-900">{{ value }}</p>
        </article>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold">柱状图（班级对比）</h2>
        <div class="mt-2 overflow-x-auto text-xs">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-2 py-1 text-left">维度</th>
                <th v-for="name in data.byDimension.barChart.categories" :key="name" class="px-2 py-1 text-left">{{ name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="series in data.byDimension.barChart.series" :key="series.code">
                <td class="px-2 py-1">{{ series.name }}</td>
                <td v-for="(val, idx) in series.values" :key="idx" class="px-2 py-1">{{ val }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold">堆叠柱（方向分布）</h2>
        <div class="mt-2 overflow-x-auto text-xs">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-2 py-1 text-left">方向</th>
                <th v-for="name in data.byDimension.stackedBarChart.categories" :key="name" class="px-2 py-1 text-left">{{ name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="series in data.byDimension.stackedBarChart.series" :key="series.direction">
                <td class="px-2 py-1">{{ series.direction }}</td>
                <td v-for="(val, idx) in series.values" :key="idx" class="px-2 py-1">{{ val }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold">折线图（30天趋势）</h2>
        <div class="mt-2 overflow-x-auto text-xs">
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-2 py-1 text-left">日期</th>
                <th class="px-2 py-1 text-left">激活</th>
                <th class="px-2 py-1 text-left">测评</th>
                <th class="px-2 py-1 text-left">报告</th>
                <th class="px-2 py-1 text-left">任务</th>
                <th class="px-2 py-1 text-left">活动</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="point in data.trendFunnel.trend" :key="point.date">
                <td class="px-2 py-1">{{ point.date }}</td>
                <td class="px-2 py-1">{{ point.activatedStudentsCount }}</td>
                <td class="px-2 py-1">{{ point.assessmentCompletedStudentsCount }}</td>
                <td class="px-2 py-1">{{ point.reportGeneratedStudentsCount }}</td>
                <td class="px-2 py-1">{{ point.taskCompletedStudentsCount }}</td>
                <td class="px-2 py-1">{{ point.activityParticipatedStudentsCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 p-4">
        <h2 class="text-sm font-semibold">漏斗图（转化链路）</h2>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="stage in data.trendFunnel.funnel" :key="stage.stageCode" class="rounded border border-slate-100 px-3 py-2">
            {{ stage.stageName }}：{{ stage.count }}（转化率 {{ stage.conversionRate }}）
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
