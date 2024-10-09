import type { FormFieldConstraints } from "./types.ts";

const URL_SEGMENT_CONSTRAINTS = {
  pattern: "^[a-z0-9_\\-]+$",
  title:
    "No spaces, only lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
};

export const USERNAME_CONSTRAINTS = {
  minLength: 3,
  maxLength: 30,
  ...URL_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const SPACE_NAME_CONSTRAINTS = {
  minLength: 3,
  maxLength: 100,
  ...URL_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const SPACE_DESCRIPTION_CONSTRAINTS = {
  maxLength: 1000,
} satisfies FormFieldConstraints;

export const CHAT_MESSAGE_CONTRAINTS = {
  maxLength: 1000,
  pattern: "[^\\n\\r]{1,}", // excludes line breaks
  title: "At least one character is required.",
} satisfies FormFieldConstraints;
