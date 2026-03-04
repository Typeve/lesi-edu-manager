<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { adminApi, type DashboardCockpitResponse, type DashboardDimension } from "../services/admin";
import { ApiError } from "../services/http";
import { useSessionStore } from "../stores/session";

interface TrendRow {
  date: string;
  activatedStudentsCount: number;
  assessmentCompletedStudentsCount: number;
  reportGeneratedStudentsCount: number;
  taskCompletedStudentsCount: number;
  activityParticipatedStudentsCount: number;
}

const session = useSessionStore();

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

const overviewRows = computed(() => {
  if (!data.value) return [];
  return Object.entries(data.value.overview).map(([key, value]) => ({ key, value }));
});

const barChartRows = computed(() => {
  if (!data.value) return [];
  return data.value.byDimension.barChart.series.map((series) => ({
    code: series.code,
    name: series.name,
    values: series.values.join(" / ")
  }));
});

const stackedRows = computed(() => {
  if (!data.value) return [];
  return data.value.byDimension.stackedBarChart.series.map((series) => ({
    direction: series.direction,
    values: series.values.join(" / ")
  }));
});

const trendRows = computed<TrendRow[]>(() => data.value?.trendFunnel.trend ?? []);

const toNumberOrUndefined = (raw: string): number | undefined => {
  if (!raw.trim()) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const load = async () => {
  if (!session.state.adminKey) {
    data.value = null;
    errorText.value = "请先输入管理员Key";
    return;
  }

  loading.value = true;
  errorText.value = "";

  try {
    data.value = await adminApi.getDashboardCockpit(session.state.adminKey, {
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
  () => [
    session.state.adminKey,
    filters.dimension,
    filters.schoolId,
    filters.collegeId,
    filters.majorId,
    filters.classId,
    filters.startDate,
    filters.endDate
  ],
  async () => {
    await load();
  },
  { immediate: true }
);
</script>

<template>
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">管理员｜驾驶舱</h2>
        <p class="text-sm text-slate-600">指标卡 + 柱状图 + 堆叠柱 + 30天趋势折线 + 漏斗图，筛选联动刷新。</p>
      </div>
    </template>

    <el-form label-position="top">
      <el-row :gutter="12">
        <el-col :xs="24" :md="6">
          <el-form-item label="管理员Key">
            <el-input
              :model-value="session.state.adminKey"
              placeholder="管理员Key"
              show-password
              @update:model-value="session.setAdminKey"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item label="统计维度">
            <el-select v-model="filters.dimension" class="w-full">
              <el-option label="class" value="class" />
              <el-option label="major" value="major" />
              <el-option label="college" value="college" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item label="开始日期">
            <el-date-picker v-model="filters.startDate" type="date" class="!w-full" value-format="YYYY-MM-DD" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6">
          <el-form-item label="结束日期">
            <el-date-picker v-model="filters.endDate" type="date" class="!w-full" value-format="YYYY-MM-DD" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="6"><el-form-item label="schoolId"><el-input v-model="filters.schoolId" clearable /></el-form-item></el-col>
        <el-col :xs="24" :md="6"><el-form-item label="collegeId"><el-input v-model="filters.collegeId" clearable /></el-form-item></el-col>
        <el-col :xs="24" :md="6"><el-form-item label="majorId"><el-input v-model="filters.majorId" clearable /></el-form-item></el-col>
        <el-col :xs="24" :md="6"><el-form-item label="classId"><el-input v-model="filters.classId" clearable /></el-form-item></el-col>
      </el-row>
    </el-form>

    <el-alert v-if="errorText" :title="errorText" type="error" show-icon :closable="false" />

    <template v-else-if="data">
      <el-row :gutter="12" class="mb-4">
        <el-col v-for="item in overviewRows" :key="item.key" :xs="24" :md="6">
          <el-statistic :title="item.key" :value="item.value" />
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="mb-3">
            <template #header>柱状图（班级对比）</template>
            <p class="mb-2 text-xs text-slate-500">维度：{{ data.byDimension.barChart.categories.join(" / ") }}</p>
            <el-table :data="barChartRows" border size="small">
              <el-table-column prop="name" label="指标" min-width="120" />
              <el-table-column prop="values" label="数据序列" min-width="200" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="mb-3">
            <template #header>堆叠柱（方向分布）</template>
            <p class="mb-2 text-xs text-slate-500">维度：{{ data.byDimension.stackedBarChart.categories.join(" / ") }}</p>
            <el-table :data="stackedRows" border size="small">
              <el-table-column prop="direction" label="方向" min-width="120" />
              <el-table-column prop="values" label="数据序列" min-width="200" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>折线图（30天趋势）</template>
            <el-table :data="trendRows" border size="small">
              <el-table-column prop="date" label="日期" min-width="110" />
              <el-table-column prop="activatedStudentsCount" label="激活" min-width="80" />
              <el-table-column prop="assessmentCompletedStudentsCount" label="测评" min-width="80" />
              <el-table-column prop="reportGeneratedStudentsCount" label="报告" min-width="80" />
              <el-table-column prop="taskCompletedStudentsCount" label="任务" min-width="80" />
              <el-table-column prop="activityParticipatedStudentsCount" label="活动" min-width="80" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never">
            <template #header>漏斗图（转化链路）</template>
            <el-table :data="data.trendFunnel.funnel" border size="small">
              <el-table-column prop="stageName" label="阶段" min-width="120" />
              <el-table-column prop="count" label="人数" min-width="80" />
              <el-table-column prop="conversionRate" label="转化率" min-width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <div v-loading="loading" class="h-2"></div>
  </el-card>
</template>
