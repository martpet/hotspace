import { DAY } from "@std/datetime/constants";
import { HEADER } from "@std/http/unstable-header";
import About from "../components/About.tsx";
import Page from "../components/pages/Page.tsx";
import type { AppContext } from "../util/types.ts";

export default function aboutHandler(ctx: AppContext) {
  const { user } = ctx.state;

  ctx.resp.headers.set(
    HEADER.CacheControl,
    `Cache-Control: public, max-age=${DAY / 1000}`,
  );

  if (!user) {
    return ctx.redirect("/");
  }

  return (
    <Page title="About" header={{ siteNameIsLink: true }}>
      <About noName noSubline />
    </Page>
  );
}
