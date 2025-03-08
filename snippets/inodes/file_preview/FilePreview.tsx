import { isVideoNode } from "../../../util/inodes/util.ts";
import type { FileNode } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";
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
      {isVideoNode(fileNode) && (
        <VideoPreview
          videoNode={fileNode}
          fileNodeUrl={fileNodeUrl}
        />
      )}
      {showInFirame && (
        <iframe
          id="filenode-iframe"
          src={fileNodeUrl}
          width="400"
          height="200"
        />
      )}
      {isDocx && (
        <iframe
          id="docx-iframe"
          src={asset("docx/iframe.html")}
          data-file-node-url={fileNodeUrl}
          data-jszip-path={asset("docx/jszip.min.js")}
          data-docx-preview-path={asset("docx/docx-preview.min.js")}
        />
      )}
      <p>
        <a href={fileNodeUrl} target="_blank">Open File ↗</a>
      </p>
    </>
  );
}
