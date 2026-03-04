export type AuthRole = "student" | "teacher" | "admin";

export interface AuthScope {
  schoolId?: number;
  collegeId?: number;
  majorId?: number;
  classId?: number;
}

export interface AuthUser {
  userId: string;
  role: AuthRole;
  account: string;
  displayName: string;
  teacherId?: string;
  studentId?: number;
  studentNo?: string;
  mustChangePassword?: boolean;
  scope?: AuthScope;
}

export interface SessionUser extends AuthUser {
  permissions: string[];
}
