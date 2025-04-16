import { isImageNode, isVideoNode } from "../../../util/inodes/helpers.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import DocxPreview from "./DocxPreview.tsx";
import { ImagePreview } from "./ImagePreview.tsx";
import { VideoPreview } from "./VideoPreview.tsx";

export interface Props {
  inode: FileNode;
  originalFileUrl: string;
  previewImageUrl: string | null;
}

export default function FilePreview(props: Props) {
  const { inode, originalFileUrl, previewImageUrl } = props;
  const { fileType } = inode;
  const [mainType, subType] = fileType.split("/");

  return (
    <div id="file-preview">
      {isImageNode(inode) && (
        <ImagePreview imageUrl={previewImageUrl} inode={inode} />
      )}
      {isVideoNode(inode) && <VideoPreview inode={inode} />}

      {(mainType === "text" ||
        subType === "pdf" ||
        subType === "x-javascript") && (
        <iframe id="preview-iframe" src={originalFileUrl} />
      )}

      {fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
        <DocxPreview fileUrl={originalFileUrl} />}
    </div>
  );
}
