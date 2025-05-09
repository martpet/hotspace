import type { ResourcePermissions } from "../../../modules/util/file_permissions.ts";
import { type InodePreviewInfo } from "../../../util/inodes/post_process/preview_info.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import IframePreview from "./IframePreview.tsx";
import ImagePreview from "./ImagePreview.tsx";
import PreviewLayout from "./PreviewLayout.tsx";
import VideoPreview from "./VideoPreview.tsx";

interface Props {
  inode: FileNode;
  preview: InodePreviewInfo;
  perm: ResourcePermissions;
}

export default function FilePreview(props: Props) {
  const { inode, perm, preview } = props;
  const { displayType } = preview;

  if (displayType === "video") {
    return <VideoPreview inode={inode} perm={perm} />;
  }

  if (displayType === "image") {
    return <ImagePreview inode={inode} preview={preview} perm={perm} />;
  }

  if (displayType === "iframe") {
    return <IframePreview inode={inode} preview={preview} perm={perm} />;
  }

  return (
    <PreviewLayout inode={inode} perm={perm}>
      {displayType === "audio" && <audio controls src={preview.url!} />}
    </PreviewLayout>
  );
}
