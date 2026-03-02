import { createRouter, createWebHistory } from "vue-router";
import TeacherStudentsPage from "../pages/TeacherStudentsPage.vue";
import TeacherStudentDetailPage from "../pages/TeacherStudentDetailPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/teacher/students" },
    { path: "/teacher/students", component: TeacherStudentsPage },
    { path: "/teacher/class-overview", component: () => import("../pages/TeacherClassOverviewPage.vue") },
    { path: "/teacher/students/:studentId", component: TeacherStudentDetailPage },
    { path: "/teacher/dashboard", component: () => import("../pages/TeacherDashboardPage.vue") },
    { path: "/admin/org-teachers", component: () => import("../pages/AdminOrgTeacherPage.vue") },
    { path: "/admin/authorizations", component: () => import("../pages/AdminAuthorizationPage.vue") }
  ]
});

export default router;
