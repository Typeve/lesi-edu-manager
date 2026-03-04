import type { AuthRole } from "../types/auth";

export const ROLE_PERMISSIONS: Record<AuthRole, string[]> = {
  student: [
    "student.profile.read",
    "student.assessment.submit",
    "report.read",
    "task.read",
    "task.checkin.submit",
    "certificate.upload"
  ],
  teacher: [
    "teacher.students.read",
    "teacher.student.detail.read",
    "teacher.activity.execute",
    "report.read",
    "task.read",
    "student.profile.read"
  ],
  admin: [
    "admin.org.manage",
    "admin.teacher.manage",
    "admin.authorization.manage",
    "admin.activity.publish",
    "admin.dashboard.read"
  ]
};

export const getPermissionsByRole = (role: AuthRole): string[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};

export const hasPermissionByRole = (role: AuthRole, permission: string): boolean => {
  return getPermissionsByRole(role).includes(permission);
};
