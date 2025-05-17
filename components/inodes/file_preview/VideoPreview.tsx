import { type ResourcePermissions } from "$util";
import { getResponsiveMediaStyle } from "../../../util/inodes/post_process/styles.ts";
import { isPostProcessedToVideo } from "../../../util/inodes/post_process/type_predicates.ts";
import { FileNode } from "../../../util/inodes/types.ts";
import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import GeneralPreview from "./GeneralPreview.tsx";

interface Props {
  inode: FileNode;
  perm: ResourcePermissions;
}

export default function VideoPreview(props: Props, ctx: AppContext) {
  const { inode, perm } = props;
  const isPostProcessed = isPostProcessedToVideo(inode);
  const browserName = ctx.userAgent.browser.name;
  const supportsHls = browserName === "Safari";
  const hlsWorkerPath = asset("vendored/hls.worker.js", { cdn: false });

  let isProcessing;
  let showError;
  let percentComplete;
  let videoUrl;
  let width;
  let height;
  let downloadText;
  let style;

  if (isPostProcessed) {
    isProcessing = inode.postProcess.status === "PENDING";
    showError = inode.postProcess.status === "ERROR";
    percentComplete = inode.postProcess.percentComplete;
    videoUrl = inode.postProcess.playlistDataUrl;
    width = inode.postProcess.width;
    height = inode.postProcess.height;
    downloadText = "Download original";
    if (width && height) style = getResponsiveMediaStyle(width, height);
  }

  return (
    <GeneralPreview
      inode={inode}
      perm={perm}
      downloadText={downloadText}
    >
      {isPostProcessed && (
        <>
          {isProcessing && (
            <link
              rel="modulepreload"
              href={asset("inodes/listen_post_processing.js")}
            />
          )}

          {!supportsHls && !showError && (
            <link rel="modulepreload" href={asset("vendored/hls.mjs")} />
          )}

          {(isProcessing || (!supportsHls && !showError)) && (
            <script type="module" src={asset("inodes/file_preview/video.js")} />
          )}

          {isProcessing && (
            <Loader id="file-preview-loader" ellipsis={false}>
              Converting video…{" "}
              <span id="progress-perc">{percentComplete || null}</span>
            </Loader>
          )}

          {(isProcessing || showError) && (
            <p id="file-preview-error" class="alert error" hidden={!showError}>
              There was an error converting this video, try uploading it again.
            </p>
          )}
        </>
      )}

      {!showError && (
        <video
          id="file-preview"
          src={supportsHls ? videoUrl : undefined}
          hidden={isProcessing}
          controls
          data-inode-id={isProcessing ? inode.id : null}
          data-is-processing={isProcessing || null}
          data-video-url={(isPostProcessed && !supportsHls && videoUrl) || null}
          data-supports-hls={(isProcessing && supportsHls) ? "1" : null}
          data-hls-worker-path={isPostProcessed && !supportsHls
            ? hlsWorkerPath
            : null}
          style={style}
        />
      )}
    </GeneralPreview>
  );
}
