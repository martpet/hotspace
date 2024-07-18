export default function htmlTemplateBuilder(content: string) {
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        <link href="/static/main.css" rel="stylesheet" />
        <link rel="icon" href="/static/favicon.ico" />
      </head>
      ${content}
    </html>
  `;
}
