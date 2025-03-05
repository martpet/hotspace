import { isVideoNode } from "../../../util/inodes/util.ts";
import type { FileNode } from "../../../util/types.ts";
import { VideoPreview } from "./VideoPreview.tsx";

export interface Props {
  fileNode: FileNode;
  fileUrl: string;
}

export default function FilePreview(props: Props) {
  const { fileUrl, fileNode } = props;
  const { fileType } = fileNode;
  const [mainType, subType] = fileType.split("/");

  const previewInIframe = mainType === "text" ||
    subType === "pdf" ||
    subType === "x-javascript";

  return (
    <>
      {mainType === "image" && (
        <a href={fileUrl}>
          <img src={fileUrl} height={200} />
        </a>
      )}
      {isVideoNode(fileNode) && (
        <VideoPreview
          videoNode={fileNode}
          fileUrl={fileUrl}
        />
      )}
      {previewInIframe && (
        <iframe
          src={fileUrl}
          width="400"
          height="200"
        />
      )}
      <p>
        <a href={fileUrl} target="_blank">Open File ↗</a>
      </p>
    </>
  );
}
