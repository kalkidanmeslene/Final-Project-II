import type { ApiResponse } from "@/lib/http/api-response";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function fetchApi(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
}

async function tryRefreshSession(): Promise<boolean> {
  const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  return res.ok;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res = await fetchApi(url, init);

  const bodyReplayable =
    init?.body === undefined || typeof init.body === "string" || init.body instanceof URLSearchParams;

  if (
    res.status === 401 &&
    bodyReplayable &&
    !url.includes("/api/auth/refresh") &&
    !url.includes("/api/auth/login")
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await fetchApi(url, init);
    }
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.ok) {
    throw new ApiClientError(json.error.message, json.error.code, res.status, json.error.fieldErrors);
  }

  return json.data;
}
