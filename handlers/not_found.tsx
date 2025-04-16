import { accepts, STATUS_CODE } from "@std/http";
import NotFoundPage from "../components/pages/NotFoundPage.tsx";
import { type PageProps } from "../components/pages/Page.tsx";
import type { AppContext } from "../util/types.ts";

export default function notFoundHandler(
  ctx: AppContext,
  pageProps?: PageProps,
) {
  if (!accepts(ctx.req).includes("text/html")) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  return <NotFoundPage {...pageProps} />;
}
