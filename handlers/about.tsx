import About from "../components/About.tsx";
import Page from "../components/pages/Page.tsx";
import type { AppContext } from "../util/types.ts";

export default function aboutHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.redirect("/");
  }

  return (
    <Page title="About" header={{ siteNameIsLink: true }}>
      <About skipSubline />
    </Page>
  );
}
