import { LogoutButton } from "../components/LogoutButton.tsx";
import Page from "../components/pages/Page.tsx";
import RegForm from "../components/RegForm.tsx";
import type { Context } from "../utils/types.ts";

export default function homeHandler(ctx: Context) {
  const { user } = ctx.state;

  return (
    <Page>
      {user ? <LogoutButton /> : <RegForm />}
    </Page>
  );
}
