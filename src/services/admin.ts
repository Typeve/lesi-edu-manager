import { requestJson } from "./http";

export type GrantType = "class" | "student";
export type AccessLevel = "read" | "manage";

export interface AuthorizationGrantPayload {
  grantType: GrantType;
  teacherId: string;
  targetId: number;
  accessLevel?: AccessLevel;
}

export type ActivityType = "course" | "competition" | "project";
export type ActivityScopeType = "school" | "college" | "class";

export interface ActivityTimelineNode {
  key: string;
  at: string;
}

export interface PublishActivityPayload {
  activityType: ActivityType;
  title: string;
  scopeType: ActivityScopeType;
  scopeTargetId: number;
  ownerTeacherId: string;
  startAt: string;
  endAt: string;
  timelineNodes: ActivityTimelineNode[];
}

export interface ActivityItem extends PublishActivityPayload {
  activityId: number;
  status: "draft" | "published" | "closed";
}

export type DashboardDimension = "college" | "major" | "class";

export interface DashboardCockpitFilters {
  dimension: DashboardDimension;
  schoolId?: number;
  collegeId?: number;
  majorId?: number;
  classId?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardCockpitResponse {
  dictionaryVersion: string;
  filters: Record<string, number | string | undefined>;
  overview: {
    activatedStudentsCount: number;
    assessmentCompletionRate: number;
    reportGenerationRate: number;
    taskCompletionRate: number;
    activityParticipationRate: number;
  };
  byDimension: {
    dimension: DashboardDimension;
    barChart: {
      categories: string[];
      series: Array<{ code: string; name: string; values: number[] }>;
    };
    stackedBarChart: {
      categories: string[];
      series: Array<{ direction: string; values: number[] }>;
    };
  };
  trendFunnel: {
    dateRange: { startDate: string; endDate: string };
    trend: Array<{
      date: string;
      activatedStudentsCount: number;
      assessmentCompletedStudentsCount: number;
      reportGeneratedStudentsCount: number;
      taskCompletedStudentsCount: number;
      activityParticipatedStudentsCount: number;
    }>;
    funnel: Array<{
      stageCode: string;
      stageName: string;
      count: number;
      conversionRate: number;
    }>;
  };
}

const toQuery = (filters: DashboardCockpitFilters): string => {
  const query = new URLSearchParams();
  query.set("dimension", filters.dimension);

  ([
    "schoolId",
    "collegeId",
    "majorId",
    "classId",
    "startDate",
    "endDate"
  ] as const).forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

export const adminApi = {
  createCollege(payload: { schoolId: number; name: string }) {
    return requestJson<{ collegeId: number }>("/admin/org/colleges", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  updateCollege(collegeId: number, payload: { name: string }) {
    return requestJson<{ message: string }>(`/admin/org/colleges/${collegeId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  deleteCollege(collegeId: number) {
    return requestJson<{ message: string }>(`/admin/org/colleges/${collegeId}`, {
      method: "DELETE"
    });
  },
  createTeacher(payload: { name: string; account: string; password: string; status: "active" | "frozen" }) {
    return requestJson<{ teacherId: string }>("/admin/teachers", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  updateTeacherStatus(teacherId: string, status: "active" | "frozen") {
    return requestJson<{ message: string }>(`/admin/teachers/${teacherId}/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ status })
    });
  },
  resetTeacherPassword(teacherId: string, newPassword: string) {
    return requestJson<{ message: string }>(`/admin/teachers/${teacherId}/reset-password`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ newPassword })
    });
  },
  assignGrant(payload: AuthorizationGrantPayload) {
    return requestJson<{ message: string }>("/admin/authorizations/grants", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  revokeGrant(payload: AuthorizationGrantPayload) {
    return requestJson<{ message: string }>("/admin/authorizations/grants", {
      method: "DELETE",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  assignGrantBatch(grants: AuthorizationGrantPayload[]) {
    return requestJson<{ message: string; count: number }>("/admin/authorizations/grants/batch", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ grants })
    });
  },
  revokeGrantBatch(grants: AuthorizationGrantPayload[]) {
    return requestJson<{ message: string; count: number }>("/admin/authorizations/grants/batch", {
      method: "DELETE",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ grants })
    });
  },
  publishActivity(payload: PublishActivityPayload) {
    return requestJson<{ message: string }>("/admin/activities", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  },
  listActivities() {
    return requestJson<{ items: ActivityItem[] }>("/admin/activities");
  },
  getDashboardCockpit(filters: DashboardCockpitFilters) {
    const query = toQuery(filters);
    return requestJson<DashboardCockpitResponse>(`/admin/dashboard/cockpit?${query}`);
  }
};
