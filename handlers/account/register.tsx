import { asset } from "$server";
import RegForm from "../../snippets/auth/RegForm.tsx";
import Page from "../../snippets/pages/Page.tsx";
import type { AppContext } from "../../util/types.ts";

export default function registerHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (user) {
    return ctx.redirect("/");
  }

  const head = <script type="module" src={asset("reg.js")} />;

  return (
    <Page title="Register" head={head} skipReg>
      <h1>Register</h1>
      <RegForm />
    </Page>
  );
}
