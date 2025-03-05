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
  const isConverted = videoNode.mediaConvert.status === "COMPLETE";
  const supportsHls = ctx.userAgent.browser.name === "Safari";

  return (
    <>
      {!supportsHls && <link rel="modulepreload" href={asset("hls/hls.mjs")} />}
      <script type="module" src={asset("inodes/video_node.js")} />

      {!isConverted && (
        <p id="video-converting" class="spinner">
          Video is converting, please wait.
        </p>
      )}

      <video
        id="video"
        hidden={!isConverted}
        controls
        src={supportsHls && isConverted ? videoSrc : undefined}
        data-video-src={!supportsHls || !isConverted ? videoSrc : null}
        data-inode-id={videoNode.id}
        data-is-converted={isConverted ? "1" : null}
        data-supports-hls={supportsHls ? "1" : null}
        data-worker-path={supportsHls ? null : workerPath}
      />
    </>
  );
}
