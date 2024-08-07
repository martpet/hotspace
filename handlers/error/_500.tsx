import Page from "../../components/pages/Page.tsx";
import type { Context } from "../../utils/types.ts";

export default function error500Handler(ctx: Context) {
  const { isHtmlRequest, isDev, error } = ctx;

  if (!isHtmlRequest) {
    return new Response(null, { status: 500 });
  }

  ctx.respOpt.status = 500;

  const title = "Error 500: Server Error";

  return (
    <Page title={title}>
      <h1>{title}</h1>
      {isDev && <pre>{error}</pre>}
    </Page>
  );
}
