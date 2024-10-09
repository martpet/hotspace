import type { ComponentChildren, JSX } from "preact";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import Flash from "../Flash.tsx";

interface Props {
  children: ComponentChildren;
  head?: JSX.Element;
  title?: string;
}

export default function Page(props: Props, ctx: AppContext) {
  const { children, head, title } = props;
  const { flash } = ctx;

  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self'"
        />
        <link rel="icon" href={asset("favicon.ico")} />
        <link rel="stylesheet" href={asset("main.css")} />
        <script type="module" src={asset("main.mjs")} />
        {head}
        <title>Hotspace{title && ` — ${title}`}</title>
      </head>
      <body>
        {flash && <Flash type={flash.type}>{flash.msg}</Flash>}
        {children}
      </body>
    </html>
  );
}
