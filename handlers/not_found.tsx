import { accepts, STATUS_CODE } from "@std/http";
import NotFoundPage from "../components/pages/NotFoundPage.tsx";
import type { AppContext } from "../util/types.ts";

export default function notFoundHandler(ctx: AppContext) {
  if (accepts(ctx.req).includes("text/html")) {
    return <NotFoundPage />;
  }
  return ctx.respond(null, STATUS_CODE.NotFound);
}
