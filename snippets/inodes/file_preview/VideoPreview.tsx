import type { AppContext, VideoNode } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";

interface Props {
  videoNode: VideoNode;
  fileUrl: string;
}

export function VideoPreview(props: Props, ctx: AppContext) {
  const { videoNode, fileUrl } = props;
  const videoSrc = fileUrl + ".m3u8";
  const workerPath = asset("hls/hls.worker.js", { cdn: false });
  const supportsHls = ctx.userAgent.browser.name === "Safari";
  const isConverting = videoNode.mediaConvert.status === "PENDING";
  const isConvertingError = videoNode.mediaConvert.status === "ERROR";
  const convertingPerc = videoNode.mediaConvert.jobPercentComplete;

  return (
    <>
      {!supportsHls && !isConvertingError && (
        <link rel="modulepreload" href={asset("hls/hls.mjs")} />
      )}

      {!isConvertingError && (
        <script type="module" src={asset("inodes/video_node.js")} />
      )}

      {isConverting && (
        <p id="video-converting" class="spinner">
          Video is converting
          <span hidden={!convertingPerc}>
            : <span id="progress-perc">{convertingPerc}</span>%
          </span>
        </p>
      )}

      <p id="video-error" hidden={!isConvertingError} class="alert error">
        There was an error converting the video, try uploading it again.
      </p>

      {!isConvertingError && (
        <video
          id="video"
          hidden={isConverting}
          controls
          src={!isConverting && supportsHls ? videoSrc : undefined}
          data-video-src={isConverting || !supportsHls ? videoSrc : null}
          data-inode-id={videoNode.id}
          data-is-converting={isConverting ? "1" : null}
          data-supports-hls={supportsHls ? "1" : null}
          data-worker-path={supportsHls ? null : workerPath}
        />
      )}
    </>
  );
}
