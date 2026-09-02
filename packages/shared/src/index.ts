/**
 * The public surface of @tracker/shared. Everything else in this package is
 * internal — a shared package that exports everything is one that can never
 * change anything.
 */
export { err, ok, unwrapOr } from './result.ts';
export type { Result } from './result.ts';

export { validationErrorFromZod } from './errors.ts';
export type { FieldIssue, ValidationError } from './errors.ts';

export {
  ApplicationIdSchema,
  ApplicationSchema,
  CompanyIdSchema,
  CreateApplicationSchema,
  STAGES,
  StageSchema,
  parseApplication,
  parseCreateApplication,
} from './schemas.ts';
export type { Application, ApplicationId, CompanyId, CreateApplication, Stage } from './schemas.ts';
