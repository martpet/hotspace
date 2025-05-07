import { type ResourcePermissions } from "$util";
import { getRemainingProcessingTimeout } from "../../../util/inodes/post_process/post_process.ts";
import {
  InodePreviewInfo,
  showOriginalImageAsPreview,
} from "../../../util/inodes/post_process/preview_info.ts";
import type {
  FileNode,
  PostProcessedToImage,
} from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: FileNode;
  permissions: ResourcePermissions;
  previewInfo: InodePreviewInfo | undefined;
}

export default function ImagePreview(props: Props) {
  const { inode, permissions, previewInfo } = props;

  let timeoutAfter;
  let isProcessing;
  let showError;
  let downloadText;
  let style;

  if (inode.postProcess) {
    if (!showOriginalImageAsPreview(inode)) {
      timeoutAfter = getRemainingProcessingTimeout(inode);
      isProcessing = !!timeoutAfter;
      showError = inode.postProcess.status === "ERROR" || timeoutAfter === 0;
      downloadText = "Download original";
    }
    const { width, height } = (inode as PostProcessedToImage).postProcess;
    if (width && height) style = { aspectRatio: `1 / ${height / width}` };
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
        <img
          id="file-preview"
          src={previewInfo?.url}
          hidden={isProcessing}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? timeoutAfter : null}
          style={style}
        />
      )}
    </FilePreview>
  );
}
