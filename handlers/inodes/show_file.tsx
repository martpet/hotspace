import { getPermissions, type NonRootPath, parsePathname } from "$util";
import { STATUS_CODE } from "@std/http";
import Chat from "../../components/chat/ChatSection.tsx";
import FilePreview from "../../components/inodes/file_node/FilePreview.tsx";
import ImagePreview from "../../components/inodes/file_node/ImagePreview.tsx";
import TextPreview from "../../components/inodes/file_node/TextPreview.tsx";
import VideoPreview from "../../components/inodes/file_node/VideoPreview.tsx";
import PdfPreview from "../../components/inodes/PdfPreview.tsx";
import Page from "../../components/pages/Page.tsx";
import {
  getImagePreviewUrl,
  getPdfPreviewUrl,
  isPreviewableAsPdf,
  isPreviewableAsText,
} from "../../util/inodes/file_preview.ts";
import {
  isImageNode,
  isPostProcessedFileNode,
  isVideoNode,
  signFileNodeUrl,
} from "../../util/inodes/helpers.ts";
import { getProcessingDuration } from "../../util/inodes/post_process/post_process.ts";
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

  let preview;

  if (
    isPostProcessedFileNode(inode) &&
    getProcessingDuration(inode).isTimedOut
  ) {
    preview = (
      <FilePreview
        inode={inode}
        permissions={permissions}
      />
    );
  } else if (isImageNode(inode)) {
    preview = (
      <ImagePreview
        inode={inode}
        permissions={permissions}
        url={await getImagePreviewUrl(inode)}
      />
    );
  } else if (isVideoNode(inode)) {
    preview = (
      <VideoPreview
        inode={inode}
        permissions={permissions}
      />
    );
  } else if (isPreviewableAsPdf(inode)) {
    preview = (
      <PdfPreview
        inode={inode}
        permissions={permissions}
        url={await getPdfPreviewUrl(inode)}
      />
    );
  } else if (isPreviewableAsText(inode)) {
    preview = (
      <TextPreview
        inode={inode}
        permissions={permissions}
        url={await signFileNodeUrl(inode.s3Key)}
      />
    );
  } else {
    preview = (
      <FilePreview
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
      head={head}
      header={{ breadcrumb: true }}
    >
      {preview}
      {chatSection}
    </Page>
  );
}
