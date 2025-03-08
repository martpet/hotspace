import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";

interface Props {
  fileNodeUrl: string;
}

export default function DocxPreview(props: Props, ctx: AppContext) {
  const { fileNodeUrl } = props;

  const src = asset("docx/iframe.html");
  const url = new URL(src, URL.canParse(src) ? undefined : ctx.url.origin);
  url.searchParams.set("fileNodeUrl", fileNodeUrl);
  url.searchParams.set("jszipPath", asset("docx/jszip.min.js"));
  url.searchParams.set("docxPreviewPath", asset("docx/docx-preview.min.js"));

  return <iframe id="docx-iframe" src={url.href} />;
}
