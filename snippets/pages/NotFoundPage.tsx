import { STATUS_CODE } from "@std/http";
import type { AppContext } from "../../util/types.ts";
import HomeLink from "../HomeLink.tsx";
import Page from "./Page.tsx";

export default function NotFoundPage(_: unknown, ctx: AppContext) {
  ctx.respOpt.status = STATUS_CODE.NotFound;

  return (
    <Page title="Error: Page Not Found">
      <h1>Page not found</h1>
      <HomeLink />
    </Page>
  );
}
