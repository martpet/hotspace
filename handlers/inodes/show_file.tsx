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
import { getFileNodePreview } from "../../util/inodes/file_node_preview.ts";
import type { FileNode } from "../../util/inodes/types.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import type { AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";

type FragmentId = "chat";

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const path = parsePathname(ctx.url.pathname) as NonRootPath;

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const { value: dirNode } = await getDirByPath(path.parentSegments, {
    consistency: "eventual",
  });

  if (!dirNode) {
    return <NotFoundPage />;
  }

  const { value: inode } = await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: dirNode.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const perm = getPermissions({ user, resource: inode });

  if (!inode || !perm.canRead) {
    return <NotFoundPage />;
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
    return ctx.respondJsxFragment(chatSection);
  }

  const preview = await getFileNodePreview(inode);
  let importmap;

  if (preview?.display === "video") {
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
