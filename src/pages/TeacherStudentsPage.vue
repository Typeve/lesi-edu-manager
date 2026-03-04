<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { teacherApi } from "../services/teacher";
import { ApiError } from "../services/http";
import type { TeacherStudentItem } from "../types/teacher";

const router = useRouter();

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

const load = async () => {
  loading.value = true;
  errorText.value = "";
  try {
    const result = await teacherApi.getStudents({
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
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(
  () => [filters.classId, filters.majorId, filters.grade, filters.assessmentStatus, filters.reportStatus, filters.page],
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
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">教师端｜学生列表</h2>
        <p class="text-sm text-slate-600">按班级/专业/年级/测评状态/报告状态筛选，仅展示有权限学生。</p>
      </div>
    </template>

    <el-form label-position="top" class="mb-2">
      <el-row :gutter="12">
        <el-col :xs="24" :md="8">
          <el-form-item label="教师ID">
            <el-input
              :model-value="session.state.teacherId"
              placeholder="输入教师ID（如 T-1）"
              @update:model-value="session.setTeacherId"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="班级ID">
            <el-input v-model="filters.classId" placeholder="班级ID" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="专业ID">
            <el-input v-model="filters.majorId" placeholder="专业ID" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="年级">
            <el-input v-model="filters.grade" placeholder="年级" clearable />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="测评状态">
            <el-select v-model="filters.assessmentStatus" class="w-full" placeholder="测评状态（全部）" clearable>
              <el-option label="已完成" value="done" />
              <el-option label="未完成" value="pending" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="8">
          <el-form-item label="报告状态">
            <el-select v-model="filters.reportStatus" class="w-full" placeholder="报告状态（全部）" clearable>
              <el-option label="已生成" value="generated" />
              <el-option label="未生成" value="pending" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-alert v-if="!hasTeacherId" title="请先输入教师ID。" type="warning" show-icon :closable="false" />
    <el-alert v-else-if="errorText" :title="errorText" type="error" show-icon :closable="false" />

    <el-table v-else :data="items" border class="mt-4" v-loading="loading">
      <el-table-column prop="studentNo" label="学号" min-width="140" />
      <el-table-column prop="name" label="姓名" min-width="110" />
      <el-table-column prop="className" label="班级" min-width="140" />
      <el-table-column prop="majorName" label="专业" min-width="140">
        <template #default="{ row }">{{ row.majorName || "--" }}</template>
      </el-table-column>
      <el-table-column label="测评" min-width="100">
        <template #default="{ row }">
          <el-tag :type="row.assessmentDone ? 'success' : 'warning'" effect="light">
            {{ row.assessmentDone ? "已完成" : "未完成" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报告" min-width="100">
        <template #default="{ row }">
          <el-tag :type="row.reportGenerated ? 'success' : 'info'" effect="light">
            {{ row.reportGenerated ? "已生成" : "未生成" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="goDetail(row.studentId)">查看详情</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无数据" />
      </template>
    </el-table>

    <div class="mt-3 text-xs text-slate-500">共 {{ total }} 条（权限外数据由后端过滤，不显示）</div>
  </el-card>
</template>
