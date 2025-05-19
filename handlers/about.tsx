import AboutPage from "../components/pages/AboutPage.tsx";
import type { AppContext } from "../util/types.ts";

export default function aboutHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.redirect("/");
  }

  return (
    <AboutPage
      title="About"
      header={{ siteNameIsLink: true }}
    />
  );
}
