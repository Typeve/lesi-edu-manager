<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { adminApi, type AccessLevel, type AuthorizationGrantPayload, type GrantType } from "../services/admin";
import { ApiError } from "../services/http";
import { teacherApi } from "../services/teacher";
import { useSessionStore } from "../stores/session";
import type { TeacherStudentItem } from "../types/teacher";

interface ScopeSnapshot extends AuthorizationGrantPayload {
  updatedAt: string;
}

const STORAGE_KEY = "lesi_manager_scope_snapshot";

const session = useSessionStore();

const form = reactive({
  teacherId: "",
  grantType: "class" as GrantType,
  targetId: 0,
  accessLevel: "read" as AccessLevel
});

const batchText = ref("class,101,read\nstudent,1001,manage");
const feedback = ref("");
const loadingPreview = ref(false);
const previewTotal = ref(0);
const previewItems = ref<TeacherStudentItem[]>([]);

const scopes = ref<ScopeSnapshot[]>(readSnapshot());

function readSnapshot(): ScopeSnapshot[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScopeSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const persistSnapshot = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scopes.value));
};

const teacherScopes = computed(() => {
  const teacherId = form.teacherId.trim();
  if (!teacherId) return [];
  return scopes.value
    .filter((item) => item.teacherId === teacherId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
});

const ensureReady = () => {
  if (!session.state.adminKey) {
    feedback.value = "请先输入管理员Key";
    return false;
  }
  if (!form.teacherId.trim()) {
    feedback.value = "请先输入教师ID";
    return false;
  }
  return true;
};

const upsertSnapshot = (payload: AuthorizationGrantPayload) => {
  const key = `${payload.teacherId}-${payload.grantType}-${payload.targetId}`;
  const next: ScopeSnapshot = {
    ...payload,
    updatedAt: new Date().toISOString()
  };

  const idx = scopes.value.findIndex((item) => `${item.teacherId}-${item.grantType}-${item.targetId}` === key);
  if (idx >= 0) {
    scopes.value[idx] = next;
  } else {
    scopes.value.unshift(next);
  }
  persistSnapshot();
};

const removeSnapshot = (payload: AuthorizationGrantPayload) => {
  scopes.value = scopes.value.filter(
    (item) =>
      !(item.teacherId === payload.teacherId && item.grantType === payload.grantType && item.targetId === payload.targetId)
  );
  persistSnapshot();
};

const handleError = (error: unknown) => {
  feedback.value = error instanceof ApiError ? error.message : "操作失败";
};

const refreshPreview = async () => {
  if (!form.teacherId.trim()) {
    previewItems.value = [];
    previewTotal.value = 0;
    return;
  }

  loadingPreview.value = true;
  try {
    const result = await teacherApi.getStudents(form.teacherId.trim(), { page: 1, pageSize: 20 });
    previewItems.value = result.items;
    previewTotal.value = result.total;
  } catch {
    previewItems.value = [];
    previewTotal.value = 0;
  } finally {
    loadingPreview.value = false;
  }
};

const submitSingle = async (mode: "assign" | "revoke") => {
  if (!ensureReady()) return;
  if (!Number.isInteger(form.targetId) || form.targetId <= 0) {
    feedback.value = "目标ID必须为正整数";
    return;
  }

  const payload: AuthorizationGrantPayload = {
    teacherId: form.teacherId.trim(),
    grantType: form.grantType,
    targetId: form.targetId,
    accessLevel: form.accessLevel
  };

  if (!confirm(`确认${mode === "assign" ? "分配" : "撤销"}该授权吗？`)) return;

  try {
    if (mode === "assign") {
      await adminApi.assignGrant(session.state.adminKey, payload);
      upsertSnapshot(payload);
      feedback.value = "授权已分配，并已实时刷新列表";
    } else {
      await adminApi.revokeGrant(session.state.adminKey, payload);
      removeSnapshot(payload);
      feedback.value = "授权已撤销，并已实时刷新列表";
    }

    await refreshPreview();
  } catch (error) {
    handleError(error);
  }
};

const parseBatch = (): AuthorizationGrantPayload[] => {
  return batchText.value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [grantTypeRaw, targetIdRaw, accessLevelRaw] = line.split(",").map((x) => x.trim());
      const grantType = grantTypeRaw === "student" ? "student" : "class";
      const accessLevel = accessLevelRaw === "manage" ? "manage" : "read";
      const targetId = Number(targetIdRaw);
      return {
        teacherId: form.teacherId.trim(),
        grantType,
        targetId,
        accessLevel
      } as AuthorizationGrantPayload;
    })
    .filter((item) => Number.isInteger(item.targetId) && item.targetId > 0);
};

const submitBatch = async (mode: "assign" | "revoke") => {
  if (!ensureReady()) return;
  const grants = parseBatch();
  if (!grants.length) {
    feedback.value = "批量内容为空或格式不正确";
    return;
  }

  if (!confirm(`确认${mode === "assign" ? "批量分配" : "批量撤销"} ${grants.length} 条授权吗？`)) return;

  try {
    if (mode === "assign") {
      await adminApi.assignGrantBatch(session.state.adminKey, grants);
      grants.forEach(upsertSnapshot);
      feedback.value = `已批量分配 ${grants.length} 条授权，并实时刷新列表`;
    } else {
      await adminApi.revokeGrantBatch(session.state.adminKey, grants);
      grants.forEach(removeSnapshot);
      feedback.value = `已批量撤销 ${grants.length} 条授权，并实时刷新列表`;
    }

    await refreshPreview();
  } catch (error) {
    handleError(error);
  }
};

watch(
  () => form.teacherId,
  async () => {
    await refreshPreview();
  }
);
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">管理员｜授权中心</h1>
    <p class="text-sm text-slate-600">按教师查看授权范围，支持单条/批量分配与撤销，操作后立即刷新。</p>

    <div class="grid gap-2 md:grid-cols-2">
      <input
        :value="session.state.adminKey"
        @input="session.setAdminKey(($event.target as HTMLInputElement).value)"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="输入管理员Key"
      />
      <input v-model="form.teacherId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="输入教师ID（如 T-1）" />
    </div>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">单条授权</h2>
      <div class="mt-3 grid gap-2 md:grid-cols-4">
        <select v-model="form.grantType" class="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="class">class</option>
          <option value="student">student</option>
        </select>
        <input v-model.number="form.targetId" type="number" min="1" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="目标ID" />
        <select v-model="form.accessLevel" class="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="read">read</option>
          <option value="manage">manage</option>
        </select>
        <div class="space-x-2">
          <button class="rounded bg-brand-500 px-3 py-1 text-sm text-white" @click="submitSingle('assign')">分配</button>
          <button class="rounded bg-rose-500 px-3 py-1 text-sm text-white" @click="submitSingle('revoke')">撤销</button>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">批量授权</h2>
      <p class="mt-1 text-xs text-slate-500">每行格式：grantType,targetId,accessLevel（例：class,101,read）</p>
      <textarea v-model="batchText" rows="4" class="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"></textarea>
      <div class="mt-2 space-x-2">
        <button class="rounded bg-brand-500 px-3 py-1 text-sm text-white" @click="submitBatch('assign')">批量分配</button>
        <button class="rounded bg-rose-500 px-3 py-1 text-sm text-white" @click="submitBatch('revoke')">批量撤销</button>
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">当前教师授权范围（快照）</h2>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="item in teacherScopes" :key="`${item.teacherId}-${item.grantType}-${item.targetId}`" class="rounded border border-slate-100 px-2 py-1">
          {{ item.teacherId }}｜{{ item.grantType }} #{{ item.targetId }}｜{{ item.accessLevel || 'read' }}｜{{ item.updatedAt }}
        </li>
      </ul>
      <p v-if="!teacherScopes.length" class="mt-2 text-xs text-slate-500">暂无快照（可先执行分配/撤销）。</p>
    </section>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">教师可见学生预览（用于校验授权变更）</h2>
      <p v-if="loadingPreview" class="mt-2 text-sm text-slate-500">加载中...</p>
      <template v-else>
        <p class="mt-2 text-xs text-slate-500">当前总数：{{ previewTotal }}</p>
        <ul class="mt-2 space-y-1 text-xs">
          <li v-for="item in previewItems" :key="item.studentId" class="rounded border border-slate-100 px-2 py-1">
            {{ item.studentNo }}｜{{ item.name }}｜班级 {{ item.classId }}｜{{ item.assessmentDone ? '测评完成' : '测评未完成' }}
          </li>
        </ul>
      </template>
    </section>

    <p v-if="feedback" class="text-sm text-brand-700">{{ feedback }}</p>
  </section>
</template>
