import type { ResourcePermissions } from "$util";
import { type InodePreviewInfo } from "../../../util/inodes/inode_preview_info.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import FontSample from "./FontSample.tsx";
import GeneralPreview from "./GeneralPreview.tsx";
import IframePreview from "./IframePreview.tsx";
import ImagePreview from "./ImagePreview.tsx";
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
    <GeneralPreview inode={inode} perm={perm}>
      {displayType && (
        <>
          {displayType === "audio" && <audio src={preview.url!} controls />}
          {displayType === "font" && <FontSample src={preview.url!} />}
        </>
      )}
    </GeneralPreview>
  );
}
