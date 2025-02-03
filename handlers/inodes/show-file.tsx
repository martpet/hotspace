import { signCloudFrontUrl } from "$aws";
import { STATUS_CODE } from "@std/http";
import FilePreview from "../../snippets/FilePreview.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import {
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
  INODES_CLOUDFRONT_URL,
} from "../../util/consts.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { getPathSegments } from "../../util/url.ts";

export default async function showFileHandler(ctx: AppContext) {
  const { isRootDir, parentPathSegments, lastPathSegment } = getPathSegments(
    ctx.url.pathname,
  );

  if (isRootDir) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const dirNode = (await getDirByPath(parentPathSegments, "eventual")).value;

  if (!dirNode) {
    return <NotFoundPage />;
  }

  const fileNode = (await getInodeByDir<FileNode>(
    dirNode.id,
    lastPathSegment!,
    "eventual",
  )).value;

  if (!fileNode) {
    return <NotFoundPage />;
  }

  const url = await signCloudFrontUrl({
    url: `${INODES_CLOUDFRONT_URL}/${fileNode.s3Key}`,
    keyPairId: CLOUDFRONT_KEYPAIR_ID,
    privateKey: CLOUDFRONT_SIGNER_PRIVATE_KEY,
  });

  const fileName = decodeURIComponent(fileNode.name);

  return (
    <Page
      title={fileName}
      header={{ breadcrumb: true }}
      head={<meta name="robots" content="noindex, nofollow" />}
    >
      <h1>{fileName}</h1>

      <FilePreview
        inode={fileNode}
        url={url}
      />

      <p>
        <a href={url} target="_blank">Open file &#x2197;</a>
      </p>
    </Page>
  );
}
