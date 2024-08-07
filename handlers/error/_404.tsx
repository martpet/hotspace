import Page from "../../components/pages/Page.tsx";
import type { Context } from "../../utils/types.ts";

export default function error404Handler(ctx: Context) {
  if (!ctx.isHtmlRequest) {
    return new Response(null, { status: 404 });
  }

  ctx.respOpt.status = 404;

  const title = "Error 404: Page Not Found";

  return (
    <Page title={title}>
      <h1>{title}</h1>
    </Page>
  );
}
