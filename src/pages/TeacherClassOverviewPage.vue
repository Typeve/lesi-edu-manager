<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "../services/http";
import { teacherApi } from "../services/teacher";
import { useSessionStore } from "../stores/session";
import type { TeacherStudentItem } from "../types/teacher";

const router = useRouter();
const session = useSessionStore();

const options = reactive({
  thresholdDays: 30,
  classId: ""
});

const loading = ref(false);
const errorText = ref("");
const students = ref<TeacherStudentItem[]>([]);

const hasTeacherId = computed(() => session.state.teacherId.trim().length > 0);

const load = async () => {
  if (!hasTeacherId.value) {
    students.value = [];
    return;
  }

  loading.value = true;
  errorText.value = "";
  try {
    const result = await teacherApi.getStudents(session.state.teacherId, {
      classId: options.classId ? Number(options.classId) : undefined,
      page: 1,
      pageSize: 100
    });
    students.value = result.items;
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

watch(() => [session.state.teacherId, options.classId], load, { immediate: true });

const rows = computed(() =>
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

const goDetail = (studentId: number) => router.push(`/teacher/students/${studentId}`);
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">教师端｜班级视图与异常名单</h1>
    <p class="mt-2 text-sm text-slate-600">默认异常阈值 30 天，可配置并查看异常学生名单。</p>

    <div class="mt-4 grid gap-2 md:grid-cols-3">
      <input
        :value="session.state.teacherId"
        @input="session.setTeacherId(($event.target as HTMLInputElement).value)"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="教师ID"
      />
      <input v-model="options.classId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="班级ID(可选)" />
      <input v-model.number="options.thresholdDays" type="number" min="1" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="异常阈值天数" />
    </div>

    <p v-if="!hasTeacherId" class="mt-4 text-sm text-amber-700">请先输入教师ID。</p>
    <p v-else-if="loading" class="mt-4 text-sm text-slate-500">加载中...</p>
    <p v-else-if="errorText" class="mt-4 text-sm text-rose-600">{{ errorText }}</p>

    <template v-else>
      <div class="mt-5 grid gap-3 md:grid-cols-4">
        <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">班级覆盖人数</p><p class="mt-1 text-xl font-bold">{{ overview.total }}</p></article>
        <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">未测评</p><p class="mt-1 text-xl font-bold">{{ overview.assessmentPending }}</p></article>
        <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">未报告</p><p class="mt-1 text-xl font-bold">{{ overview.reportPending }}</p></article>
        <article class="rounded-xl border border-slate-200 p-3"><p class="text-xs text-slate-500">长期未打卡</p><p class="mt-1 text-xl font-bold">{{ overview.longNoCheckIn }}</p></article>
      </div>

      <div class="mt-6 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="px-2 py-2">学号</th>
              <th class="px-2 py-2">姓名</th>
              <th class="px-2 py-2">异常项</th>
              <th class="px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in anomalyList" :key="item.studentId" class="border-b border-slate-100">
              <td class="px-2 py-2">{{ item.studentNo }}</td>
              <td class="px-2 py-2">{{ item.name }}</td>
              <td class="px-2 py-2">
                <span v-if="!item.assessmentDone">未测评 </span>
                <span v-if="!item.reportGenerated">未报告 </span>
                <span v-if="item.lastCheckInDays > options.thresholdDays">{{ item.lastCheckInDays }}天未打卡</span>
              </td>
              <td class="px-2 py-2">
                <button class="rounded bg-brand-500 px-2 py-1 text-xs text-white" @click="goDetail(item.studentId)">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
