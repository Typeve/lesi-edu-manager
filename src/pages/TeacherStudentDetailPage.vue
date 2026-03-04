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
  <el-card shadow="never" class="rounded-2xl border border-slate-200" v-loading="loading">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-slate-900">学生详情</h2>
        <el-button @click="router.push('/teacher/students')">返回</el-button>
      </div>
    </template>

    <el-alert v-if="errorText" :title="errorText" type="error" show-icon :closable="false" />

    <el-descriptions v-else-if="detail" :column="2" border>
      <el-descriptions-item label="学号">{{ detail.studentNo }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
      <el-descriptions-item label="测评提交">{{ detail.assessment.done ? "已完成" : "未完成" }}</el-descriptions-item>
      <el-descriptions-item label="报告数量">{{ detail.reports.length }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>
