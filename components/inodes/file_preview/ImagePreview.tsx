import { type ResourcePermissions } from "$util";
import { InodePreviewInfo } from "../../../util/inodes/inode_preview_info.ts";
import { getRemainingProcessingTimeout } from "../../../util/inodes/post_process/post_process.ts";
import { getResponsiveMediaStyles } from "../../../util/inodes/responsive_media_styles.ts";
import type {
  FileNode,
  PostProcessedToImage,
} from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Spinner from "../../Spinner.tsx";
import GeneralPreview from "./GeneralPreview.tsx";

interface Props {
  inode: FileNode;
  preview: InodePreviewInfo;
  perm: ResourcePermissions;
}

export default function ImagePreview(props: Props) {
  const { inode, preview, perm } = props;

  let timeoutAfter;
  let isProcessing;
  let showError;
  let downloadText;
  let style;

  if (inode.postProcess) {
    if (!preview.isOriginalFile) {
      timeoutAfter = getRemainingProcessingTimeout(inode);
      isProcessing = !!timeoutAfter;
      showError = inode.postProcess.status === "ERROR" || timeoutAfter === 0;
      downloadText = "Download original";
    }
    const { width, height } = (inode as PostProcessedToImage).postProcess;
    if (width && height) style = getResponsiveMediaStyles(width, height);
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
          <Spinner block id="file-preview-loader">
            Creating a preview…
          </Spinner>
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
          src={preview?.url || undefined}
          hidden={isProcessing}
          data-inode-id={isProcessing ? inode.id : null}
          data-processing-timeout={isProcessing ? timeoutAfter : null}
          style={style}
        />
      )}
    </GeneralPreview>
  );
}
