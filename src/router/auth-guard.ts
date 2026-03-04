import type { SessionState } from "../stores/session";

export type AuthRole = "teacher" | "admin";

const LOGIN_PATH = "/login";
const TEACHER_HOME_PATH = "/teacher/students";
const ADMIN_HOME_PATH = "/admin/org-teachers";

interface AuthRouteSnapshot {
  path: string;
  fullPath: string;
  authRole?: AuthRole;
  loginRedirect?: string;
}

const isTeacherAuthenticated = (session: SessionState) => session.teacherId.trim().length > 0;
const isAdminAuthenticated = (session: SessionState) => session.adminKey.trim().length > 0;

const isTeacherPath = (path: string) => path.startsWith("/teacher/");
const isAdminPath = (path: string) => path.startsWith("/admin/");

const normalizePath = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
};

const hasPathAccess = (session: SessionState, path: string) => {
  if (isTeacherPath(path)) return isTeacherAuthenticated(session);
  if (isAdminPath(path)) return isAdminAuthenticated(session);
  return true;
};

const resolveLoggedInHomePath = (session: SessionState) => {
  if (isTeacherAuthenticated(session)) return TEACHER_HOME_PATH;
  if (isAdminAuthenticated(session)) return ADMIN_HOME_PATH;
  return null;
};

const buildLoginRedirect = (path: string) => `${LOGIN_PATH}?redirect=${encodeURIComponent(path)}`;

export const resolvePostLoginRedirect = (role: AuthRole, redirectPath: string | undefined) => {
  const normalized = normalizePath(redirectPath);
  if (normalized) {
    if (role === "teacher" && isTeacherPath(normalized)) return normalized;
    if (role === "admin" && isAdminPath(normalized)) return normalized;
  }

  return role === "teacher" ? TEACHER_HOME_PATH : ADMIN_HOME_PATH;
};

export const resolveAuthRedirect = (route: AuthRouteSnapshot, session: SessionState) => {
  if (route.path === LOGIN_PATH) {
    const normalized = normalizePath(route.loginRedirect);
    if (normalized && hasPathAccess(session, normalized)) return normalized;
    return resolveLoggedInHomePath(session) ?? true;
  }

  if (!route.authRole) return true;
  if (route.authRole === "teacher" && isTeacherAuthenticated(session)) return true;
  if (route.authRole === "admin" && isAdminAuthenticated(session)) return true;
  return buildLoginRedirect(route.fullPath);
};
