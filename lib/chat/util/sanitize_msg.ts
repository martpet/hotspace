import { collapseLineBreaks } from "$util";

export default function sanitizeChatMsgText(text: string) {
  return collapseLineBreaks(text, 2).trim();
}
