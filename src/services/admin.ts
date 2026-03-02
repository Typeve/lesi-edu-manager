import { requestJson } from "./http";

export const adminApi = {
  createCollege(adminKey: string, payload: { schoolId: number; name: string }) {
    return requestJson<{ collegeId: number }>("/admin/org/colleges", {
      method: "POST",
      headers: {
        "x-admin-key": adminKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  updateCollege(adminKey: string, collegeId: number, payload: { name: string }) {
    return requestJson<{ message: string }>(`/admin/org/colleges/${collegeId}`, {
      method: "PATCH",
      headers: {
        "x-admin-key": adminKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  deleteCollege(adminKey: string, collegeId: number) {
    return requestJson<{ message: string }>(`/admin/org/colleges/${collegeId}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": adminKey
      }
    });
  },
  createTeacher(adminKey: string, payload: { name: string; account: string; password: string; status: "active" | "frozen" }) {
    return requestJson<{ teacherId: string }>("/admin/teachers", {
      method: "POST",
      headers: {
        "x-admin-key": adminKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  updateTeacherStatus(adminKey: string, teacherId: string, status: "active" | "frozen") {
    return requestJson<{ message: string }>(`/admin/teachers/${teacherId}/status`, {
      method: "PATCH",
      headers: {
        "x-admin-key": adminKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ status })
    });
  },
  resetTeacherPassword(adminKey: string, teacherId: string, newPassword: string) {
    return requestJson<{ message: string }>(`/admin/teachers/${teacherId}/reset-password`, {
      method: "POST",
      headers: {
        "x-admin-key": adminKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ newPassword })
    });
  }
};
