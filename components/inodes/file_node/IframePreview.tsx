import { type ResourcePermissions } from "$util";
import { isPreviewableAsPdf } from "../../../util/inodes/file_preview.ts";
import { isPostProcessedNode } from "../../../util/inodes/helpers.ts";
import { getProcessingTimeoutAfter } from "../../../util/inodes/post_process/post_process.ts";
import type { FileNode, InodePreviewType } from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: FileNode;
  permissions: ResourcePermissions;
  url: string | undefined;
}

export default function IframePreview(props: Props) {
  const { inode, permissions, url } = props;

  let isProcessing;
  let showError;
  let downloadText;
  let timeoutAfter;
  let previewType: InodePreviewType;

  if (isPostProcessedNode(inode)) {
    timeoutAfter = getProcessingTimeoutAfter(inode);
    isProcessing = inode.postProcess.status === "PENDING";
    showError = inode.postProcess.status === "ERROR";
    downloadText = "Download original";
    previewType = inode.postProcess.previewType!;
  } else if (isPreviewableAsPdf(inode)) {
    previewType = "pdf";
  } else {
    previewType = "text";
  }

  return (
    <FilePreview
      inode={inode}
      permissions={permissions}
      downloadText={downloadText}
    >
      {isProcessing && (
        <>
          <script
            type="module"
            src={asset("inodes/listen_post_processing.js")}
          />
          <Loader id="file-preview-loader">
            Creating a preview
          </Loader>
        </>
      )}

      {(isProcessing || showError) && (
        <p id="file-preview-error" class="alert error" hidden={!showError}>
          Could not create a preview
        </p>
      )}

      {!showError && (
        <iframe
          id="file-preview"
          class={previewType}
          src={url}
          hidden={isProcessing}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? timeoutAfter : null}
        />
      )}
    </FilePreview>
  );
}
