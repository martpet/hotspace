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

  const isDocx = fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div id="file-preview">
      {mainType === "image" && (
        <a href={fileNodeUrl}>
          <img src={fileNodeUrl} />
        </a>
      )}
      {isVideoNode(fileNode) && <VideoPreview videoNode={fileNode} />}

      {(mainType === "text" ||
        subType === "pdf" ||
        subType === "x-javascript") && (
        <iframe id="preview-iframe" src={fileNodeUrl} />
      )}

      {isDocx && <DocxPreview fileNodeUrl={fileNodeUrl} />}
    </div>
  );
}
