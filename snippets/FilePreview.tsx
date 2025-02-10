import type { FileNode } from "../util/types.ts";

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

      {mainType === "video" && <video controls src={url} height={200} />}

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
