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
  const title = "Create an Account";

  return (
    <Page
      title={title}
      head={head}
      header={{ siteNameIsLink: true, skipLogin: true, skipReg: true }}
    >
      <div class="prose">
        <h1>{title}</h1>

        <p>
          <strong>No email or password required</strong>
          <br />
          You’ll sign in using your device — with Face ID, fingerprint, or your
          computer password.
        </p>
        <RegForm />
      </div>
    </Page>
  );
}
