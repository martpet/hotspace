import type { ComponentChildren, JSX } from "preact";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import Flash from "../Flash.tsx";
import PageHeader, { type PageHeaderProps } from "../PageHeader.tsx";

export interface PageProps extends JSX.HTMLAttributes<HTMLBodyElement> {
  children?: ComponentChildren;
  head?: JSX.Element;
  title?: string;
  header?: PageHeaderProps;
  importmap?: Record<string, string>;
}

export default function Page(props: PageProps, ctx: AppContext) {
  const { flash, userAgent } = ctx;
  const {
    children,
    head,
    title,
    header: headerProps = {},
    ...bodyProps
  } = props;

  const importmap = {
    "imports": {
      "$main": asset("main.js"),
      "$db": asset("db.js"),
      ...props.importmap,
    },
  };

  return (
    <html
      data-device-type={userAgent.device.type}
      data-os-name={userAgent.os.name}
      data-browser-name={userAgent.browser.name}
      data-can-use-service-worker={ctx.state.canUseServiceWorker ? "1" : ""}
      data-service-worker-path={asset("service_worker.js", { cdn: false })}
      data-user-username={ctx.state.user?.username || null}
    >
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <meta name="robots" content="noindex, nofollow" />
        <title>HotSpace{title && ` — ${title}`}</title>
        <script
          type="importmap"
          nonce={ctx.scpNonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(importmap) }}
        />
        <script type="module" src={asset("main.js")} />
        <link rel="icon" href={asset("favicon.ico")} />
        <link rel="apple-touch-icon" href={asset("img/logo.png")} />
        <link rel="stylesheet" href={asset("main.css")} />
        {ctx.userAgent.os.name === "iOS" && (
          <link rel="manifest" href={asset("manifest.json")} />
        )}
        {head}
      </head>
      <body {...bodyProps}>
        <PageHeader {...headerProps} />
        {flash && (
          <Flash type={flash.type}>
            {flash.msg}
          </Flash>
        )}
        {children}
      </body>
    </html>
  );
}
