import { createRouter, createWebHistory } from "vue-router";
import TeacherStudentsPage from "../pages/TeacherStudentsPage.vue";
import TeacherStudentDetailPage from "../pages/TeacherStudentDetailPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import ForbiddenPage from "../pages/ForbiddenPage.vue";
import { getDefaultRouteByRole, useSessionStore } from "../stores/session";
import type { AuthRole } from "../types/auth";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: AuthRole[];
    permissions?: string[];
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: () => {
        const session = useSessionStore();
        return session.state.user ? getDefaultRouteByRole(session.state.user.role) : "/login";
      }
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: {
        requiresAuth: false,
        guestOnly: true
      }
    },
    {
      path: "/forbidden",
      name: "forbidden",
      component: ForbiddenPage,
      meta: {
        roles: ["teacher", "admin"]
      }
    },
    {
      path: "/teacher/students",
      component: TeacherStudentsPage,
      meta: {
        roles: ["teacher"],
        permissions: ["teacher.students.read"]
      }
    },
    {
      path: "/teacher/class-overview",
      component: () => import("../pages/TeacherClassOverviewPage.vue"),
      meta: {
        roles: ["teacher"],
        permissions: ["teacher.students.read"]
      }
    },
    {
      path: "/teacher/students/:studentId",
      component: TeacherStudentDetailPage,
      meta: {
        roles: ["teacher"],
        permissions: ["teacher.student.detail.read"]
      }
    },
    {
      path: "/teacher/dashboard",
      component: () => import("../pages/TeacherDashboardPage.vue"),
      meta: {
        roles: ["teacher"],
        permissions: ["teacher.students.read"]
      }
    },
    {
      path: "/teacher/activities",
      component: () => import("../pages/TeacherActivitiesPage.vue"),
      meta: {
        roles: ["teacher"],
        permissions: ["teacher.activity.execute"]
      }
    },
    {
      path: "/admin/org-teachers",
      component: () => import("../pages/AdminOrgTeacherPage.vue"),
      meta: {
        roles: ["admin"],
        permissions: ["admin.org.manage"]
      }
    },
    {
      path: "/admin/authorizations",
      component: () => import("../pages/AdminAuthorizationPage.vue"),
      meta: {
        roles: ["admin"],
        permissions: ["admin.authorization.manage"]
      }
    },
    {
      path: "/admin/activities-center",
      component: () => import("../pages/AdminActivityCenterPage.vue"),
      meta: {
        roles: ["admin"],
        permissions: ["admin.activity.publish"]
      }
    },
    {
      path: "/admin/dashboard-cockpit",
      component: () => import("../pages/AdminDashboardPage.vue"),
      meta: {
        roles: ["admin"],
        permissions: ["admin.dashboard.read"]
      }
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/"
    }
  ]
});

router.beforeEach(async (to) => {
  const session = useSessionStore();

  if (!session.state.initialized) {
    await session.initializeSession();
  }

  if (to.meta.guestOnly && session.isAuthenticated) {
    return getDefaultRouteByRole(session.state.user!.role);
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  if (!requiresAuth) {
    return true;
  }

  if (!session.isAuthenticated) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (to.meta.roles && !session.hasRole(to.meta.roles)) {
    return "/forbidden";
  }

  if (to.meta.permissions && !session.hasPermissions(to.meta.permissions)) {
    return "/forbidden";
  }

  return true;
});

export default router;
