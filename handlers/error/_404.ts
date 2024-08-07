import { page } from "../../layouts/page.ts";
import type { Context } from "../../utils/types.ts";

export default page((ctx: Context) => {
  if (!ctx.isHtmlRequest) {
    return new Response(null, { status: 404 });
  }

  return `
    <h1>Error 404: Page Not Found</h1>
  `;
});
