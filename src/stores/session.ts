import { reactive } from "vue";
import { getPermissionsByRole } from "../constants/rbac";
import { authApi, type AuthTokenResult, type LoginByAccountInput } from "../services/auth";
import { configureAuthLifecycle, setAccessToken } from "../services/http";
import type { AuthRole, AuthUser, SessionUser } from "../types/auth";

interface SessionState {
  initialized: boolean;
  initializing: boolean;
  accessToken: string;
  user: SessionUser | null;
}

const state = reactive<SessionState>({
  initialized: false,
  initializing: false,
  accessToken: "",
  user: null
});

const toSessionUser = (user: AuthUser): SessionUser => ({
  ...user,
  permissions: getPermissionsByRole(user.role)
});

const clearSessionState = () => {
  state.accessToken = "";
  state.user = null;
  setAccessToken(null);
};

const applyAuthResult = (result: AuthTokenResult) => {
  const nextToken = result.accessToken.trim();
  state.accessToken = nextToken;
  state.user = toSessionUser(result.user);
  setAccessToken(nextToken);
};

const fetchCurrentUserInternal = async (): Promise<SessionUser | null> => {
  if (!state.accessToken) {
    state.user = null;
    return null;
  }

  const current = await authApi.me();
  state.user = toSessionUser(current);
  return state.user;
};

const refreshSession = async (): Promise<string | null> => {
  try {
    const refreshed = await authApi.refresh();
    applyAuthResult(refreshed);
    return refreshed.accessToken;
  } catch {
    clearSessionState();
    return null;
  }
};

configureAuthLifecycle({
  onRefreshAccessToken: refreshSession,
  onUnauthorized: () => {
    clearSessionState();
  }
});

export const getDefaultRouteByRole = (role: AuthRole): string => {
  if (role === "admin") {
    return "/admin/org-teachers";
  }

  if (role === "teacher") {
    return "/teacher/students";
  }

  return "/login";
};

export const useSessionStore = () => ({
  state,
  get isAuthenticated() {
    return Boolean(state.user && state.accessToken);
  },
  async initializeSession() {
    if (state.initialized || state.initializing) {
      return;
    }

    state.initializing = true;
    try {
      await refreshSession();

      if (state.accessToken) {
        await fetchCurrentUserInternal().catch(() => undefined);
      }
    } finally {
      state.initialized = true;
      state.initializing = false;
    }
  },
  async loginByAccount(input: LoginByAccountInput) {
    const result = await authApi.login({
      account: input.account.trim(),
      password: input.password
    });

    applyAuthResult(result);
    return state.user;
  },
  async fetchCurrentUser() {
    return fetchCurrentUserInternal();
  },
  async logout() {
    try {
      await authApi.logout();
    } finally {
      clearSessionState();
      state.initialized = true;
    }
  },
  hasRole(roles: AuthRole[]) {
    return Boolean(state.user && roles.includes(state.user.role));
  },
  hasPermission(permission: string) {
    return Boolean(state.user && state.user.permissions.includes(permission));
  },
  hasPermissions(permissions: string[]) {
    if (!state.user) {
      return false;
    }

    return permissions.every((permission) => state.user!.permissions.includes(permission));
  }
});
