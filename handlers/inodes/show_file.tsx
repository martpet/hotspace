import { getPermissions, type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import Chat from "../../components/chat/ChatSection.tsx";
import IframePreview from "../../components/inodes/file_node/IframePreview.tsx";
import ImagePreview from "../../components/inodes/file_node/ImagePreview.tsx";
import NoPreview from "../../components/inodes/file_node/NoPreview.tsx";
import VideoPreview from "../../components/inodes/file_node/VideoPreview.tsx";
import Page from "../../components/pages/Page.tsx";
import { getFileNodeDisplayType } from "../../util/inodes/helpers.ts";
import { getPreviewUrl } from "../../util/inodes/post_process/preview_url.ts";
import { type FileNode } from "../../util/inodes/types.ts";
import { getDirByPath, getInodeByDir } from "../../util/kv/inodes.ts";
import { type AppContext } from "../../util/types.ts";
import { asset } from "../../util/url.ts";
import notFoundHandler from "../not_found.tsx";

type FragmentId = "chat";

export default async function showFileHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const fragmentId = ctx.url.searchParams.get("fragment") as FragmentId | null;
  const path = parsePathname(ctx.url.pathname) as NonRootPath;
  const notFound = () => notFoundHandler(ctx, { header: { breadcrumb: true } });

  if (path.isRootSegment) {
    return ctx.redirect(ctx.req.url + "/", STATUS_CODE.PermanentRedirect);
  }

  const { value: parentDir } = await getDirByPath(path.parentSegments, {
    consistency: "eventual",
  });

  if (!parentDir) {
    return notFound();
  }

  const { value: inode } = await getInodeByDir<FileNode>({
    inodeName: path.lastSegment,
    parentDirId: parentDir.id,
    consistency: fragmentId === "chat" ? "strong" : "eventual",
  });

  const permissions = getPermissions({ user, resource: inode });

  if (!inode || !permissions.canRead) {
    return notFound();
  }

  const chatSection = (
    <Chat
      enabled={inode.chatEnabled}
      chatId={inode.id}
      chatTitle={inode.name}
      permissions={permissions}
    />
  );

  if (fragmentId === "chat") {
    return ctx.jsxFragment(chatSection);
  }

  const displayType = getFileNodeDisplayType(inode);
  let preview;
  let importmap;

  if (displayType === "video") {
    importmap = {
      "$hls": asset("vendored/hls.mjs"),
      "$listenPostProcessing": asset("inodes/listen_post_processing.js"),
    };
    preview = (
      <VideoPreview
        inode={inode}
        permissions={permissions}
      />
    );
  } else if (displayType === "image") {
    preview = (
      <ImagePreview
        inode={inode}
        permissions={permissions}
        url={await getPreviewUrl(inode)}
      />
    );
  } else if (displayType === "iframe") {
    preview = (
      <IframePreview
        inode={inode}
        permissions={permissions}
        url={await getPreviewUrl(inode)}
      />
    );
  } else {
    preview = (
      <NoPreview
        inode={inode}
        permissions={permissions}
      />
    );
  }

  const head = (
    <>
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
      {preview}
      {chatSection}
    </Page>
  );
}
