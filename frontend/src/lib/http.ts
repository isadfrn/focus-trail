import { ApiError } from "../errors/api-error";

/**
 * Base da API. Em dev, o default "/api" é atendido pelo proxy do Vite.
 * Em produção o app roda sob /focus/, então o build injeta
 * VITE_API_BASE="/focus/api" (ver deploy.yml).
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/**
 * Thin fetch wrapper for the API backend — the transport layer (analogous to
 * the backend's Prisma client). Sends cookies, JSON-encodes bodies, and turns
 * non-2xx responses into an {@link ApiError}. Data-access modules in `api/`
 * build on this; nothing else should call `fetch` directly.
 */
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
      `[api] ${method} ${API_BASE}${path} falhou na rede (backend no ar?):`,
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
