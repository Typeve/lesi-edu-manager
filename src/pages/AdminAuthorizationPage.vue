<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { adminApi, type AccessLevel, type AuthorizationGrantPayload, type GrantType } from "../services/admin";
import { ApiError } from "../services/http";
import { teacherApi } from "../services/teacher";
import type { TeacherStudentItem } from "../types/teacher";

interface ScopeSnapshot extends AuthorizationGrantPayload {
  updatedAt: string;
}

const STORAGE_KEY = "lesi_manager_scope_snapshot";

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

const isCancelError = (error: unknown): boolean => {
  return error === "cancel" || error === "close";
};

const ensureReady = () => {
  if (!form.teacherId.trim()) {
    feedback.value = "请先输入教师ID";
    ElMessage.warning(feedback.value);
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
  if (isCancelError(error)) return;
  feedback.value = error instanceof ApiError ? error.message : "操作失败";
  ElMessage.error(feedback.value);
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
    ElMessage.warning(feedback.value);
    return;
  }

  const payload: AuthorizationGrantPayload = {
    teacherId: form.teacherId.trim(),
    grantType: form.grantType,
    targetId: form.targetId,
    accessLevel: form.accessLevel
  };

  try {
    await ElMessageBox.confirm(`确认${mode === "assign" ? "分配" : "撤销"}该授权吗？`, "确认操作", {
      type: "warning"
    });

    if (mode === "assign") {
      await adminApi.assignGrant(payload);
      upsertSnapshot(payload);
      feedback.value = "授权已分配，并已实时刷新列表";
    } else {
      await adminApi.revokeGrant(payload);
      removeSnapshot(payload);
      feedback.value = "授权已撤销，并已实时刷新列表";
    }
    ElMessage.success(feedback.value);
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
    ElMessage.warning(feedback.value);
    return;
  }

  try {
    await ElMessageBox.confirm(`确认${mode === "assign" ? "批量分配" : "批量撤销"} ${grants.length} 条授权吗？`, "确认操作", {
      type: "warning"
    });

    if (mode === "assign") {
      await adminApi.assignGrantBatch(grants);
      grants.forEach(upsertSnapshot);
      feedback.value = `已批量分配 ${grants.length} 条授权，并实时刷新列表`;
    } else {
      await adminApi.revokeGrantBatch(grants);
      grants.forEach(removeSnapshot);
      feedback.value = `已批量撤销 ${grants.length} 条授权，并实时刷新列表`;
    }
    ElMessage.success(feedback.value);
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
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">管理员｜授权中心</h2>
        <p class="text-sm text-slate-600">按教师查看授权范围，支持单条/批量分配与撤销，操作后立即刷新。</p>
      </div>
    </template>

    <el-form label-position="top">
      <el-row :gutter="12">
        <el-col :xs="24">
          <el-form-item label="教师ID">
            <el-input v-model="form.teacherId" placeholder="输入教师ID（如 T-1）" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="12" class="mb-4">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>单条授权</template>
          <el-form label-position="top">
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="授权类型">
                  <el-select v-model="form.grantType" class="w-full">
                    <el-option label="class" value="class" />
                    <el-option label="student" value="student" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="目标ID">
                  <el-input-number v-model="form.targetId" :min="1" class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="权限级别">
                  <el-select v-model="form.accessLevel" class="w-full">
                    <el-option label="read" value="read" />
                    <el-option label="manage" value="manage" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <el-space>
            <el-button type="primary" @click="submitSingle('assign')">分配</el-button>
            <el-button type="danger" plain @click="submitSingle('revoke')">撤销</el-button>
          </el-space>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>批量授权</template>
          <p class="mb-2 text-xs text-slate-500">每行格式：grantType,targetId,accessLevel（如 class,101,read）</p>
          <el-input v-model="batchText" type="textarea" :rows="5" />
          <el-space class="mt-3">
            <el-button type="primary" @click="submitBatch('assign')">批量分配</el-button>
            <el-button type="danger" plain @click="submitBatch('revoke')">批量撤销</el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>当前教师授权范围（快照）</template>
          <el-table :data="teacherScopes" border size="small">
            <el-table-column prop="grantType" label="类型" min-width="100" />
            <el-table-column prop="targetId" label="目标ID" min-width="90" />
            <el-table-column prop="accessLevel" label="权限" min-width="90" />
            <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
            <template #empty>
              <el-empty description="暂无快照（可先执行分配/撤销）" />
            </template>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>教师可见学生预览（用于校验授权变更）</template>
          <p class="mb-2 text-xs text-slate-500">当前总数：{{ previewTotal }}</p>
          <el-table :data="previewItems" border size="small" v-loading="loadingPreview">
            <el-table-column prop="studentNo" label="学号" min-width="120" />
            <el-table-column prop="name" label="姓名" min-width="90" />
            <el-table-column prop="classId" label="班级ID" min-width="90" />
            <el-table-column label="测评状态" min-width="100">
              <template #default="{ row }">{{ row.assessmentDone ? "测评完成" : "测评未完成" }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-alert v-if="feedback" class="mt-4" :title="feedback" type="success" show-icon :closable="false" />
  </el-card>
</template>
