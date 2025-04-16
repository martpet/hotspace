import { getPermissions, type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import ButtonToggleChat from "../../components/chat/ButtonToggleChat.tsx";
import Chat from "../../components/chat/ChatSection.tsx";
import ButtonDeleteInode from "../../components/inodes/ButtonDeleteInode.tsx";
import FilePreview from "../../components/inodes/file_preview/FilePreview.tsx";
import Page from "../../components/pages/Page.tsx";
import {
  getPreviewImageKey,
  getSignedFileUrl,
  isImageNode,
  showOriginalImageAsPreview,
} from "../../util/inodes/helpers.ts";
import { type FileNode } from "../../util/inodes/types.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import notFoundHandler from "../not_found.tsx";

type FragmentId = "chat";

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname) as NonRootPath;
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const notFound = () => notFoundHandler(ctx, { header: { breadcrumb: true } });

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const parentDir = (await getDirByPath(path.parentSegments, {
    consistency: "eventual",
  })).value;

  if (!parentDir) {
    return notFound();
  }

  const inode = (await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  })).value;

  const { canRead, canModerate, canModify } = getPermissions({
    user,
    resource: inode,
  });

  if (!inode || !canRead) {
    return notFound();
  }

  const chatSection = (
    <Chat
      enabled={inode.chatEnabled}
      chatId={inode.id}
      chatTitle={inode.name}
      canModerate={canModerate}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const fileName = decodeURIComponent(inode.name);
  const originalFileUrl = await getSignedFileUrl(inode.s3Key);

  const previewImageUrl = isImageNode(inode) &&
      (showOriginalImageAsPreview(inode) ||
        inode.postProcess.status === "COMPLETE")
    ? await getSignedFileUrl(getPreviewImageKey(inode))
    : null;

  const inodesMenu = (canModerate || canModify) && (
    <menu class="menu-bar">
      {canModify && <ButtonDeleteInode inode={inode} />}
      {canModerate && <ButtonToggleChat chat={inode} />}
    </menu>
  );

  const head = (
    <>
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  return (
    <Page
      id="file-page"
      title={fileName}
      head={head}
      header={{ breadcrumb: true }}
    >
      <FilePreview
        inode={inode}
        originalFileUrl={originalFileUrl}
        previewImageUrl={previewImageUrl}
      />
      <header class="inodes-header">
        <h1>{fileName}</h1>
        {inodesMenu}
      </header>
      <a href={originalFileUrl} target="_blank">Open File ↗</a>
      {chatSection}
    </Page>
  );
}
