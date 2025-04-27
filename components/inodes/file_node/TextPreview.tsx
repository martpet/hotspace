import { type ResourcePermissions } from "$util";
import type { FileNode } from "../../../util/inodes/types.ts";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: FileNode;
  permissions: ResourcePermissions;
  url: string;
}

export default function TextPreview(props: Props) {
  const { inode, permissions, url } = props;

  return (
    <FilePreview inode={inode} permissions={permissions}>
      <iframe id="text" src={url} />
    </FilePreview>
  );
}
