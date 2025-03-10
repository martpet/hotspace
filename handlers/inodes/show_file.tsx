import { type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/ChatSection.tsx";
import ButtonDeleteInode from "../../snippets/inodes/ButtonDeleteInode.tsx";
import FilePreview from "../../snippets/inodes/file_preview/FilePreview.tsx";
import NotFoundPage from "../../snippets/pages/NotFoundPage.tsx";
import Page from "../../snippets/pages/Page.tsx";
import PopMenu from "../../snippets/PopMenu.tsx";
import { INODES_CLOUDFRONT_URL } from "../../util/consts.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
import { asset, signUploadUrl } from "../../util/url.ts";

type FragmentId = "chat";

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const path = parsePathname(ctx.url.pathname) as NonRootPath;
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const IS_PUBLIC_ACCESS_ENABLED = true;

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const parentDir = (await getDirByPath(path.parentSegments, {
    consistency: "eventual",
  })).value;

  if (!parentDir) {
    return <NotFoundPage header={{ breadcrumb: true }} />;
  }

  const fileNode = (await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  })).value;

  if (!fileNode) {
    return <NotFoundPage header={{ breadcrumb: true }} />;
  }

  const isOwner = fileNode.ownerId === user?.id;

  const chatSection = (
    <Chat
      enabled={fileNode.chatEnabled}
      chatId={fileNode.id}
      chatTitle={fileNode.name}
      isAdmin={isOwner}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const fileName = decodeURIComponent(fileNode.name);
  let fileNodeUrl = `${INODES_CLOUDFRONT_URL}/${fileNode.s3Key}`;

  if (!IS_PUBLIC_ACCESS_ENABLED) {
    fileNodeUrl = await signUploadUrl(fileNodeUrl);
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  const menu = (
    <menu class="menu-bar">
      <PopMenu id="manage-menu" btnLabel="Manage File">
        <ButtonToggleChat
          inodeId={fileNode.id}
          chatEnabled={fileNode.chatEnabled}
          skipHidePopoverId="manage-menu"
        />
        <ButtonDeleteInode inode={fileNode}>
          Delete File
        </ButtonDeleteInode>
      </PopMenu>
    </menu>
  );

  return (
    <Page
      id="file-page"
      title={fileName}
      head={head}
      header={{ breadcrumb: true }}
    >
      <h1>{fileName}</h1>

      {isOwner && menu}
      <FilePreview fileNode={fileNode} fileNodeUrl={fileNodeUrl} />
      {chatSection}
    </Page>
  );
}
