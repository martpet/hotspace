import { type FormFieldConstraints } from "$util";

const URL_DIR_SEGMENT_CONSTRAINTS = {
  pattern: "^[a-z0-9_\\-~]+$",
  title:
    "No spaces, only lowercase letters (a-z), numbers (0-9), underscores (_), hyphens (-), and tildes (~).",
} satisfies FormFieldConstraints;

export const USERNAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 30,
  ...URL_DIR_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const DIR_NAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 100,
  ...URL_DIR_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const DIR_DESCRIPTION_CONSTRAINTS = {
  maxLength: 10000,
} satisfies FormFieldConstraints;
