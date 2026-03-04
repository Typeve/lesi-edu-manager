<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "./stores/session";

interface NavItem {
  to: string;
  label: string;
}

const router = useRouter();
const session = useSessionStore();

const user = computed(() => session.state.user);

const navItems = computed<NavItem[]>(() => {
  if (!user.value) {
    return [];
  }

  if (user.value.role === "teacher") {
    return [
      { to: "/teacher/students", label: "学生列表" },
      { to: "/teacher/class-overview", label: "班级视图" },
      { to: "/teacher/dashboard", label: "教师驾驶舱" },
      { to: "/teacher/activities", label: "教师活动" }
    ].filter((item) => {
      if (item.to === "/teacher/students" || item.to === "/teacher/class-overview" || item.to === "/teacher/dashboard") {
        return session.hasPermission("teacher.students.read");
      }

      if (item.to === "/teacher/activities") {
        return session.hasPermission("teacher.activity.execute");
      }

      return true;
    });
  }

  if (user.value.role === "admin") {
    return [
      { to: "/admin/org-teachers", label: "组织与账号" },
      { to: "/admin/authorizations", label: "授权中心" },
      { to: "/admin/activities-center", label: "活动中心" },
      { to: "/admin/dashboard-cockpit", label: "管理员驾驶舱" }
    ].filter((item) => {
      if (item.to === "/admin/org-teachers") {
        return session.hasPermission("admin.org.manage");
      }

      if (item.to === "/admin/authorizations") {
        return session.hasPermission("admin.authorization.manage");
      }

      if (item.to === "/admin/activities-center") {
        return session.hasPermission("admin.activity.publish");
      }

      if (item.to === "/admin/dashboard-cockpit") {
        return session.hasPermission("admin.dashboard.read");
      }

      return true;
    });
  }

  return [];
});

const handleLogout = async () => {
  await session.logout();
  await router.replace("/login");
};
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
    <header v-if="session.state.initialized && user" class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
          <h1 class="mt-1 text-lg font-bold text-slate-900">管理端 / 教师端</h1>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span>{{ user.displayName }}（{{ user.role }}）</span>
          <button class="rounded bg-slate-100 px-2 py-1 text-xs" @click="handleLogout">退出</button>
        </div>
      </div>

      <nav class="mt-3 flex flex-wrap gap-2 text-sm">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="rounded bg-slate-100 px-2 py-1"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <p v-if="!session.state.initialized" class="mt-16 text-center text-sm text-slate-500">正在恢复登录态...</p>
    <RouterView v-else />
  </main>
</template>
