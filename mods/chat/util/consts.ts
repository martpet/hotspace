import { FormFieldConstraints } from "$util";
import { MINUTE } from "@std/datetime";

export const MESSAGES_PER_FETCH = 50;
export const CHAT_MSG_FOLLOWUP_DURATION = MINUTE * 2;

export const CHAT_MESSAGE_CONTRAINTS = {
  maxLength: 10000,
  pattern: "[^\\n\\r]{1,}", // excludes line breaks
  title: "At least one character is required.",
} satisfies FormFieldConstraints;
