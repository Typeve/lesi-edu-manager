import { createRouter, createWebHistory } from "vue-router";
import TeacherStudentsPage from "../pages/TeacherStudentsPage.vue";
import TeacherStudentDetailPage from "../pages/TeacherStudentDetailPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/teacher/students" },
    { path: "/teacher/students", component: TeacherStudentsPage },
    { path: "/teacher/students/:studentId", component: TeacherStudentDetailPage }
  ]
});

export default router;
