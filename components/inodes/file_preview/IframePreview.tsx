import { type ResourcePermissions } from "$util";
import { getRemainingProcessingTimeout } from "../../../util/inodes/post_process/post_process.ts";
import { InodePreviewInfo } from "../../../util/inodes/post_process/preview_info.ts";
import type { FileNode } from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import GeneralPreview from "./GeneralPreview.tsx";

interface Props {
  inode: FileNode;
  preview: InodePreviewInfo;
  perm: ResourcePermissions;
}

export default function IframePreview(props: Props) {
  const { inode, preview, perm } = props;

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
    <GeneralPreview
      inode={inode}
      perm={perm}
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
          src={preview?.url || undefined}
          hidden={isProcessing}
          data-mime={preview.mimeType}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? timeoutAfter : null}
        />
      )}
    </GeneralPreview>
  );
}
