const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestJsonOptions extends RequestInit {
  auth?: boolean;
  retryOnAuthFail?: boolean;
}

let accessToken: string | null = null;
let refreshAccessTokenHandler: (() => Promise<string | null>) | null = null;
let unauthorizedHandler: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token && token.trim().length > 0 ? token.trim() : null;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const configureAuthLifecycle = (input: {
  onRefreshAccessToken?: (() => Promise<string | null>) | null;
  onUnauthorized?: (() => void) | null;
}) => {
  refreshAccessTokenHandler = input.onRefreshAccessToken ?? null;
  unauthorizedHandler = input.onUnauthorized ?? null;
};

const parseJsonSafely = (text: string): unknown => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const runRefreshTokenFlow = async (): Promise<string | null> => {
  if (!refreshAccessTokenHandler) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenHandler()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

const buildHeaders = ({
  headers,
  auth,
  token
}: {
  headers: HeadersInit | undefined;
  auth: boolean;
  token: string | null;
}): Headers => {
  const resolved = new Headers(headers);

  if (auth && token) {
    resolved.set("authorization", `Bearer ${token}`);
  }

  return resolved;
};

export async function requestJson<T>(path: string, init: RequestJsonOptions = {}): Promise<T> {
  const { auth = true, retryOnAuthFail = true, headers, ...rest } = init;

  const doFetch = async (tokenForRequest: string | null) => {
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders({ headers, auth, token: tokenForRequest }),
      credentials: "include"
    });
  };

  let response = await doFetch(accessToken);

  if (response.status === 401 && auth && retryOnAuthFail) {
    const refreshedToken = await runRefreshTokenFlow();
    if (refreshedToken) {
      response = await doFetch(refreshedToken);
    }
  }

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      unauthorizedHandler?.();
    }

    const message =
      typeof payload === "object" && payload !== null && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `请求失败(${response.status})`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
