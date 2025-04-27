import { type ResourcePermissions } from "$util";
import { isPostProcessedFileNode } from "../../util/inodes/helpers.ts";
import { getProcessingDuration } from "../../util/inodes/post_process/post_process.ts";
import type { FileNode } from "../../util/inodes/types.ts";
import { asset } from "../../util/url.ts";
import Loader from "../Loader.tsx";
import FilePreview from "./file_node/FilePreview.tsx";

interface Props {
  inode: FileNode;
  permissions: ResourcePermissions;
  url: string | undefined;
}

export default function PdfPreview(props: Props) {
  const { inode, permissions, url } = props;

  let isProcessing;
  let showError;
  let downloadText;
  let processingTimeoutIn;

  if (isPostProcessedFileNode(inode)) {
    isProcessing = inode.postProcess.status === "PENDING";
    showError = inode.postProcess.status === "ERROR";
    downloadText = "Download original";
    processingTimeoutIn = getProcessingDuration(inode).timeoutIn;
  }

  return (
    <FilePreview
      inode={inode}
      permissions={permissions}
      downloadText={downloadText}
    >
      {isProcessing && (
        <>
          <script type="module" src={asset("inodes/file_preview/pdf.js")} />
          <Loader id="file-preview-loader">
            Converting document
          </Loader>
        </>
      )}

      {(isProcessing || showError) && (
        <p id="file-preview-error" class="alert error" hidden={!showError}>
          Could not create a preview of the document
        </p>
      )}

      {!showError && (
        <iframe
          id="pdf"
          src={url}
          hidden={isProcessing}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? processingTimeoutIn : null}
        />
      )}
    </FilePreview>
  );
}
