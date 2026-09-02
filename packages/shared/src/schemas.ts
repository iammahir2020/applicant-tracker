import { z } from 'zod';

import { validationErrorFromZod, type ValidationError } from './errors.ts';
import { err, ok, type Result } from './result.ts';

/**
 * Branded ids. `ApplicationId` and `CompanyId` are both strings at runtime, but
 * the brand makes them incompatible at compile time, so passing one where the
 * other is expected is an error rather than a silent bug.
 *
 * zod brands the *output* only: a plain string goes in, a branded id comes out.
 * That means parsing is the only way to obtain one.
 */
export const ApplicationIdSchema = z.uuid().brand<'ApplicationId'>();
export type ApplicationId = z.infer<typeof ApplicationIdSchema>;

export const CompanyIdSchema = z.uuid().brand<'CompanyId'>();
export type CompanyId = z.infer<typeof CompanyIdSchema>;

/**
 * `as const` matters: without it TypeScript widens this to `string[]` and the
 * enum's inferred type degrades to `string`, which defeats the point.
 *
 * Step 10 builds a state machine over these and Step 22 renders them as columns,
 * so changing them later is not free.
 */
export const STAGES = [
  'WISHLIST',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
] as const;

export const StageSchema = z.enum(STAGES);
export type Stage = z.infer<typeof StageSchema>;

/**
 * Timestamps stay ISO strings rather than becoming Dates.
 *
 * They cross HTTP and GraphQL boundaries as strings anyway, and `z.coerce.date()`
 * would make the schema's input and output types diverge — the caller passes a
 * string but gets a Date — which is a real cost for no gain at this layer.
 * Convert to Date at the render edge if a screen needs it.
 */
export const ApplicationSchema = z.object({
  id: ApplicationIdSchema,
  companyId: CompanyIdSchema,
  role: z.string().min(1).max(200),
  stage: StageSchema,
  source: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Application = z.infer<typeof ApplicationSchema>;

/**
 * What a client may send when creating one. Derived from the full schema rather
 * than written again, so a new field can only be added in one place.
 * Server-owned fields — the id and both timestamps — are not the client's to set.
 */
export const CreateApplicationSchema = ApplicationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateApplication = z.infer<typeof CreateApplicationSchema>;

/**
 * The boundary. Input is `unknown` because that is the truth about anything
 * arriving from a network, a database or the environment: TypeScript's types are
 * erased at runtime, so a cast here would be a claim, not a check.
 *
 * Translating zod's `{ success }` union into our `Result` is not redundant — it
 * keeps zod's types out of every downstream signature, so the resilience layer
 * and the resolvers handle one failure shape rather than two.
 */
export function parseApplication(input: unknown): Result<Application, ValidationError> {
  const parsed = ApplicationSchema.safeParse(input);
  return parsed.success ? ok(parsed.data) : err(validationErrorFromZod(parsed.error));
}

export function parseCreateApplication(input: unknown): Result<CreateApplication, ValidationError> {
  const parsed = CreateApplicationSchema.safeParse(input);
  return parsed.success ? ok(parsed.data) : err(validationErrorFromZod(parsed.error));
}
