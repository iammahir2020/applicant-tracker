import type { z } from 'zod';

/** One failed field. `path` is dotted so it reads the same in a log line and an HTTP body. */
export type FieldIssue = {
  readonly path: string;
  readonly message: string;
};

/**
 * Our validation failure, deliberately not zod's.
 *
 * Mapping costs a few lines but keeps zod out of this package's public API:
 * consumers depend on a shape we control, and swapping validators later is a
 * change to one function rather than to every caller. `code` is a literal so
 * this can join a discriminated union of domain errors in Step 8.
 */
export type ValidationError = {
  readonly code: 'VALIDATION_ERROR';
  readonly message: string;
  readonly issues: readonly FieldIssue[];
};

export function validationErrorFromZod(error: z.ZodError): ValidationError {
  const issues = error.issues.map((issue) => ({
    // path entries are PropertyKey, and a symbol would throw in join().
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));

  return {
    code: 'VALIDATION_ERROR',
    message: issues.length === 1 ? 'Invalid field' : `Invalid fields (${String(issues.length)})`,
    issues,
  };
}
