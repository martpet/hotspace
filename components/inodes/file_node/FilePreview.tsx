import type { ResourcePermissions } from "$util";
import { type ComponentChildren, type JSX } from "preact";
import type { FileNode } from "../../../util/inodes/types.ts";
import ButtonToggleChat from "../../chat/ButtonToggleChat.tsx";
import ButtonDeleteInode from "../ButtonDeleteInode.tsx";

interface Props extends JSX.HTMLAttributes<HTMLElement> {
  inode: FileNode;
  permissions: ResourcePermissions;
  downloadText?: string;
  children?: ComponentChildren;
}

export default function FilePreview(props: Props) {
  const {
    inode,
    children,
    permissions,
    downloadText,
    ...articleProps
  } = props;

  const fileName = decodeURIComponent(inode.name);
  const { canModerate, canModify } = permissions;

  return (
    <article id="file-preview" {...articleProps}>
      {children && <div id="file-preview-canvas">{children}</div>}
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
        {downloadText || "Download file"} ↓
      </a>
    </article>
  );
}
