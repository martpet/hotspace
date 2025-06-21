import type { ResourcePermissions } from "$util";
import { format as formatBytes } from "@std/fmt/bytes";
import { type ComponentChildren } from "preact";
import type { FileNode } from "../../../util/inodes/types.ts";
import ButtonPageSettings from "../ButtonPageSettings.tsx";

interface Props {
  inode: FileNode;
  perm: ResourcePermissions;
  children?: ComponentChildren;
  isPostProcessError?: boolean;
}

export default function GeneralPreview(props: Props) {
  const {
    inode,
    children,
    perm,
    isPostProcessError,
  } = props;

  const fileName = decodeURIComponent(inode.name);

  return (
    <>
      {(!isPostProcessError || perm.canModify) && children && (
        <figure id="file-preview-canvas">{children}</figure>
      )}
      <header class="inodes-header">
        <h1>{fileName}</h1>
        {(perm.canModerate || perm.canModify) && (
          <menu class="menu-bar">
            <ButtonPageSettings inode={inode} perm={perm} />
          </menu>
        )}
      </header>
      <div id="download-inode">
        <i class="icn-download"></i>
        <a href={`/download/${inode.id}`}>Download</a>
        <small>
          ({formatBytes(inode.fileSize)})
        </small>
      </div>
    </>
  );
}
