<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSessionStore } from "./stores/session";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const isLoginPage = computed(() => route.path === "/login");
const isTeacherLoggedIn = computed(() => session.state.teacherId.trim().length > 0);
const isAdminLoggedIn = computed(() => session.state.adminKey.trim().length > 0);

const logout = async () => {
  session.clearAll();
  await router.replace("/login");
};
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
    <header class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
          <h1 class="mt-1 text-lg font-bold text-slate-900">管理端 / 教师端</h1>
        </div>
        <button
          v-if="!isLoginPage && (isTeacherLoggedIn || isAdminLoggedIn)"
          class="rounded bg-slate-100 px-3 py-2 text-xs text-slate-700"
          @click="logout"
        >
          退出登录
        </button>
      </div>

      <nav v-if="!isLoginPage" class="mt-3 flex flex-wrap gap-2 text-sm">
        <template v-if="isTeacherLoggedIn">
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/students">学生列表</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/class-overview">班级视图</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/dashboard">教师驾驶舱</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/teacher/activities">教师活动</RouterLink>
        </template>
        <template v-if="isAdminLoggedIn">
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/admin/org-teachers">组织与账号</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/admin/authorizations">授权中心</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/admin/activities-center">活动中心</RouterLink>
          <RouterLink class="rounded bg-slate-100 px-2 py-1" to="/admin/dashboard-cockpit">管理员驾驶舱</RouterLink>
        </template>
      </nav>
    </header>

    <RouterView />
  </main>
</template>
