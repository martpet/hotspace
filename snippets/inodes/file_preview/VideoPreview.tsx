import type { AppContext, VideoNode } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";

interface Props {
  videoNode: VideoNode;
}

export function VideoPreview(props: Props, ctx: AppContext) {
  const { videoNode } = props;
  const workerPath = asset("hls/hls.worker.js", { cdn: false });
  const supportsHls = ctx.userAgent.browser.name === "Safari";
  const isConverting = videoNode.mediaConvert.status === "PENDING";
  const hasConvertError = videoNode.mediaConvert.status === "ERROR";
  const convertingPerc = videoNode.mediaConvert.jobPercentComplete;
  const videoUrl = videoNode.mediaConvert.playlistDataUrl;

  return (
    <>
      {!supportsHls && !hasConvertError && (
        <link rel="modulepreload" href={asset("hls/hls.mjs")} />
      )}

      {!hasConvertError && (!supportsHls || isConverting) && (
        <script type="module" src={asset("inodes/video_node.js")} />
      )}

      {isConverting && (
        <p id="video-converting" class="spinner">
          Video is converting…{"  "}
          <span id="progress-perc">{convertingPerc || null}</span>
        </p>
      )}

      <p id="converting-error" hidden={!hasConvertError} class="alert error">
        There was an error converting the video, try uploading it again.
      </p>

      {!hasConvertError && (
        <video
          id="video"
          hidden={isConverting}
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
