<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "../services/http";
import { teacherApi } from "../services/teacher";
import type { TeacherStudentDetailResponse } from "../types/teacher";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const errorText = ref("");
const detail = ref<TeacherStudentDetailResponse | null>(null);

onMounted(async () => {
  loading.value = true;
  const studentId = Number(route.params.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    errorText.value = "学生ID无效";
    loading.value = false;
    return;
  }

  try {
    detail.value = await teacherApi.getStudentDetail(studentId);
  } catch (error) {
    errorText.value = error instanceof ApiError ? error.message : "详情加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-900">学生详情</h1>
      <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm" @click="router.push('/teacher/students')">返回</button>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">加载中...</p>
    <p v-else-if="errorText" class="text-sm text-rose-600">{{ errorText }}</p>

    <dl v-else-if="detail" class="grid gap-3 md:grid-cols-2">
      <div class="rounded-xl border border-slate-200 p-3"><dt class="text-xs text-slate-500">学号</dt><dd class="mt-1 text-sm">{{ detail.studentNo }}</dd></div>
      <div class="rounded-xl border border-slate-200 p-3"><dt class="text-xs text-slate-500">姓名</dt><dd class="mt-1 text-sm">{{ detail.name }}</dd></div>
      <div class="rounded-xl border border-slate-200 p-3"><dt class="text-xs text-slate-500">测评提交</dt><dd class="mt-1 text-sm">{{ detail.assessment.done ? '已完成' : '未完成' }}</dd></div>
      <div class="rounded-xl border border-slate-200 p-3"><dt class="text-xs text-slate-500">报告数量</dt><dd class="mt-1 text-sm">{{ detail.reports.length }}</dd></div>
    </dl>
  </section>
</template>
