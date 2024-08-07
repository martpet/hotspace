import { page } from "../../layouts/page.ts";
import type { Context } from "../../utils/types.ts";

export default page((ctx: Context) => {
  const { isHtmlRequest, isDev, error } = ctx;

  if (!isHtmlRequest) {
    return new Response(null, { status: 500 });
  }

  return `
    <h1>Server Error</h1>
    ${isDev && `<pre>${error}</pre>`}
  `;
});
