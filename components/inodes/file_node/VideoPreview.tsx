import { type ResourcePermissions } from "$util";
import type { VideoNode } from "../../../util/inodes/types.ts";
import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: VideoNode;
  permissions: ResourcePermissions;
}

export default function VideoPreview(props: Props, ctx: AppContext) {
  const { inode, permissions } = props;
  const browserName = ctx.userAgent.browser.name;
  const hlsWorkerPath = asset("vendored/hls.worker.js", { cdn: false });
  const supportsHls = browserName === "Safari";
  const { status, percentComplete, width, height, playlistDataUrl } =
    inode.postProcess;
  const isProcessing = status === "PENDING";
  const showError = status === "ERROR";

  return (
    <FilePreview
      inode={inode}
      permissions={permissions}
      downloadText="Download original"
    >
      {!showError && !supportsHls && (
        <link rel="modulepreload" href={asset("vendored/hls.mjs")} />
      )}

      {(isProcessing || (!showError && !supportsHls)) && (
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

      {!showError && (
        <video
          id="video"
          src={supportsHls ? playlistDataUrl : undefined}
          hidden={isProcessing}
          controls
          data-inode-id={isProcessing ? inode.id : null}
          data-supports-hls={(isProcessing && supportsHls) ? "1" : null}
          data-playlist-url={(!supportsHls && playlistDataUrl) || null}
          data-hls-worker-path={supportsHls ? null : hlsWorkerPath}
          style={{
            aspectRatio: width && height ? `1 / ${height / width}` : undefined,
          }}
        />
      )}
    </FilePreview>
  );
}
