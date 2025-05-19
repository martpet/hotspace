import {
  getPermissions,
  type NonRootPath,
  parsePathname,
  segmentsToPathname,
} from "$util";
import { STATUS_CODE } from "@std/http";
import Chat from "../../components/chat/ChatSection.tsx";
import FilePreview from "../../components/inodes/file_preview/FilePreview.tsx";
import NotFoundPage from "../../components/pages/NotFoundPage.tsx";
import Page from "../../components/pages/Page.tsx";
import { getPreviewInfo } from "../../util/inodes/inode_preview_info.ts";
import type { FileNode } from "../../util/inodes/types.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

type FragmentId = "chat";

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const path = parsePathname(ctx.url.pathname) as NonRootPath;
  const notFound = () => <NotFoundPage />;

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const { value: dirNode } = await getDirByPath(path.parentSegments, {
    consistency: "eventual",
  });

  if (!dirNode) {
    return notFound();
  }

  const { value: inode } = await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: dirNode.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const perm = getPermissions({ user, resource: inode });

  if (!inode || !perm.canRead) {
    return notFound();
  }

  const canonicalPathname = segmentsToPathname(
    dirNode.pathSegments.concat(inode.name),
  );

  if (canonicalPathname !== ctx.url.pathname) {
    return ctx.redirect(canonicalPathname);
  }

  const chatSection = (
    <Chat
      enabled={inode.chatEnabled}
      chatId={inode.id}
      chatTitle={inode.name}
      perm={perm}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const preview = await getPreviewInfo(inode);
  let importmap;

  if (preview.displayType === "video") {
    importmap = {
      "$hls": asset("vendored/hls.mjs"),
      "$listenPostProcessing": asset("inodes/listen_post_processing.js"),
    };
  }

  const head = (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="stylesheet" href={asset("inodes/inodes.css")} />
      <link rel="stylesheet" href={asset("chat/chat.css")} />
    </>
  );

  return (
    <Page
      id="file-page"
      title={decodeURIComponent(inode.name)}
      importmap={importmap}
      head={head}
      header={{ breadcrumb: true }}
    >
      <FilePreview
        inode={inode}
        preview={preview}
        perm={perm}
      />
      {chatSection}
    </Page>
  );
}
