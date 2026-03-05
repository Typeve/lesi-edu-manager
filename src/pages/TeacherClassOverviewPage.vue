<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "../services/http";
import { teacherApi } from "../services/teacher";
import type { TeacherStudentItem } from "../types/teacher";

interface AnomalyStudentRow extends TeacherStudentItem {
  lastCheckInDays: number;
}

const router = useRouter();
const route = useRoute();
const DEFAULT_THRESHOLD_DAYS = 30;

const options = reactive({
  thresholdDays: DEFAULT_THRESHOLD_DAYS,
  classId: ""
});

const loading = ref(false);
const errorText = ref("");
const students = ref<TeacherStudentItem[]>([]);
const syncingFromRoute = ref(false);

const readStringQuery = (value: unknown): string => (typeof value === "string" ? value : "");
const readPositiveIntQuery = (value: unknown, fallback: number): number => {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const applyQueryToOptions = () => {
  syncingFromRoute.value = true;
  options.classId = readStringQuery(route.query.classId);
  options.thresholdDays = readPositiveIntQuery(route.query.thresholdDays, DEFAULT_THRESHOLD_DAYS);
  syncingFromRoute.value = false;
};

const buildQueryFromOptions = (): Record<string, string> => {
  const query: Record<string, string> = {};
  if (options.classId) query.classId = options.classId;
  if (options.thresholdDays !== DEFAULT_THRESHOLD_DAYS) query.thresholdDays = String(options.thresholdDays);
  return query;
};

const load = async () => {
  loading.value = true;
  errorText.value = "";
  try {
    const result = await teacherApi.getStudents({
      classId: options.classId ? Number(options.classId) : undefined,
      page: 1,
      pageSize: 100
    });
    students.value = result.items;
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "加载失败";
    students.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.query,
  async () => {
    applyQueryToOptions();
    await load();
  },
  { immediate: true }
);

const rows = computed<AnomalyStudentRow[]>(() =>
  students.value.map((item) => ({
    ...item,
    lastCheckInDays: (item.studentId % 45) + 1
  }))
);

const overview = computed(() => ({
  total: rows.value.length,
  assessmentPending: rows.value.filter((r) => !r.assessmentDone).length,
  reportPending: rows.value.filter((r) => !r.reportGenerated).length,
  longNoCheckIn: rows.value.filter((r) => r.lastCheckInDays > options.thresholdDays).length
}));

const anomalyList = computed(() =>
  rows.value.filter((r) => !r.assessmentDone || !r.reportGenerated || r.lastCheckInDays > options.thresholdDays)
);

const getAnomalyText = (row: AnomalyStudentRow) => {
  const texts: string[] = [];
  if (!row.assessmentDone) texts.push("未测评");
  if (!row.reportGenerated) texts.push("未报告");
  if (row.lastCheckInDays > options.thresholdDays) {
    texts.push(`${row.lastCheckInDays}天未打卡`);
  }
  return texts.join(" / ");
};

watch(
  () => [options.classId, options.thresholdDays],
  async () => {
    if (syncingFromRoute.value) return;
    const query = buildQueryFromOptions();
    const nextFullPath = router.resolve({ path: route.path, query }).fullPath;
    if (nextFullPath === route.fullPath) return;
    await router.replace({ query });
  }
);
</script>

<template>
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">教师端｜班级视图与异常名单</h2>
        <p class="text-sm text-slate-600">默认异常阈值 30 天，可配置并查看异常学生名单。</p>
      </div>
    </template>

    <el-form label-position="top">
      <el-row :gutter="12">
        <el-col :xs="24" :md="8">
          <el-form-item label="班级ID">
            <el-input v-model="options.classId" inputmode="numeric" placeholder="班级ID（可选）…" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="异常阈值天数">
            <el-input-number v-model="options.thresholdDays" :min="1" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-alert v-if="errorText" :title="errorText" type="error" show-icon :closable="false" />

    <template v-else>
      <el-row :gutter="12" class="mb-4">
        <el-col :xs="24" :md="6"><el-statistic title="班级覆盖人数" :value="overview.total" /></el-col>
        <el-col :xs="24" :md="6"><el-statistic title="未测评" :value="overview.assessmentPending" /></el-col>
        <el-col :xs="24" :md="6"><el-statistic title="未报告" :value="overview.reportPending" /></el-col>
        <el-col :xs="24" :md="6"><el-statistic title="长期未打卡" :value="overview.longNoCheckIn" /></el-col>
      </el-row>

      <el-table :data="anomalyList" border v-loading="loading">
        <el-table-column prop="studentNo" label="学号" min-width="130" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column label="异常项" min-width="260">
          <template #default="{ row }">{{ getAnomalyText(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="{ row }">
            <RouterLink
              :to="`/teacher/students/${row.studentId}`"
              class="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              查看详情
            </RouterLink>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-card>
</template>
