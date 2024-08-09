import type { ComponentChildren } from "preact";
import type { Context } from "../../utils/types.ts";
import Page from "./Page.tsx";

interface UserSpaceProps {
  children: ComponentChildren;
}

export default function UserSpace({ children }: UserSpaceProps, ctx: Context) {
  const metaNoIndex = <meta name="robots" content="noindex" />;

  return (
    <Page head={metaNoIndex} baseUrl={ctx.rootDomain}>
      <h1>Hi</h1>
      {children}
    </Page>
  );
}
