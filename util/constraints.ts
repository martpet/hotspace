import { type FormFieldConstraints, URL_SEGMENT_CONSTRAINTS } from "$util";

export const USERNAME_CONSTRAINTS = {
  minLength: 2,
  maxLength: 30,
  ...URL_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const INODE_NAME_CONSTRAINTS = {
  minLength: 1,
  maxLength: 100,
  ...URL_SEGMENT_CONSTRAINTS,
} satisfies FormFieldConstraints;

export const INODE_DESCRIPTION_CONSTRAINTS = {
  maxLength: 10000,
} satisfies FormFieldConstraints;
