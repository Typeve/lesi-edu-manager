<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { teacherApi } from "../services/teacher";
import { ApiError } from "../services/http";
import { useSessionStore } from "../stores/session";
import type { TeacherStudentItem } from "../types/teacher";

const router = useRouter();
const session = useSessionStore();

const filters = reactive({
  classId: "",
  majorId: "",
  grade: "",
  assessmentStatus: "",
  reportStatus: "",
  page: 1,
  pageSize: 20
});

const loading = ref(false);
const errorText = ref("");
const items = ref<TeacherStudentItem[]>([]);
const total = ref(0);

const hasTeacherId = computed(() => session.state.teacherId.trim().length > 0);

const load = async () => {
  if (!hasTeacherId.value) {
    items.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  errorText.value = "";
  try {
    const result = await teacherApi.getStudents(session.state.teacherId, {
      classId: filters.classId ? Number(filters.classId) : undefined,
      majorId: filters.majorId ? Number(filters.majorId) : undefined,
      grade: filters.grade ? Number(filters.grade) : undefined,
      assessmentStatus: (filters.assessmentStatus as "done" | "pending" | "") || undefined,
      reportStatus: (filters.reportStatus as "generated" | "pending" | "") || undefined,
      page: filters.page,
      pageSize: filters.pageSize
    });

    items.value = result.items;
    total.value = result.total;
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

watch(
  () => [session.state.teacherId, filters.classId, filters.majorId, filters.grade, filters.assessmentStatus, filters.reportStatus, filters.page],
  async () => {
    await load();
  },
  { immediate: true }
);

const goDetail = (studentId: number) => {
  router.push(`/teacher/students/${studentId}`);
};
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">教师端｜学生列表</h1>
    <p class="mt-2 text-sm text-slate-600">按班级/专业/年级/测评状态/报告状态筛选，仅展示有权限学生。</p>

    <div class="mt-4 grid gap-2 md:grid-cols-3">
      <input
        :value="session.state.teacherId"
        @input="session.setTeacherId(($event.target as HTMLInputElement).value)"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="输入教师ID（如 T-1）"
      />
      <input v-model="filters.classId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="班级ID" />
      <input v-model="filters.majorId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="专业ID" />
      <input v-model="filters.grade" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="年级" />
      <select v-model="filters.assessmentStatus" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="">测评状态（全部）</option>
        <option value="done">已完成</option>
        <option value="pending">未完成</option>
      </select>
      <select v-model="filters.reportStatus" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="">报告状态（全部）</option>
        <option value="generated">已生成</option>
        <option value="pending">未生成</option>
      </select>
    </div>

    <p v-if="!hasTeacherId" class="mt-4 text-sm text-amber-700">请先输入教师ID。</p>
    <p v-else-if="loading" class="mt-4 text-sm text-slate-500">加载中...</p>
    <p v-else-if="errorText" class="mt-4 text-sm text-rose-600">{{ errorText }}</p>

    <div v-else class="mt-5 overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500">
            <th class="px-2 py-2">学号</th>
            <th class="px-2 py-2">姓名</th>
            <th class="px-2 py-2">班级</th>
            <th class="px-2 py-2">专业</th>
            <th class="px-2 py-2">测评</th>
            <th class="px-2 py-2">报告</th>
            <th class="px-2 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.studentId" class="border-b border-slate-100">
            <td class="px-2 py-2">{{ item.studentNo }}</td>
            <td class="px-2 py-2">{{ item.name }}</td>
            <td class="px-2 py-2">{{ item.className }}</td>
            <td class="px-2 py-2">{{ item.majorName || "--" }}</td>
            <td class="px-2 py-2">{{ item.assessmentDone ? "已完成" : "未完成" }}</td>
            <td class="px-2 py-2">{{ item.reportGenerated ? "已生成" : "未生成" }}</td>
            <td class="px-2 py-2">
              <button class="rounded bg-brand-500 px-2 py-1 text-xs text-white" @click="goDetail(item.studentId)">查看详情</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="mt-3 text-xs text-slate-500">共 {{ total }} 条（权限外数据由后端过滤，不显示）</p>
    </div>
  </section>
</template>
