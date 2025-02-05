import { signCloudFrontUrl } from "$aws";
import { asset } from "$server";
import { STATUS_CODE } from "@std/http";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import ChatSection from "../../snippets/chat/ChatSection.tsx";
import FilePreview from "../../snippets/FilePreview.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import {
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
  INODES_CLOUDFRONT_URL,
} from "../../util/consts.ts";
import { getDir, getInode } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

const IS_PUBLIC_ACCESS_ENABLED = true;

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePath(ctx.url.pathname);

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const parentDir = (await getDir(path.parentSegments, "eventual")).value;

  if (!parentDir) {
    return <NotFoundPage />;
  }

  const fileNode = (await getInode<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: "eventual",
  })).value;

  if (!fileNode) {
    return <NotFoundPage />;
  }

  let fileUrl = `${INODES_CLOUDFRONT_URL}/${fileNode.s3Key}`;

  if (!IS_PUBLIC_ACCESS_ENABLED) {
    fileUrl = await signCloudFrontUrl({
      url: fileUrl,
      keyPairId: CLOUDFRONT_KEYPAIR_ID,
      privateKey: CLOUDFRONT_SIGNER_PRIVATE_KEY,
    });
  }

  const fileName = decodeURIComponent(fileNode.name);
  const isOwner = fileNode.ownerId === user?.id;

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {fileNode.chatEnabled && (
        <link rel="stylesheet" href={asset("chat/chat.css")} />
      )}
    </>
  );

  return (
    <Page
      title={fileName}
      header={{ breadcrumb: true }}
      head={head}
    >
      <h1>{fileName}</h1>

      {isOwner && (
        <menu class="inodes-menu">
          <ButtonToggleChat inode={fileNode} />
        </menu>
      )}

      <FilePreview
        inode={fileNode}
        url={fileUrl}
      />

      <p>
        <a href={fileUrl} target="_blank">Open file &#x2197;</a>
      </p>

      {fileNode.chatEnabled && (
        <ChatSection
          chatId={fileNode.id}
          parentDirId={parentDir.id}
          chatTitle={fileNode.name}
          isAdmin={isOwner}
        />
      )}
    </Page>
  );
}
