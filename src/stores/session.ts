import { reactive } from "vue";

const STORAGE_KEY = "lesi_manager_session";

interface SessionState {
  teacherId: string;
}

const read = (): SessionState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { teacherId: "" };
  try {
    const parsed = JSON.parse(raw) as SessionState;
    return { teacherId: parsed.teacherId || "" };
  } catch {
    return { teacherId: "" };
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
  }
});
