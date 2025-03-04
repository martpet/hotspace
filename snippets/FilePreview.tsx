import type { AppContext, FileNode } from "../util/types.ts";
import { asset } from "../util/url.ts";

interface Props {
  inode: FileNode;
  url: string;
}

export default function FilePreview({ inode, url }: Props) {
  const { fileType } = inode;
  const [mainType, subType] = fileType.split("/");

  return (
    <>
      {mainType === "image" && (
        <a href={url}>
          <img src={url} height={200} />
        </a>
      )}

      {mainType === "video" && <Video url={url} />}

      {(
        mainType === "text" ||
        subType === "pdf" ||
        fileType === "application/x-javascript"
      ) && (
        <iframe
          src={url}
          width="400"
          height="200"
        />
      )}
    </>
  );
}

interface VideoProps {
  url: string;
}

function Video(props: VideoProps, ctx: AppContext) {
  const CAN_PLAY_HLS = ctx.userAgent.browser.name === "Safari";
  const videoSource = props.url + ".m3u8";

  return (
    <>
      <video
        id="video"
        controls
        src={CAN_PLAY_HLS ? videoSource : undefined}
        height={200}
      />

      {!CAN_PLAY_HLS && (
        <>
          <script src={asset("hls.min.js")} />
          <script
            type="module"
            nonce={ctx.scpNonce}
            dangerouslySetInnerHTML={{
              __html: `
                if (Hls.isSupported()) {
                  const hls = new Hls();
                  const videoEl = document.getElementById('video');
                  hls.loadSource("${videoSource}");
                  hls.attachMedia(videoEl);
                }
              `,
            }}
          />
        </>
      )}
    </>
  );
}
