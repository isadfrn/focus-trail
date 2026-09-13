import { ApiError } from "../errors/api-error";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body != null ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    console.error(
      `[api] ${method} ${API_BASE}${path} network error (is the backend up?):`,
      err,
    );
    throw err;
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    const code =
      (body as { error?: string } | null)?.error ?? `http_${res.status}`;
    const line = `[api] ${method} ${API_BASE}${path} -> ${res.status}`;
    if (res.status >= 500) console.error(line, body ?? text);
    else console.warn(line, body ?? text);
    throw new ApiError(res.status, code);
  }
  return body as T;
}
