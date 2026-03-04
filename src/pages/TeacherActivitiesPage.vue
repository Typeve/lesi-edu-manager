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
  <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">教师端｜活动可见列表</h1>
    <p class="mt-2 text-sm text-slate-600">按当前登录教师身份展示已发布活动（由管理员发布后同步）。</p>

    <ul class="mt-4 space-y-2 text-sm">
      <li v-for="item in visibleActivities" :key="item.activityId" class="rounded border border-slate-100 px-3 py-2">
        #{{ item.activityId }}｜{{ item.activityType }}｜{{ item.title }}｜{{ item.scopeType }}:{{ item.scopeTargetId }}
      </li>
    </ul>

    <p v-if="!visibleActivities.length" class="mt-3 text-xs text-slate-500">当前教师暂无可见活动。</p>
  </section>
</template>
