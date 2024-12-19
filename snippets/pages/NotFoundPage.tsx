import { STATUS_CODE } from "@std/http";
import type { AppContext } from "../../util/types.ts";
import Page from "./Page.tsx";

export default function NotFoundPage(_props: unknown, ctx: AppContext) {
  ctx.resp.status = STATUS_CODE.NotFound;

  return (
    <Page title="Error: Page Not Found">
      <h1>Page not found</h1>
    </Page>
  );
}
