import { getPermissions, type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import ButtonToggleChat from "../../snippets/chat/ButtonToggleChat.tsx";
import Chat from "../../snippets/chat/ChatSection.tsx";
import ButtonDeleteInode from "../../snippets/inodes/ButtonDeleteInode.tsx";
import FilePreview from "../../snippets/inodes/file_preview/FilePreview.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getFileNodeUrl } from "../../util/inodes/helpers.ts";
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

  const fileNode = (await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  })).value;

  const { canRead, canModerate, canModify } = getPermissions({
    user,
    resource: fileNode,
  });

  if (!fileNode || !canRead) {
    return notFound();
  }

  const chatSection = (
    <Chat
      enabled={fileNode.chatEnabled}
      chatId={fileNode.id}
      chatTitle={fileNode.name}
      canModerate={canModerate}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const fileName = decodeURIComponent(fileNode.name);
  const fileNodeUrl = await getFileNodeUrl(fileNode.s3Key);

  const head = (
    <>
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  const showMenu = canModerate || canModify;

  const inodesMenu = showMenu && (
    <menu class="menu-bar">
      {canModerate && <ButtonToggleChat chat={fileNode} />}
      {canModify && <ButtonDeleteInode inode={fileNode} />}
    </menu>
  );

  return (
    <Page
      id="file-page"
      title={fileName}
      head={head}
      header={{ breadcrumb: true }}
    >
      <FilePreview
        fileNode={fileNode}
        fileNodeUrl={fileNodeUrl}
      />
      <header class="inodes-header">
        <h1>{fileName}</h1>
        {inodesMenu}
      </header>
      <a href={fileNodeUrl} target="_blank">Open File ↗</a>
      {chatSection}
    </Page>
  );
}
