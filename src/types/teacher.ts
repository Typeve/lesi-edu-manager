export interface TeacherStudentItem {
  studentId: number;
  studentNo: string;
  name: string;
  classId: number;
  className: string;
  majorId: number | null;
  majorName: string | null;
  grade: number | null;
  assessmentDone: boolean;
  reportGenerated: boolean;
}

export interface TeacherStudentsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: TeacherStudentItem[];
}

export interface TeacherStudentDetailResponse {
  studentId: number;
  studentNo: string;
  name: string;
  classId: number;
  profile: {
    id: number | null;
    createdAt: string | null;
  };
  assessment: {
    done: boolean;
    submittedAt: string | null;
    answerCount: number | null;
  };
  reports: Array<{
    reportId: number;
    direction: string;
    createdAt: string;
  }>;
  tasks: {
    total: number;
    completed: number;
    latestSubmittedAt: string | null;
  };
  certificates: {
    total: number;
    latestUploadedAt: string | null;
  };
}
