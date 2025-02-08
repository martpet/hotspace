import { signCloudFrontUrl } from "$aws";
import { STATUS_CODE } from "@std/http";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/ChatSection.tsx";
import FilePreview from "../../snippets/FilePreview.tsx";
import ButtonDelete from "../../snippets/inodes/ButtonDelete.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import {
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_SIGNER_PRIVATE_KEY,
  INODES_CLOUDFRONT_URL,
} from "../../util/consts.ts";
import { getDir, getInode } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { parsePathname } from "../../util/url.ts";

const IS_PUBLIC_ACCESS_ENABLED = true;

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname);

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const parentDir = (await getDir(path.parentSegments, "eventual")).value;

  if (!parentDir) {
    return <NotFoundPage />;
  }

  const fragmentId = ctx.url.searchParams.get("fragment");

  const fileNode = (await getInode<FileNode>({
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

  return (
    <Page
      title={fileName}
      head={<meta name="robots" content="noindex, nofollow" />}
      header={{ breadcrumb: true }}
    >
      <h1>{fileName}</h1>

      {isOwner && (
        <menu class="inodes-menu">
          <ButtonToggleChat chatEnabled={fileNode.chatEnabled} />
          <ButtonDelete />
        </menu>
      )}

      <FilePreview
        inode={fileNode}
        url={fileUrl}
      />

      <p>
        <a href={fileUrl} target="_blank">Open File &#x2197;</a>
      </p>

      {chatSection}
    </Page>
  );
}
