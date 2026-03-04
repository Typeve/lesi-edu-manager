<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { adminApi, type ActivityItem, type ActivityScopeType, type ActivityType } from "../services/admin";
import { ApiError } from "../services/http";
import { useSessionStore } from "../stores/session";

const SNAPSHOT_KEY = "lesi_manager_activities_snapshot";

const session = useSessionStore();

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

const isCancelError = (error: unknown): boolean => {
  return error === "cancel" || error === "close";
};

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

const ensureAdminKey = () => {
  if (!session.state.adminKey) {
    feedback.value = "请先输入管理员Key";
    ElMessage.warning(feedback.value);
    return false;
  }
  return true;
};

const syncSnapshot = () => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(activities.value));
};

const loadActivities = async () => {
  if (!ensureAdminKey()) return;
  loading.value = true;
  feedback.value = "";
  try {
    const result = await adminApi.listActivities(session.state.adminKey);
    activities.value = result.items;
    syncSnapshot();
  } catch (error) {
    feedback.value = error instanceof ApiError ? error.message : "活动加载失败";
    ElMessage.error(feedback.value);
  } finally {
    loading.value = false;
  }
};

const publish = async () => {
  if (!ensureAdminKey()) return;
  if (!form.title.trim() || !form.ownerTeacherId.trim() || !form.startAt || !form.endAt || form.scopeTargetId <= 0) {
    feedback.value = "请完整填写活动信息";
    ElMessage.warning(feedback.value);
    return;
  }

  const timelineNodes = parseTimeline();
  if (!timelineNodes.length) {
    feedback.value = "请至少配置一个时间节点";
    ElMessage.warning(feedback.value);
    return;
  }

  try {
    await ElMessageBox.confirm("确认发布该活动吗？", "确认操作", {
      type: "warning"
    });

    await adminApi.publishActivity(session.state.adminKey, {
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
    ElMessage.success(feedback.value);
    form.title = "";
  } catch (error) {
    if (isCancelError(error)) return;
    feedback.value = error instanceof ApiError ? error.message : "活动发布失败";
    ElMessage.error(feedback.value);
  }
};

onMounted(async () => {
  await loadActivities();
});
</script>

<template>
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-slate-900">管理员｜活动中心</h2>
        <p class="text-sm text-slate-600">创建课程/竞赛/项目活动，配置范围和负责人，发布后同步到教师端预览。</p>
      </div>
    </template>

    <el-form label-position="top">
      <el-form-item label="管理员 Key">
        <el-input
          :model-value="session.state.adminKey"
          placeholder="输入管理员Key"
          show-password
          @update:model-value="session.setAdminKey"
          clearable
        />
      </el-form-item>
    </el-form>

    <el-row :gutter="12" class="mb-4">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>发布活动</template>
          <el-form label-position="top">
            <el-row :gutter="8">
              <el-col :span="12">
                <el-form-item label="活动类型">
                  <el-select v-model="form.activityType" class="w-full">
                    <el-option label="course" value="course" />
                    <el-option label="competition" value="competition" />
                    <el-option label="project" value="project" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="活动标题">
                  <el-input v-model="form.title" placeholder="活动标题" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="负责人教师ID">
                  <el-input v-model="form.ownerTeacherId" placeholder="负责人教师ID" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="范围类型">
                  <el-select v-model="form.scopeType" class="w-full">
                    <el-option label="school" value="school" />
                    <el-option label="college" value="college" />
                    <el-option label="class" value="class" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="范围目标ID">
                  <el-input-number v-model="form.scopeTargetId" :min="1" class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开始时间">
                  <el-date-picker v-model="form.startAt" type="datetime" class="!w-full" value-format="YYYY-MM-DDTHH:mm:ss" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束时间">
                  <el-date-picker v-model="form.endAt" type="datetime" class="!w-full" value-format="YYYY-MM-DDTHH:mm:ss" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="时间节点（每行 key|ISO 时间）">
              <el-input v-model="form.timelineText" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="publish">发布活动</el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span>已发布活动</span>
              <el-button size="small" @click="loadActivities">刷新</el-button>
            </div>
          </template>

          <el-table :data="activities" border size="small" v-loading="loading">
            <el-table-column prop="activityId" label="ID" min-width="70" />
            <el-table-column prop="activityType" label="类型" min-width="100" />
            <el-table-column prop="title" label="标题" min-width="150" />
            <el-table-column prop="scopeType" label="范围类型" min-width="100" />
            <el-table-column prop="scopeTargetId" label="范围ID" min-width="80" />
            <el-table-column prop="ownerTeacherId" label="负责人" min-width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-alert v-if="feedback" :title="feedback" type="success" show-icon :closable="false" />
  </el-card>
</template>
