import { FormFieldConstraints } from "./types.ts";

export const URL_SEGMENT_CONSTRAINTS = {
  pattern: "^[a-z0-9_\\-]+$",
  title:
    "No spaces, only lowercase letters (a-z), numbers (0-9), underscores (_), and hyphens (-).",
} satisfies FormFieldConstraints;
