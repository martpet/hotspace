import type { ResourcePermissions } from "$util";
import { type FileNodePreview } from "../../../util/inodes/file_node_preview.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import FontSample from "./FontSample.tsx";
import GeneralPreview from "./GeneralPreview.tsx";
import IframePreview from "./IframePreview.tsx";
import ImagePreview from "./ImagePreview.tsx";
import VideoPreview from "./VideoPreview.tsx";

interface Props {
  inode: FileNode;
  preview: FileNodePreview;
  perm: ResourcePermissions;
}

export default function FilePreview(props: Props) {
  const { inode, perm, preview } = props;

  if (preview?.display === "video") {
    return <VideoPreview inode={inode} perm={perm} />;
  }

  if (preview?.display === "image") {
    return <ImagePreview inode={inode} preview={preview} perm={perm} />;
  }

  if (preview?.display === "iframe") {
    return <IframePreview inode={inode} preview={preview} perm={perm} />;
  }

  return (
    <GeneralPreview inode={inode} perm={perm}>
      {preview?.display && preview.url && (
        <>
          {preview.display === "audio" && <audio src={preview.url} controls />}
          {preview.display === "font" && <FontSample src={preview.url} />}
        </>
      )}
    </GeneralPreview>
  );
}
