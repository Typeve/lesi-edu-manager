import { describe, expect, it } from "vitest";
import { resolveAuthRedirect, resolvePostLoginRedirect } from "./auth-guard";

const emptySession = { teacherId: "", adminKey: "" };
const teacherSession = { teacherId: "T-1001", adminKey: "" };
const adminSession = { teacherId: "", adminKey: "ADMIN-KEY" };

describe("resolveAuthRedirect", () => {
  it("未登录访问教师路由时跳转登录页", () => {
    const result = resolveAuthRedirect(
      {
        path: "/teacher/students",
        fullPath: "/teacher/students?page=2",
        authRole: "teacher"
      },
      emptySession
    );

    expect(result).toBe("/login?redirect=%2Fteacher%2Fstudents%3Fpage%3D2");
  });

  it("已登录教师访问教师路由时放行", () => {
    const result = resolveAuthRedirect(
      {
        path: "/teacher/students",
        fullPath: "/teacher/students",
        authRole: "teacher"
      },
      teacherSession
    );

    expect(result).toBe(true);
  });

  it("已登录管理员访问登录页时回到管理员首页", () => {
    const result = resolveAuthRedirect(
      {
        path: "/login",
        fullPath: "/login"
      },
      adminSession
    );

    expect(result).toBe("/admin/org-teachers");
  });

  it("登录页携带非法回跳地址时忽略并走默认首页", () => {
    const result = resolveAuthRedirect(
      {
        path: "/login",
        fullPath: "/login",
        loginRedirect: "https://example.com/evil"
      },
      teacherSession
    );

    expect(result).toBe("/teacher/students");
  });
});

describe("resolvePostLoginRedirect", () => {
  it("教师登录后只允许回跳教师路由", () => {
    const result = resolvePostLoginRedirect("teacher", "/admin/org-teachers");
    expect(result).toBe("/teacher/students");
  });

  it("管理员登录后允许回跳管理员路由", () => {
    const result = resolvePostLoginRedirect("admin", "/admin/authorizations");
    expect(result).toBe("/admin/authorizations");
  });
});
