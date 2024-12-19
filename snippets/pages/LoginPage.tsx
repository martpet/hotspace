import ButtonLogin from "../auth/ButtonLogin.tsx";
import Page from "./Page.tsx";

export default function LoginPage() {
  return (
    <Page title="Log in">
      <h1>Log in to continue</h1>
      <ButtonLogin />
    </Page>
  );
}
