import { STATUS_CODE } from "@std/http";
import type { AppContext } from "../../util/types.ts";
import Page, { type PageProps } from "./Page.tsx";

export default function NotFoundPage(props: PageProps, ctx: AppContext) {
  ctx.resp.status = STATUS_CODE.NotFound;

  return (
    <Page
      title="Error: Page not found"
      header={{ siteNameIsLink: true }}
      {...props}
    >
      <h1>Page not found</h1>
    </Page>
  );
}
