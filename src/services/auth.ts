import type { AuthUser } from "../types/auth";
import { requestJson } from "./http";

export interface LoginByAccountInput {
  account: string;
  password: string;
}

export interface AuthTokenResult {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export const authApi = {
  login(input: LoginByAccountInput) {
    return requestJson<AuthTokenResult>("/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(input),
      auth: false,
      retryOnAuthFail: false
    });
  },
  refresh() {
    return requestJson<AuthTokenResult>("/auth/refresh", {
      method: "POST",
      auth: false,
      retryOnAuthFail: false
    });
  },
  logout() {
    return requestJson<{ message: string }>("/auth/logout", {
      method: "POST",
      auth: false,
      retryOnAuthFail: false
    });
  },
  me() {
    return requestJson<AuthUser>("/auth/me", {
      method: "GET"
    });
  }
};
