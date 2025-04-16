import { showOriginalImageAsPreview } from "../../../util/inodes/helpers.ts";
import type { ImageNode } from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";

interface Props {
  imageUrl: string | null;
  inode: ImageNode;
}

export function ImagePreview(props: Props) {
  const { imageUrl, inode } = props;
  const { width, height } = inode.postProcess;

  const waitProcessing = !showOriginalImageAsPreview(inode) &&
    inode.postProcess.status === "PENDING";

  const showError = !showOriginalImageAsPreview(inode) &&
    inode.postProcess.status === "ERROR";

  return (
    <>
      {waitProcessing && (
        <script type="module" src={asset("inodes/filenodes/image.js")} />
      )}

      {waitProcessing && (
        <Loader id="image-processing" class="file-preview-loader">
          Converting image
        </Loader>
      )}

      <p id="image-processing-error" class="alert error" hidden={!showError}>
        There was an error converting this image, try uploading it again.
      </p>

      <img
        id="image"
        src={imageUrl || ""}
        hidden={waitProcessing || showError}
        data-inode-id={waitProcessing ? inode.id : null}
        style={{
          aspectRatio: width && height ? `1 / ${height / width}` : undefined,
        }}
      />
    </>
  );
}
