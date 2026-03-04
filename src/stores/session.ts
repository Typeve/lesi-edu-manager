import { reactive } from "vue";

const STORAGE_KEY = "lesi_manager_session";

export interface SessionState {
  teacherId: string;
  adminKey: string;
}

const read = (): SessionState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { teacherId: "", adminKey: "" };

  try {
    const parsed = JSON.parse(raw) as SessionState;
    return {
      teacherId: parsed.teacherId || "",
      adminKey: parsed.adminKey || ""
    };
  } catch {
    return { teacherId: "", adminKey: "" };
  }
};

const state = reactive<SessionState>(read());

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const useSessionStore = () => ({
  state,
  setTeacherId(value: string) {
    state.teacherId = value.trim();
    persist();
  },
  setAdminKey(value: string) {
    state.adminKey = value.trim();
    persist();
  },
  clearTeacherId() {
    state.teacherId = "";
    persist();
  },
  clearAdminKey() {
    state.adminKey = "";
    persist();
  },
  clearAll() {
    state.teacherId = "";
    state.adminKey = "";
    persist();
  }
});
