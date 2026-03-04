<script setup lang="ts">
import { reactive, ref } from "vue";
import { adminApi } from "../services/admin";
import { ApiError } from "../services/http";

const collegeForm = reactive({ schoolId: 1, name: "" });
const teacherForm = reactive({ name: "", account: "", password: "", status: "active" as "active" | "frozen" });

const colleges = ref<Array<{ collegeId: number; name: string }>>([]);
const teachers = ref<Array<{ teacherId: string; name: string; account: string; status: "active" | "frozen" }>>([]);
const feedback = ref("");

const handleError = (error: unknown) => {
  feedback.value = error instanceof ApiError ? error.message : "操作失败";
};

const createCollege = async () => {
  try {
    const created = await adminApi.createCollege({
      schoolId: Number(collegeForm.schoolId),
      name: collegeForm.name
    });
    colleges.value.push({ collegeId: created.collegeId, name: collegeForm.name });
    feedback.value = "组织树更新成功（已新增学院）";
    collegeForm.name = "";
  } catch (error) {
    handleError(error);
  }
};

const renameCollege = async (collegeId: number) => {
  const nextName = prompt("请输入新学院名称");
  if (!nextName) return;

  if (!confirm(`确认将学院改名为 ${nextName} 吗？`)) return;

  try {
    await adminApi.updateCollege(collegeId, { name: nextName });
    colleges.value = colleges.value.map((item) => (item.collegeId === collegeId ? { ...item, name: nextName } : item));
    feedback.value = "组织树更新成功（已重命名）";
  } catch (error) {
    handleError(error);
  }
};

const removeCollege = async (collegeId: number) => {
  if (!confirm("确认删除该学院吗？此操作不可恢复。")) return;

  try {
    await adminApi.deleteCollege(collegeId);
    colleges.value = colleges.value.filter((item) => item.collegeId !== collegeId);
    feedback.value = "组织树更新成功（已删除）";
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
    teacherForm.name = "";
    teacherForm.account = "";
    teacherForm.password = "";
  } catch (error) {
    handleError(error);
  }
};

const toggleTeacherStatus = async (teacherId: string, status: "active" | "frozen") => {
  const nextStatus = status === "active" ? "frozen" : "active";
  if (!confirm(`确认将账号状态改为 ${nextStatus} 吗？`)) return;

  try {
    await adminApi.updateTeacherStatus(teacherId, nextStatus);
    teachers.value = teachers.value.map((item) => (item.teacherId === teacherId ? { ...item, status: nextStatus } : item));
    feedback.value = "教师账号操作已即时生效";
  } catch (error) {
    handleError(error);
  }
};

const resetTeacherPassword = async (teacherId: string) => {
  const newPassword = prompt("请输入新密码（至少8位）");
  if (!newPassword) return;
  if (!confirm("确认重置该教师密码吗？")) return;

  try {
    await adminApi.resetTeacherPassword(teacherId, newPassword);
    feedback.value = "已完成密码重置";
  } catch (error) {
    handleError(error);
  }
};
</script>

<template>
  <section class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow">
    <h1 class="text-xl font-bold text-slate-900">管理员｜组织与教师账号管理</h1>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">组织树维护</h2>
      <div class="mt-3 flex gap-2">
        <input v-model.number="collegeForm.schoolId" type="number" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="学校ID" />
        <input v-model="collegeForm.name" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="学院名称" />
        <button class="rounded bg-brand-500 px-3 py-1 text-sm text-white" @click="createCollege">新增学院</button>
      </div>

      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="college in colleges" :key="college.collegeId" class="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
          <span>{{ college.collegeId }} - {{ college.name }}</span>
          <div class="space-x-2">
            <button class="rounded bg-slate-100 px-2 py-1" @click="renameCollege(college.collegeId)">改名</button>
            <button class="rounded bg-rose-100 px-2 py-1 text-rose-700" @click="removeCollege(college.collegeId)">删除</button>
          </div>
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-slate-200 p-4">
      <h2 class="text-sm font-semibold">教师账号管理</h2>
      <div class="mt-3 grid gap-2 md:grid-cols-5">
        <input v-model="teacherForm.name" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="姓名" />
        <input v-model="teacherForm.account" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="账号" />
        <input v-model="teacherForm.password" class="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="密码" />
        <select v-model="teacherForm.status" class="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="active">active</option>
          <option value="frozen">frozen</option>
        </select>
        <button class="rounded bg-brand-500 px-3 py-1 text-sm text-white" @click="createTeacher">创建教师</button>
      </div>

      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="teacher in teachers" :key="teacher.teacherId" class="flex items-center justify-between rounded border border-slate-100 px-3 py-2">
          <span>{{ teacher.teacherId }}｜{{ teacher.name }}｜{{ teacher.account }}｜{{ teacher.status }}</span>
          <div class="space-x-2">
            <button class="rounded bg-slate-100 px-2 py-1" @click="toggleTeacherStatus(teacher.teacherId, teacher.status)">切换状态</button>
            <button class="rounded bg-amber-100 px-2 py-1 text-amber-700" @click="resetTeacherPassword(teacher.teacherId)">重置密码</button>
          </div>
        </li>
      </ul>
    </section>

    <p v-if="feedback" class="text-sm text-brand-700">{{ feedback }}</p>
  </section>
</template>
