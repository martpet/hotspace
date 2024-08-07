import { SITE_NAME } from "../utils/consts.ts";

export function docTitle(title: string) {
  return `<title>${SITE_NAME} - ${title}</title>`;
}
