import type { FileNode } from "../util/types.ts";

interface Props {
  inode: FileNode;
  url: string;
}

export default function FilePreview({ inode, url }: Props) {
  const { fileType } = inode;
  const [type, substype] = fileType.split("/");

  return (
    <>
      {type === "image" && (
        <a href={url} target="_blank">
          <img src={url} height={200} />
        </a>
      )}

      {type === "video" && <video controls src={url} height={200} />}

      {(substype === "pdf" || type === "text" ||
        fileType === "application/x-javascript") && (
        <>
          <h2>Preview</h2>
          <iframe
            src={url}
            width="400"
            height="200"
          >
            Preview not available
          </iframe>
        </>
      )}
    </>
  );
}
