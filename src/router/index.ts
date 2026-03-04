import { createRouter, createWebHistory } from "vue-router";
import type { AuthRole } from "./auth-guard";
import { resolveAuthRedirect } from "./auth-guard";
import LoginPage from "../pages/LoginPage.vue";
import TeacherStudentsPage from "../pages/TeacherStudentsPage.vue";
import TeacherStudentDetailPage from "../pages/TeacherStudentDetailPage.vue";
import { useSessionStore } from "../stores/session";

const teacherAuthMeta = { authRole: "teacher" as AuthRole };
const adminAuthMeta = { authRole: "admin" as AuthRole };

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", component: LoginPage },
    { path: "/teacher/students", component: TeacherStudentsPage, meta: teacherAuthMeta },
    { path: "/teacher/class-overview", component: () => import("../pages/TeacherClassOverviewPage.vue"), meta: teacherAuthMeta },
    { path: "/teacher/students/:studentId", component: TeacherStudentDetailPage, meta: teacherAuthMeta },
    { path: "/teacher/dashboard", component: () => import("../pages/TeacherDashboardPage.vue"), meta: teacherAuthMeta },
    { path: "/teacher/activities", component: () => import("../pages/TeacherActivitiesPage.vue"), meta: teacherAuthMeta },
    { path: "/admin/org-teachers", component: () => import("../pages/AdminOrgTeacherPage.vue"), meta: adminAuthMeta },
    { path: "/admin/authorizations", component: () => import("../pages/AdminAuthorizationPage.vue"), meta: adminAuthMeta },
    { path: "/admin/activities-center", component: () => import("../pages/AdminActivityCenterPage.vue"), meta: adminAuthMeta },
    { path: "/admin/dashboard-cockpit", component: () => import("../pages/AdminDashboardPage.vue"), meta: adminAuthMeta }
  ]
});

router.beforeEach((to) => {
  const session = useSessionStore();
  const loginRedirect = typeof to.query.redirect === "string" ? to.query.redirect : undefined;

  return resolveAuthRedirect(
    {
      path: to.path,
      fullPath: to.fullPath,
      authRole: to.meta.authRole as AuthRole | undefined,
      loginRedirect
    },
    session.state
  );
});

export default router;
