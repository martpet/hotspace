import type { VideoNode } from "../../../util/inodes/types.ts";
import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";

interface Props {
  videoNode: VideoNode;
}

export function VideoPreview(props: Props, ctx: AppContext) {
  const { videoNode } = props;
  const workerPath = asset("vendored/hls.worker.js", { cdn: false });
  const supportsHls = ctx.userAgent.browser.name === "Safari";
  const {
    status,
    percentComplete,
    playlistDataUrl: videoUrl,
  } = videoNode.mediaConvert || {};
  const isPending = status === "PENDING";
  const isError = status === "ERROR";

  return (
    <>
      {!supportsHls && !isError && (
        <link rel="modulepreload" href={asset("vendored/hls.mjs")} />
      )}

      {!isError && (!supportsHls || isPending) && (
        <script type="module" src={asset("inodes/video_node.js")} />
      )}

      {isPending && (
        <p id="video-converting" class="spinner">
          Converting video…{"  "}
          <span id="progress-perc">{percentComplete || null}</span>
        </p>
      )}

      <p id="converting-error" hidden={!isError} class="alert error">
        There was an error converting the video, try uploading it again.
      </p>

      {!isError && (
        <video
          id="video"
          hidden={isPending}
          controls
          src={supportsHls ? videoUrl : undefined}
          data-video-url={videoUrl || !supportsHls ? videoUrl : null}
          data-inode-id={videoNode.id}
          data-supports-hls={supportsHls && !videoUrl ? "1" : null}
          data-worker-path={supportsHls ? null : workerPath}
        />
      )}
    </>
  );
}
