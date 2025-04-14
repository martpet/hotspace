import type { ImageNode } from "../../../util/inodes/types.ts";
import { asset } from "../../../util/url.ts";
import Loader from "../../Loader.tsx";

interface Props {
  imageUrl: string | null;
  inode: ImageNode;
}

export function ImagePreview(props: Props) {
  const { imageUrl, inode } = props;
  const { status, width, height } = inode.postProcess;
  const isProcessing = status === "PENDING";
  const isError = status === "ERROR";

  return (
    <>
      {isProcessing && (
        <script type="module" src={asset("inodes/filenodes/image.js")} />
      )}

      {isProcessing && (
        <Loader id="image-processing" class="file-preview-loader">
          Converting image
        </Loader>
      )}

      <p
        id="image-processing-error"
        class="file-preview-error alert error"
        hidden={!isError}
      >
        There was an error converting the image, try uploading it again.
      </p>

      <img
        id="image"
        src={imageUrl || ""}
        hidden={isProcessing}
        data-inode-id={isProcessing ? inode.id : null}
        style={{
          aspectRatio: width && height ? `1 / ${height / width}` : undefined,
        }}
      />
    </>
  );
}
