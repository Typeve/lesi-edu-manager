<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { adminApi, type ActivityItem, type ActivityScopeType, type ActivityType } from "../services/admin";
import { ApiError } from "../services/http";

const SNAPSHOT_KEY = "lesi_manager_activities_snapshot";

const form = reactive({
  activityType: "course" as ActivityType,
  title: "",
  scopeType: "class" as ActivityScopeType,
  scopeTargetId: 0,
  ownerTeacherId: "",
  startAt: "",
  endAt: "",
  timelineText: "报名开始|2026-03-01T09:00:00.000Z\n截止提交|2026-03-20T18:00:00.000Z"
});

const feedback = ref("");
const loading = ref(false);
const activities = ref<ActivityItem[]>([]);

const parseTimeline = () => {
  return form.timelineText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, at] = line.split("|").map((x) => x.trim());
      return { key, at };
    })
    .filter((item) => item.key && item.at);
};

const syncSnapshot = () => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(activities.value));
};

const loadActivities = async () => {
  loading.value = true;
  feedback.value = "";
  try {
    const result = await adminApi.listActivities();
    activities.value = result.items;
    syncSnapshot();
  } catch (error) {
    feedback.value = error instanceof ApiError ? error.message : "活动加载失败";
  } finally {
    loading.value = false;
  }
};

const publish = async () => {
  if (!form.title.trim() || !form.ownerTeacherId.trim() || !form.startAt || !form.endAt || form.scopeTargetId <= 0) {
    feedback.value = "请完整填写活动信息";
    return;
  }

  const timelineNodes = parseTimeline();
  if (!timelineNodes.length) {
    feedback.value = "请至少配置一个时间节点";
    return;
  }

  if (!confirm("确认发布该活动吗？")) return;

  try {
    await adminApi.publishActivity({
      activityType: form.activityType,
      title: form.title.trim(),
      scopeType: form.scopeType,
      scopeTargetId: Number(form.scopeTargetId),
      ownerTeacherId: form.ownerTeacherId.trim(),
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      timelineNodes
    });

    await loadActivities();
    feedback.value = "活动发布成功，教师端可立即查看";
    form.title = "";
  } catch (error) {
    feedback.value = error instanceof ApiError ? error.message : "活动发布失败";
  }
};

onMounted(async () => {
  await loadActivities();
});
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">管理员｜活动中心</h1>
    <p class="text-sm text-slate-600">创建课程/竞赛/项目活动，配置范围和负责人，发布后同步到教师端预览。</p>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">发布活动</h2>
      <div class="mt-3 grid gap-2 md:grid-cols-3">
        <select v-model="form.activityType" class="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="course">course</option>
          <option value="competition">competition</option>
          <option value="project">project</option>
        </select>
        <input v-model="form.title" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="活动标题" />
        <input v-model="form.ownerTeacherId" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="负责人教师ID" />

        <select v-model="form.scopeType" class="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="school">school</option>
          <option value="college">college</option>
          <option value="class">class</option>
        </select>
        <input v-model.number="form.scopeTargetId" type="number" min="1" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="范围目标ID" />
        <div class="flex gap-2">
          <input v-model="form.startAt" type="datetime-local" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <input v-model="form.endAt" type="datetime-local" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
      </div>

      <textarea v-model="form.timelineText" rows="3" class="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"></textarea>

      <button class="mt-2 rounded bg-brand-500 px-3 py-1 text-sm text-white" @click="publish">发布活动</button>
    </section>

    <section class="rounded-xl border border-slate-200 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">已发布活动</h2>
        <button class="rounded bg-slate-100 px-2 py-1 text-xs" @click="loadActivities">刷新</button>
      </div>

      <p v-if="loading" class="mt-2 text-sm text-slate-500">加载中...</p>
      <ul v-else class="mt-2 space-y-2 text-sm">
        <li v-for="item in activities" :key="item.activityId" class="rounded border border-slate-100 px-3 py-2">
          #{{ item.activityId }}｜{{ item.activityType }}｜{{ item.title }}｜{{ item.scopeType }}:{{ item.scopeTargetId }}｜负责人 {{ item.ownerTeacherId }}
        </li>
      </ul>
    </section>

    <p v-if="feedback" class="text-sm text-brand-700">{{ feedback }}</p>
  </section>
</template>
