import type { VideoNode } from "../../../util/inodes/types.ts";
import type { AppContext } from "../../../util/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";

interface Props {
  inode: VideoNode;
}

export function VideoPreview(props: Props, ctx: AppContext) {
  const { inode } = props;
  const hlsWorkerPath = asset("vendored/hls.worker.js", { cdn: false });
  const supportsHls = ctx.userAgent.browser.name === "Safari";
  const {
    status,
    percentComplete,
    width,
    height,
    playlistDataUrl: videoUrl,
  } = inode.mediaConvert || {};
  const isConverting = status === "PENDING";
  const isError = status === "ERROR";

  return (
    <>
      {!supportsHls && !isError && (
        <link rel="modulepreload" href={asset("vendored/hls.mjs")} />
      )}

      {!isError && (!supportsHls || isConverting) && (
        <script type="module" src={asset("inodes/filenodes/video.js")} />
      )}

      {isConverting && (
        <Loader
          id="video-converting"
          class="file-preview-loader"
          ellipsis={false}
        >
          Converting video…{" "}
          <span id="progress-perc">{percentComplete || null}</span>
        </Loader>
      )}

      <p id="video-converting-error" class="alert error" hidden={!isError}>
        There was an error converting this video, try uploading it again.
      </p>

      {!isError && (
        <video
          id="video"
          src={supportsHls ? videoUrl : undefined}
          hidden={isConverting || isError}
          controls
          data-video-url={videoUrl || !supportsHls ? videoUrl : null}
          data-inode-id={inode.id}
          data-supports-hls={supportsHls && !videoUrl ? "1" : null}
          data-hls-worker-path={supportsHls ? null : hlsWorkerPath}
          style={{
            aspectRatio: width && height ? `1 / ${height / width}` : undefined,
          }}
        />
      )}
    </>
  );
}
