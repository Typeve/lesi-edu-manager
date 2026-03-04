<script setup lang="ts">
import { computed } from "vue";
import { useSessionStore } from "../stores/session";
import type { ActivityItem } from "../services/admin";

const SNAPSHOT_KEY = "lesi_manager_activities_snapshot";
const session = useSessionStore();

const allActivities = computed<ActivityItem[]>(() => {
  const raw = localStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
});

const visibleActivities = computed(() => {
  const teacherId = session.state.user?.teacherId?.trim();
  if (!teacherId) return [];
  return allActivities.value.filter((item) => item.ownerTeacherId === teacherId);
});
</script>

<template>
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">教师端｜活动可见列表</h2>
        <p class="text-sm text-slate-600">按当前教师ID展示已发布活动（由管理员发布后同步）。</p>
      </div>
    </template>

    <el-form label-position="top">
      <el-form-item label="教师ID">
        <el-input
          :model-value="session.state.teacherId"
          placeholder="输入教师ID（如 T-1）"
          @update:model-value="session.setTeacherId"
          clearable
        />
      </el-form-item>
    </el-form>

    <el-table :data="visibleActivities" border>
      <el-table-column prop="activityId" label="ID" min-width="80" />
      <el-table-column prop="activityType" label="类型" min-width="100" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="scopeType" label="范围类型" min-width="100" />
      <el-table-column prop="scopeTargetId" label="范围ID" min-width="100" />
      <template #empty>
        <el-empty description="当前教师暂无可见活动。" />
      </template>
    </el-table>
  </el-card>
</template>
