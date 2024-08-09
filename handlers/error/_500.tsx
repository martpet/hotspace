import Page from "../../components/pages/Page.tsx";
import type { Context } from "../../utils/types.ts";

export default function error500Handler(ctx: Context) {
  if (!ctx.isHtmlRequest) {
    return new Response(null, { status: 500 });
  }

  const title = "Error 500: Server Error";
  const { error, isDev } = ctx;

  ctx.respInit.status = 500;

  return (
    <Page title={title} baseUrl={ctx.rootDomain}>
      <h1>{title}</h1>
      {isDev && error instanceof Error && <pre>{error.message}</pre>}
    </Page>
  );
}
