<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

interface NavItem {
  path: string;
  label: string;
}

const router = useRouter();
const route = useRoute();

const navItems: readonly NavItem[] = [
  { path: "/teacher/students", label: "学生列表" },
  { path: "/teacher/class-overview", label: "班级视图" },
  { path: "/teacher/dashboard", label: "教师驾驶舱" },
  { path: "/teacher/activities", label: "教师活动" },
  { path: "/admin/org-teachers", label: "组织与账号" },
  { path: "/admin/authorizations", label: "授权中心" },
  { path: "/admin/activities-center", label: "活动中心" },
  { path: "/admin/dashboard-cockpit", label: "管理员驾驶舱" }
];

const activePath = computed(() => {
  if (route.path.startsWith("/teacher/students/")) {
    return "/teacher/students";
  }
  return route.path;
});

const onSelect = (path: string) => {
  router.push(path);
};
</script>

<template>
  <el-container class="mx-auto min-h-screen max-w-[1280px] px-4 py-6 md:px-6">
    <el-header class="!h-auto rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">LESI EDU MANAGER</p>
      <h1 class="mt-1 text-lg font-bold text-slate-900">管理端 / 教师端</h1>
      <el-menu :default-active="activePath" mode="horizontal" class="mt-3 rounded-xl border border-slate-100" @select="onSelect">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">{{ item.label }}</el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="px-0 pt-5">
      <RouterView />
    </el-main>
  </el-container>
</template>
