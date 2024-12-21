import { asset } from "$server";
import type { ComponentChildren, JSX } from "preact";
import type { AppContext } from "../../util/types.ts";
import Flash from "../Flash.tsx";
import PageHeader, { type PageHeaderProps } from "../PageHeader.tsx";

const importmap = {
  "imports": {
    "$main": asset("main.js"),
    "$db": asset("db.js"),
  },
};

interface Props extends PageHeaderProps {
  children?: ComponentChildren;
  head?: JSX.Element;
  title?: string;
}

export default function Page(props: Props, ctx: AppContext) {
  const { flash, userAgent } = ctx;
  const { children, head, title, ...pageHeaderProps } = props;

  return (
    <html
      data-device-type={userAgent.device.type}
      data-os-name={userAgent.os.name}
      data-browser-name={userAgent.browser.name}
      data-can-user-service-worker={ctx.state.canUseServiceWorker ? "1" : ""}
    >
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <title>HotSpace{title && ` — ${title}`}</title>
        <script
          type="importmap"
          nonce={ctx.scpNonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(importmap) }}
        />
        <script type="module" src={asset("main.js")} />
        <link rel="icon" href={asset("favicon.ico")} />
        <link rel="apple-touch-icon" href={asset("img/logo.png")} />
        <link rel="manifest" href={asset("manifest.json")} />
        <link rel="stylesheet" href={asset("main.css")} />
        {head}
      </head>
      <body>
        <PageHeader {...pageHeaderProps} />
        {flash && <Flash type={flash.type}>{flash.msg}</Flash>}
        {children}
      </body>
    </html>
  );
}
