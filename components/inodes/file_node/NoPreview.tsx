import { type ResourcePermissions } from "$util";
import type { FileNode } from "../../../util/inodes/types.ts";
import FilePreview from "./FilePreview.tsx";

interface Props {
  inode: FileNode;
  permissions: ResourcePermissions;
}

export default function NoPreview(props: Props) {
  return <FilePreview {...props} />;
}
