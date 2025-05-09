import { type FormFieldConstraints } from "$util";

const URL_PATH_SEGMENT_CONSTRAINTS = {
  pattern: "^[A-Za-z0-9\\-._~]+$",
  title:
    "Only letters (A–Z, a–z), numbers (0–9), underscores (_), hyphens (-), tildes (~), and dots (.) — no spaces.",
} satisfies FormFieldConstraints;

export const USERNAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 30,
  ...URL_PATH_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const DIR_NAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 100,
  ...URL_PATH_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const DIR_DESCRIPTION_CONSTRAINTS = {
  maxLength: 10000,
} satisfies FormFieldConstraints;
