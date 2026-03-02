import { requestJson } from "./http";
import type { TeacherStudentDetailResponse, TeacherStudentsResponse } from "../types/teacher";

interface TeacherStudentsFilters {
  classId?: number;
  majorId?: number;
  grade?: number;
  assessmentStatus?: "done" | "pending";
  reportStatus?: "generated" | "pending";
  page?: number;
  pageSize?: number;
}

const toQuery = (filters: TeacherStudentsFilters): string => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const teacherApi = {
  getStudents(teacherId: string, filters: TeacherStudentsFilters) {
    const query = toQuery(filters);
    return requestJson<TeacherStudentsResponse>(`/teacher/my-students${query ? `?${query}` : ""}`, {
      headers: {
        "x-teacher-id": teacherId
      }
    });
  },
  getStudentDetail(teacherId: string, studentId: number) {
    return requestJson<TeacherStudentDetailResponse>(`/teacher/students/${studentId}/detail`, {
      headers: {
        "x-teacher-id": teacherId
      }
    });
  }
};
