import RegForm from "../../components/auth/RegForm.tsx";
import Page from "../../components/pages/Page.tsx";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

export default function registerHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (user) {
    return ctx.redirect("/");
  }

  const head = <script type="module" src={asset("reg.js")} />;

  return (
    <Page
      title="Register"
      head={head}
      header={{ siteNameIsLink: true, skipLogin: true, skipReg: true }}
    >
      <h1>Register</h1>
      <RegForm />
    </Page>
  );
}
