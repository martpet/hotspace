import { type FormFieldConstraints } from "$util";

export const USERNAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 30,
  pattern: "^(?!.*[._\\-]{2})(?![._\\-])[A-Za-z0-9._\\-]+(?<![._\\-])$",
  title:
    "Letters, numbers, dots, underscores, and hyphens. No special characters at the start, end, or repeated",
} satisfies FormFieldConstraints;

export const DIR_NAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 100,
  pattern: "^[A-Za-z0-9\\-._~]+$",
  title: "Letters, numbers, dots, underscores, hyphens, and tildes",
} satisfies FormFieldConstraints;

export const DIR_DESCRIPTION_CONSTRAINTS = {
  maxLength: 10000,
} satisfies FormFieldConstraints;
