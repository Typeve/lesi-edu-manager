<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

interface NavItem {
  path: string;
  label: string;
}

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

const isPublicRoute = computed(() => route.meta.requiresAuth === false);
const activeLabel = computed(() => navItems.find((item) => item.path === activePath.value)?.label ?? "工作台");

</script>

<template>
  <a v-if="!isPublicRoute" href="#main-content" class="skip-link">跳转到主内容</a>
  <RouterView v-if="isPublicRoute" />

  <el-container v-else class="app-layout">
    <el-aside width="240px" class="app-layout__aside">
      <div class="app-layout__brand">
        <p class="app-layout__brand-subtitle">LESI EDU MANAGER</p>
        <h1 class="app-layout__brand-title">管理端 / 教师端</h1>
      </div>
      <el-scrollbar class="app-layout__menu-scroll">
        <nav aria-label="主导航" class="app-layout__nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="app-layout__nav-link"
            :class="{ 'is-active': activePath === item.path }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="app-layout__header">
        <h2 class="app-layout__header-title">{{ activeLabel }}</h2>
      </el-header>
      <el-main id="main-content" tabindex="-1" class="app-layout__main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.skip-link {
  position: absolute;
  left: 16px;
  top: -48px;
  z-index: 1000;
  border-radius: 8px;
  background-color: var(--el-color-primary);
  color: #fff;
  padding: 8px 12px;
  text-decoration: none;
}

.skip-link:focus-visible {
  top: 12px;
}

.app-layout {
  min-height: 100vh;
}

.app-layout__aside {
  border-right: 1px solid var(--el-border-color-light);
  background-color: #fff;
}

.app-layout__brand {
  padding: 20px 16px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.app-layout__brand-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  letter-spacing: 0.1em;
}

.app-layout__brand-title {
  margin: 6px 0 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.app-layout__menu-scroll {
  height: calc(100vh - 86px);
}

.app-layout__nav {
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 2px;
}

.app-layout__nav-link {
  border-radius: 8px;
  color: var(--el-text-color-primary);
  text-decoration: none;
  padding: 10px 12px;
  line-height: 20px;
}

.app-layout__nav-link:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.app-layout__nav-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.app-layout__nav-link.is-active {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  font-weight: 600;
}

.app-layout__header {
  display: flex;
  align-items: center;
  height: 56px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: #fff;
}

.app-layout__header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.app-layout__main {
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
}

@media (max-width: 991px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout__aside {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .app-layout__menu-scroll {
    height: auto;
    max-height: 260px;
  }
}
</style>
