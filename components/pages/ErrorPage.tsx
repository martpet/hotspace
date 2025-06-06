import { IS_LOCAL_DEV } from "../../util/consts.ts";
import Page from "./Page.tsx";

interface Props {
  error: unknown;
}

export default function ErrorPage({ error }: Props) {
  return (
    <Page title="Internal Server Error">
      <h1 class="alert error">Oops, something went wrong</h1>
      {IS_LOCAL_DEV && error instanceof Error && (
        <pre class="basic-pre">{error.stack}</pre>
      )}
    </Page>
  );
}
