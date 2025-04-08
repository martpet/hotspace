import ButtonLogin from "../auth/ButtonLogin.tsx";
import Page from "./Page.tsx";

interface Props {
  title?: string;
}

export default function LoginPage(props: Props) {
  return (
    <Page title={props.title || "Log in"} header={{ siteNameIsHeading: true }}>
      <h2>Log in to continue</h2>
      <ButtonLogin />
    </Page>
  );
}
