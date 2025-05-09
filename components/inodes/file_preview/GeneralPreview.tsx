import type { ResourcePermissions } from "$util";
import { type ComponentChildren } from "preact";
import type { FileNode } from "../../../util/inodes/types.ts";
import ButtonToggleChat from "../../chat/ButtonToggleChat.tsx";
import ButtonDeleteInode from "../ButtonDeleteInode.tsx";

interface Props {
  inode: FileNode;
  perm: ResourcePermissions;
  downloadText?: string;
  children?: ComponentChildren;
  isPostProcessError?: boolean;
}

export default function GeneralPreview(props: Props) {
  const {
    inode,
    children,
    perm,
    downloadText,
    isPostProcessError,
  } = props;

  const fileName = decodeURIComponent(inode.name);
  const { canModerate, canModify } = perm;

  return (
    <>
      {(!isPostProcessError || canModify) && children && (
        <div id="file-preview-canvas">{children}</div>
      )}
      <header class="inodes-header">
        <h1>{fileName}</h1>
        {(canModerate || canModify) && (
          <menu class="menu-bar">
            {canModify && <ButtonDeleteInode inode={inode} />}
            {canModerate && <ButtonToggleChat chat={inode} />}
          </menu>
        )}
      </header>
      <a href={`/inodes/file/${inode.id}`}>
        {!isPostProcessError && downloadText || "Download file"} ↓
      </a>
    </>
  );
}
