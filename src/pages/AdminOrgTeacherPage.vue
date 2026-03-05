<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { adminApi } from "../services/admin";
import { ApiError } from "../services/http";

const collegeForm = reactive({ schoolId: 1, name: "" });
const teacherForm = reactive({ name: "", account: "", password: "", status: "active" as "active" | "frozen" });

const colleges = ref<Array<{ collegeId: number; name: string }>>([]);
const teachers = ref<Array<{ teacherId: string; name: string; account: string; status: "active" | "frozen" }>>([]);
const feedback = ref("");

const isCancelError = (error: unknown): boolean => {
  return error === "cancel" || error === "close";
};

const handleError = (error: unknown) => {
  if (isCancelError(error)) return;
  feedback.value = error instanceof ApiError ? error.message : "操作失败";
  ElMessage.error(feedback.value);
};

const createCollege = async () => {
  try {
    const created = await adminApi.createCollege({
      schoolId: Number(collegeForm.schoolId),
      name: collegeForm.name
    });
    colleges.value.push({ collegeId: created.collegeId, name: collegeForm.name });
    feedback.value = "组织树更新成功（已新增学院）";
    ElMessage.success(feedback.value);
    collegeForm.name = "";
  } catch (error) {
    handleError(error);
  }
};

const renameCollege = async (collegeId: number) => {
  try {
    const { value: nextName } = await ElMessageBox.prompt("请输入新学院名称", "学院改名", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /.+/,
      inputErrorMessage: "学院名称不能为空"
    });

    await ElMessageBox.confirm(`确认将学院改名为 ${nextName} 吗？`, "确认操作", {
      type: "warning"
    });

    await adminApi.updateCollege(collegeId, { name: nextName });
    colleges.value = colleges.value.map((item) => (item.collegeId === collegeId ? { ...item, name: nextName } : item));
    feedback.value = "组织树更新成功（已重命名）";
    ElMessage.success(feedback.value);
  } catch (error) {
    handleError(error);
  }
};

const removeCollege = async (collegeId: number) => {
  try {
    await ElMessageBox.confirm("确认删除该学院吗？此操作不可恢复。", "危险操作", {
      type: "warning"
    });

    await adminApi.deleteCollege(collegeId);
    colleges.value = colleges.value.filter((item) => item.collegeId !== collegeId);
    feedback.value = "组织树更新成功（已删除）";
    ElMessage.success(feedback.value);
  } catch (error) {
    handleError(error);
  }
};

const createTeacher = async () => {
  try {
    const created = await adminApi.createTeacher(teacherForm);
    teachers.value.push({
      teacherId: created.teacherId,
      name: teacherForm.name,
      account: teacherForm.account,
      status: teacherForm.status
    });
    feedback.value = "教师账号操作已即时生效";
    ElMessage.success(feedback.value);
    teacherForm.name = "";
    teacherForm.account = "";
    teacherForm.password = "";
  } catch (error) {
    handleError(error);
  }
};

const toggleTeacherStatus = async (teacherId: string, status: "active" | "frozen") => {
  const nextStatus = status === "active" ? "frozen" : "active";

  try {
    await ElMessageBox.confirm(`确认将账号状态改为 ${nextStatus} 吗？`, "确认操作", {
      type: "warning"
    });

    await adminApi.updateTeacherStatus(teacherId, nextStatus);
    teachers.value = teachers.value.map((item) => (item.teacherId === teacherId ? { ...item, status: nextStatus } : item));
    feedback.value = "教师账号操作已即时生效";
    ElMessage.success(feedback.value);
  } catch (error) {
    handleError(error);
  }
};

const resetTeacherPassword = async (teacherId: string) => {
  try {
    const { value: newPassword } = await ElMessageBox.prompt("请输入新密码（至少8位）", "重置密码", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /^.{8,}$/,
      inputErrorMessage: "密码至少8位"
    });

    await ElMessageBox.confirm("确认重置该教师密码吗？", "确认操作", {
      type: "warning"
    });

    await adminApi.resetTeacherPassword(teacherId, newPassword);
    feedback.value = "已完成密码重置";
    ElMessage.success(feedback.value);
  } catch (error) {
    handleError(error);
  }
};
</script>

<template>
  <el-card shadow="never" class="rounded-2xl border border-slate-200">
    <template #header>
      <h2 class="text-xl font-bold text-slate-900">管理员｜组织与教师账号管理</h2>
    </template>

    <el-row :gutter="12" class="mb-4">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>组织树维护</template>
          <el-form label-position="top">
            <el-row :gutter="8">
              <el-col :span="8">
                <el-form-item label="学校ID">
                  <el-input-number v-model="collegeForm.schoolId" :min="1" class="!w-full" />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="学院名称">
                  <el-input v-model="collegeForm.name" placeholder="学院名称" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <el-button type="primary" @click="createCollege">新增学院</el-button>

          <el-table :data="colleges" border class="mt-3">
            <el-table-column prop="collegeId" label="学院ID" min-width="100" />
            <el-table-column prop="name" label="学院名称" min-width="160" />
            <el-table-column label="操作" min-width="170">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" @click="renameCollege(row.collegeId)">改名</el-button>
                  <el-button size="small" type="danger" plain @click="removeCollege(row.collegeId)">删除</el-button>
                </el-space>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>教师账号管理</template>
          <el-form label-position="top">
            <el-row :gutter="8">
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="teacherForm.name" placeholder="姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="账号">
                  <el-input v-model="teacherForm.account" placeholder="账号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="密码">
                  <el-input v-model="teacherForm.password" placeholder="密码" show-password />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-select v-model="teacherForm.status" class="w-full">
                    <el-option label="active" value="active" />
                    <el-option label="frozen" value="frozen" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-button type="primary" @click="createTeacher">创建教师</el-button>

          <el-table :data="teachers" border class="mt-3">
            <el-table-column prop="teacherId" label="教师ID" min-width="100" />
            <el-table-column prop="name" label="姓名" min-width="90" />
            <el-table-column prop="account" label="账号" min-width="120" />
            <el-table-column label="状态" min-width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'warning'" effect="light">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="200">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" @click="toggleTeacherStatus(row.teacherId, row.status)">切换状态</el-button>
                  <el-button size="small" type="warning" plain @click="resetTeacherPassword(row.teacherId)">重置密码</el-button>
                </el-space>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-alert v-if="feedback" :title="feedback" type="success" show-icon :closable="false" />
  </el-card>
</template>
