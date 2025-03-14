import { type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import Chat from "../../snippets/chat/ChatSection.tsx";
import { ButtonManage } from "../../snippets/inodes/ButtonManage.tsx";
import FilePreview from "../../snippets/inodes/file_preview/FilePreview.tsx";
import Page from "../../snippets/pages/Page.tsx";
import { getFileNodeUrl } from "../../util/inodes/helpers.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext, FileNode } from "../../util/types.ts";
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

  if (!fileNode) {
    return notFound();
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
  const fileNodeUrl = await getFileNodeUrl(fileNode.s3Key);

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  const menu = (
    <menu class="menu-bar">
      <ButtonManage inode={fileNode} />
    </menu>
  );

  return (
    <Page
      id="file-page"
      title={fileName}
      head={head}
      header={{ breadcrumb: true }}
    >
      <header>
        <h1>{fileName}</h1>
        {isOwner && menu}
      </header>
      <FilePreview fileNode={fileNode} fileNodeUrl={fileNodeUrl} />
      {chatSection}
    </Page>
  );
}
