/**
 * A success-or-failure outcome, returned as a value instead of thrown.
 *
 * Use this for *expected* failures — validation, a 404 from upstream, an open
 * circuit breaker. Keep `throw` for *unexpected* ones: bugs, bad config, OOM.
 * Putting every failure in a Result reinvents checked exceptions.
 */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/**
 * `Result<T, never>` — not `Result<T, E>` — so callers never have to name the
 * error type. `never` is assignable to everything, so `ok(x)` slots into a
 * `Result<T, AnyError>` position without an annotation.
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Collapse a Result to a plain value. The fallback path in Step 20 wants this. */
export function unwrapOr<T>(result: Result<T, unknown>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
