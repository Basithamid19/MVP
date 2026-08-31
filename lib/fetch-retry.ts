/**
 * Transient-failure tolerance for client-side GETs.
 *
 * Why this exists: for the first minute or two after a deploy every serverless
 * lambda is cold. A cold invocation pays Prisma engine start + a fresh pooled
 * connection before it even runs the route's own queries, so the very first
 * request from a page can 500 or time out. Pages that flipped into an error
 * state on the FIRST failed fetch therefore showed "Couldn't load…" banners for
 * as long as it took the next 15s poll to succeed — which reads as minutes of
 * breakage for something that self-heals in seconds.
 *
 * Retries are for READS ONLY. Never route a POST/PATCH/DELETE through this —
 * a retried mutation is a double submit.
 */

/** Default backoff schedule; index N is the wait before attempt N+1. */
const DEFAULT_BACKOFF_MS = [600, 1800];

/** A non-2xx HTTP response. `status` lets callers tell 404 from 503. */
export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, url: string, body?: unknown) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}

/**
 * True when the failure is a definitive answer from the server rather than a
 * cold-start / connectivity blip: any 4xx. Callers use this to decide whether
 * an error is worth showing the user immediately (403/404 → yes, the resource
 * really isn't there) or should stay silent.
 */
export function isDefinitiveError(e: unknown): boolean {
  return isHttpError(e) && e.status >= 400 && e.status < 500;
}

function isAbort(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  );
}

function abortError(): Error {
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return; }
    const onAbort = () => { clearTimeout(id); reject(abortError()); };
    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export type FetchJsonWithRetryOptions = {
  /** Extra attempts after the first. Default 2 → up to 3 requests total. */
  retries?: number;
  /** Wait before each retry. Last entry repeats if retries exceeds its length. */
  backoffMs?: number[];
  signal?: AbortSignal;
};

/**
 * GET `url` and parse the JSON body, retrying only on failures that a retry can
 * plausibly fix:
 *
 *  - the fetch itself rejected (offline, connection reset, lambda cold-start
 *    timeout), or
 *  - the response was 5xx, or
 *  - the body wasn't parseable JSON (truncated response).
 *
 * A 4xx is NEVER retried — 401/403/404 are the server's final answer. Those
 * throw an `HttpError` on the first attempt so callers can react at once.
 * Aborts propagate immediately without consuming a retry.
 *
 * Throws (HttpError or the underlying network error) once attempts run out.
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: FetchJsonWithRetryOptions = {},
): Promise<T> {
  const { retries = 2, backoffMs = DEFAULT_BACKOFF_MS, signal } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const wait = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 0;
      await sleep(wait, signal);
    }

    try {
      const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const err = new HttpError(res.status, url, body);
        // 4xx is definitive; stop immediately.
        if (res.status < 500) throw err;
        lastError = err;
        continue;
      }

      return (await res.json()) as T;
    } catch (err) {
      if (isAbort(err)) throw err;
      if (isDefinitiveError(err)) throw err;
      lastError = err;
    }
  }

  throw lastError ?? new Error(`Request failed: ${url}`);
}

/**
 * `fetchJsonWithRetry` that resolves to `fallback` instead of throwing. For the
 * many call sites whose only failure handling is "leave the list empty".
 */
export async function fetchJsonOr<T>(
  url: string,
  fallback: T,
  options: FetchJsonWithRetryOptions = {},
): Promise<T> {
  try {
    return await fetchJsonWithRetry<T>(url, options);
  } catch {
    return fallback;
  }
}
