/**
 * Upper bound for one server call during sync. A request that never settles (e.g. the app was frozen
 * in the background mid-request) would otherwise keep a sync pass running forever, and every later
 * change would sit in the outbox until the app restarts. Apply it with rxjs `timeout(...)`.
 */
export const SYNC_REQUEST_TIMEOUT_MS = 30_000;

/** Short, loggable description: HttpErrorResponse carries status/url, other errors just a message. */
export function describeError(e: unknown): string {
  const err = e as { status?: number; url?: string; message?: string } | undefined;
  return err?.status !== undefined ? `HTTP ${err.status} ${err.url ?? ''}`.trim() : String(err?.message ?? e);
}
