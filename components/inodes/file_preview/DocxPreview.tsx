import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";

interface Props {
  fileUrl: string;
}

export default function DocxPreview(props: Props, ctx: AppContext) {
  const { fileUrl } = props;
  const src = asset("inodes/docx_iframe.html");
  const isExternalAsset = URL.canParse(src);
  const url = new URL(src, isExternalAsset ? undefined : ctx.url.origin);

  const searchParams = new URLSearchParams({
    fileUrl: fileUrl,
    jszipPath: asset("vendored/jszip.min.js"),
    docxPreviewPath: asset("vendored/docx-preview.min.js"),
  });

  url.search = searchParams.toString();

  return (
    <>
      <link
        rel="preload"
        href={asset("vendored/jszip.min.js")}
        as="script"
      />
      <link
        rel="preload"
        href={asset("vendored/docx-preview.min.js")}
        as="script"
      />
      <iframe id="docx-iframe" src={url.href} />
    </>
  );
}
