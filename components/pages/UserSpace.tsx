import type { ComponentChildren } from "preact";
import { findBaseUrl } from "../../utils/url.ts";
import Page from "./Page.tsx";

interface UserSpaceProps {
  children: ComponentChildren;
  url: URL;
}

export default function UserSpace({ url }: UserSpaceProps) {
  const head = <meta name="robots" content="noindex" />;
  const baseUrl = findBaseUrl(url);

  return (
    <Page head={head} baseUrl={baseUrl}>
      <h1>To do</h1>
    </Page>
  );
}
