import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Pulse is an internal NRS tool, so only Nigeria Revenue Service work
 * addresses may create an account — e.g. `john.lewis@nrs.gov.ng`.
 *
 * Deliberately enforced on sign-up and password-reset only, NOT on sign-in:
 * the profiles seeded before this rule existed must keep working. If a
 * non-NRS account ever does need access, an admin creates it directly
 * rather than this validator being loosened.
 */
export const NRS_EMAIL_DOMAIN = 'nrs.gov.ng';

export const NRS_EMAIL_MESSAGE =
  'Use your NRS work email (e.g. john.lewis@nrs.gov.ng). Other email domains cannot be used to create a Pulse account.';

/** Local part: letters/digits with single dots, hyphens or underscores between them. */
const NRS_EMAIL_PATTERN = new RegExp(
  `^[a-z0-9]+(?:[._-][a-z0-9]+)*@${NRS_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`,
);

export function isNrsEmail(value: unknown): boolean {
  return typeof value === 'string' && NRS_EMAIL_PATTERN.test(value.trim().toLowerCase());
}

/** Normalises for storage/lookup — Supabase treats emails case-insensitively. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function IsNrsEmail(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isNrsEmail',
      target: target.constructor,
      propertyName: propertyName as string,
      options: { message: NRS_EMAIL_MESSAGE, ...options },
      validator: {
        validate: (value: unknown): boolean => isNrsEmail(value),
      },
    });
  };
}
