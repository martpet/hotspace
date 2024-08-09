import type { ComponentChildren, JSX } from "preact";
import { SITE_NAME } from "../../utils/consts.ts";

interface PageProps {
  children: ComponentChildren;
  head?: JSX.Element;
  title?: string;
  baseUrl?: URL;
}

export default function Page(props: PageProps) {
  const { children, head, title, baseUrl } = props;

  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        {baseUrl && <base href={baseUrl.href} />}
        <link href="/static/main.css" rel="stylesheet" />
        <link rel="icon" href="/static/favicon.ico" />
        {title && <title>${SITE_NAME} - {title}</title>}
        {head}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
