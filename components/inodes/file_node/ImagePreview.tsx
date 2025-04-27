import type { ResourcePermissions } from "$util";
import { showOriginalImageAsPreview } from "../../../util/inodes/file_preview.ts";
import { getProcessingDuration } from "../../../util/inodes/post_process/post_process.ts";
import type { ImageNode } from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: ImageNode;
  permissions: ResourcePermissions;
  url: string | undefined;
}

export default function ImagePreview(props: Props) {
  const { inode, permissions, url } = props;
  const { width, height } = inode.postProcess;

  let isProcessing;
  let showError;
  let processingTimeoutIn;

  if (!showOriginalImageAsPreview(inode)) {
    isProcessing = inode.postProcess.status === "PENDING";
    showError = inode.postProcess.status === "ERROR";
    processingTimeoutIn = getProcessingDuration(inode).timeoutIn;
  }

  return (
    <FilePreview
      inode={inode}
      permissions={permissions}
      downloadText="Download original"
    >
      {isProcessing && (
        <>
          <script type="module" src={asset("inodes/file_preview/image.js")} />
          <Loader id="file-preview-loader">
            Preparing image
          </Loader>
        </>
      )}

      {(isProcessing || showError) && (
        <p id="file-preview-error" class="alert error" hidden={!showError}>
          There was an error converting this image, try uploading it again.
        </p>
      )}

      {!showError && (
        <img
          id="image"
          src={url}
          hidden={isProcessing}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? processingTimeoutIn : null}
          style={{
            aspectRatio: width && height ? `1 / ${height / width}` : undefined,
          }}
        />
      )}
    </FilePreview>
  );
}
