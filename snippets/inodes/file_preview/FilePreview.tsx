import { isVideoNode } from "../../../util/inodes/helpers.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import DocxPreview from "./DocxPreview.tsx";
import { VideoPreview } from "./VideoPreview.tsx";

export interface Props {
  fileNode: FileNode;
  fileNodeUrl: string;
}

export default function FilePreview(props: Props) {
  const { fileNodeUrl, fileNode } = props;
  const { fileType } = fileNode;
  const [mainType, subType] = fileType.split("/");

  const showInFirame = mainType === "text" ||
    subType === "pdf" ||
    subType === "x-javascript";

  const isDocx = fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <>
      {mainType === "image" && (
        <a href={fileNodeUrl}>
          <img src={fileNodeUrl} height={200} />
        </a>
      )}
      {isVideoNode(fileNode) && <VideoPreview videoNode={fileNode} />}
      {showInFirame && (
        <iframe
          id="inode-preview-iframe"
          src={fileNodeUrl}
          width="400"
          height="200"
        />
      )}
      {isDocx && <DocxPreview fileNodeUrl={fileNodeUrl} />}
      <p>
        <a href={fileNodeUrl} target="_blank">Open Original ↗</a>
      </p>
    </>
  );
}
