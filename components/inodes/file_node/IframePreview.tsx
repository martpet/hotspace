import { type ResourcePermissions } from "$util";
import { getRemainingProcessingTimeout } from "../../../util/inodes/post_process/post_process.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
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
  const mimeType = inode.postProcess?.previewMimeType || inode.mimeType;

  let timeoutAfter;
  let isProcessing;
  let showError;
  let downloadText;

  if (inode.postProcess?.previewMimeType) {
    timeoutAfter = getRemainingProcessingTimeout(inode);
    isProcessing = !!timeoutAfter;
    showError = inode.postProcess.status === "ERROR" || timeoutAfter === 0;
    downloadText = "Download original";
  }

  return (
    <FilePreview
      inode={inode}
      permissions={permissions}
      downloadText={downloadText}
      isPostProcessError={showError}
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
          src={url}
          hidden={isProcessing}
          data-mime={mimeType}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? timeoutAfter : null}
        />
      )}
    </FilePreview>
  );
}
