import { HOUR } from "@std/datetime";

import { STATUS_CODE } from "@std/http";
import { getSignedUrl } from "aws_s3_presign";
import FilePreview from "../../snippets/FilePreview.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import {
  AWS_CREDENTIALS,
  AWS_REGION,
  INODES_BUCKET,
  S3_ACCELERATE_ENDPOINT,
} from "../../util/consts.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { getPathSegments } from "../../util/url.ts";

export default async function showFileHandler(ctx: AppContext) {
  const seg = getPathSegments(ctx.url.pathname);

  if (seg.isRootDir) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const dirNode = (await getDirByPath(seg.parentPathSegments)).value;

  if (!dirNode) {
    return <NotFoundPage />;
  }

  const fileNode =
    (await getInodeByDir<FileNode>(dirNode.id, seg.lastPathSegment!)).value;

  if (!fileNode) {
    return <NotFoundPage />;
  }

  const fileName = decodeURIComponent(fileNode.name);

  const fileUrl = getSignedUrl({
    region: AWS_REGION,
    bucket: INODES_BUCKET,
    accessKeyId: AWS_CREDENTIALS.accessKeyId,
    secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
    key: fileNode.s3Key,
    expiresIn: HOUR * 24 / 1000,
    endpoint: S3_ACCELERATE_ENDPOINT,
  });

  return (
    <Page
      title={fileName}
      header={{ breadcrumb: true }}
    >
      <h1>{fileName}</h1>

      <FilePreview
        inode={fileNode}
        url={fileUrl}
      />

      <p>
        <a href={fileUrl} target="_blank">Open file &#x2197;</a>
      </p>
    </Page>
  );
}
