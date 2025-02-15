import { signCloudFrontUrl } from "$aws";
import { STATUS_CODE } from "@std/http";
import { asset } from "../../lib/server/util/asset_path.ts";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/ChatSection.tsx";
import FilePreview from "../../snippets/FilePreview.tsx";
import ButtonDeleteFile from "../../snippets/inodes/ButtonDeleteFile.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import {
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
  INODES_CLOUDFRONT_URL,
} from "../../util/consts.ts";
import { getDirNode, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { parsePath } from "../../util/url.ts";

const IS_PUBLIC_ACCESS_ENABLED = true;

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePath(ctx.url.pathname);

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const parentDir = (await getDirNode(path.parentSegments, "eventual")).value;

  if (!parentDir) {
    return <NotFoundPage header={{ breadcrumb: true }} />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment");

  const fileNode = (await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: fragmentId ? "strong" : "eventual",
  })).value;

  if (!fileNode) {
    return <NotFoundPage />;
  }

  const isOwner = fileNode.ownerId === user?.id;

  const chatSection = (
    <Chat
      enabled={fileNode.chatEnabled}
      chatId={fileNode.id}
      parentDirId={parentDir.id}
      chatTitle={fileNode.name}
      isAdmin={isOwner}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const fileName = decodeURIComponent(fileNode.name);
  let fileUrl = `${INODES_CLOUDFRONT_URL}/${fileNode.s3Key}`;

  if (!IS_PUBLIC_ACCESS_ENABLED) {
    fileUrl = await signCloudFrontUrl({
      url: fileUrl,
      keyPairId: CLOUDFRONT_KEYPAIR_ID,
      privateKey: CLOUDFRONT_SIGNER_PRIVATE_KEY,
    });
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
    </>
  );

  return (
    <Page
      id="file-page"
      title={fileName}
      head={head}
      header={{ breadcrumb: true }}
    >
      <h1>{fileName}</h1>

      {isOwner && (
        <menu class="inodes-menu">
          <ButtonToggleChat chatEnabled={fileNode.chatEnabled} />
          <ButtonDeleteFile fileName={fileName} />
        </menu>
      )}
      <FilePreview
        inode={fileNode}
        url={fileUrl}
      />
      <p>
        <a href={fileUrl} target="_blank">Open File ↗</a>
      </p>
      {chatSection}
    </Page>
  );
}
