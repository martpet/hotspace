import { s3 } from "$aws";
import { getPermissions } from "$util";
import { pick } from "@std/collections";
import { ulid } from "@std/ulid/ulid";
import { INODES_BUCKET } from "../consts.ts";
import { enqueue } from "../kv/enqueue.ts";
import { setFileNodeStats } from "../kv/filenodes_stats.ts";
import { getInodeById, keys as inodesKeys } from "../kv/inodes.ts";
import { kv } from "../kv/kv.ts";
import { type QueueMsgDeleteS3Objects } from "../queue/delete_s3_objects.ts";
import { type QueueMsgPostProcessFileNodes } from "../queue/post_process/post_process_file_nodes.ts";
import { type QueueMsgPostProcessVideoNodes } from "../queue/post_process/post_process_video_node.ts";
import type { User } from "../types.ts";
import {
  isLibreProcessable,
  isPandocProcessable,
  isPostProcessable,
  isSharpProcessable,
  isVideoNode,
} from "./helpers.ts";
import { setAnyInode } from "./kv_wrappers.ts";
import type {
  DirNode,
  FileNode,
  Inode,
  PostProcessedFileNode,
  PostProcessor,
} from "./types.ts";

interface CompletedUploadWithFileSize extends s3.CompletedMultipartUpload {
  fileSize: number;
}

interface CreatFileNodesFromUploadsOpt {
  dirEntry: Deno.KvEntryMaybe<Inode>;
  dirId: string;
  user: User;
  origin: string;
}

export async function createFileNodesFromUploads(
  uploads: CompletedUploadWithFileSize[],
  options: CreatFileNodesFromUploadsOpt,
) {
  const completedUploadIds = [];

  const postProcessables: Record<PostProcessor, FileNode[]> = {
    sharp: [],
    libre: [],
    pandoc: [],
  };

  for (const upload of uploads) {
    const fileNode = await createFileNode(upload, options);

    if (!fileNode) {
      await cleanupUnsavedFileNodes(uploads, completedUploadIds);
      break;
    }

    completedUploadIds.push(upload.uploadId);

    if (isSharpProcessable(fileNode)) {
      postProcessables.sharp.push(fileNode);
    } else if (isLibreProcessable(fileNode)) {
      postProcessables.libre.push(fileNode);
    } else if (isPandocProcessable(fileNode)) {
      postProcessables.pandoc.push(fileNode);
    }
  }

  for (const [processor, inodes] of Object.entries(postProcessables)) {
    if (inodes.length) {
      await enqueue<QueueMsgPostProcessFileNodes>({
        type: "post-process-file-nodes",
        processor: processor as PostProcessor,
        origin: options.origin,
        items: inodes.map((it) =>
          pick(it, ["id", "s3Key", "name", "fileType"])
        ),
      }).commit();
    }
  }

  return completedUploadIds;
}

async function createFileNode(
  upload: CompletedUploadWithFileSize,
  options: CreatFileNodesFromUploadsOpt,
) {
  const { dirId, user, origin } = options;
  let dirEntry = options.dirEntry;
  let commit = { ok: false };
  let commitIndex = 0;
  let fileNode: FileNode;

  while (!commit.ok) {
    let fileNodeName = encodeURIComponent(upload.fileName);

    if (commitIndex) {
      fileNodeName += `-${commitIndex + 1}`;
      dirEntry = await getInodeById(dirId);
    }

    if (!isValidUploadDirEntry(dirEntry, user)) {
      return;
    }

    fileNode = {
      id: ulid(),
      type: "file",
      fileType: upload.fileType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: fileNodeName,
      parentDirId: dirId,
      ownerId: user.id,
      acl: dirEntry.value.acl,
      aclStats: dirEntry.value.aclStats,
    };

    const fileNodeNullCheck = {
      key: inodesKeys.byDir(dirEntry.value.id, fileNode.name),
      versionstamp: null,
    };

    const atomic = kv.atomic();
    atomic.check(dirEntry, fileNodeNullCheck);

    if (isPostProcessable(fileNode)) {
      (fileNode as PostProcessedFileNode).postProcess = { status: "PENDING" };
      if (isVideoNode(fileNode)) {
        enqueue<QueueMsgPostProcessVideoNodes>({
          type: "post-process-video-node",
          inodeId: fileNode.id,
          origin,
        }, atomic);
      } else if (isSharpProcessable(fileNode)) {
        (fileNode as PostProcessedFileNode).postProcess.previewType = "image";
      } else if (isLibreProcessable(fileNode)) {
        (fileNode as PostProcessedFileNode).postProcess.previewType = "pdf";
      } else if (isPandocProcessable(fileNode)) {
        (fileNode as PostProcessedFileNode).postProcess.previewType = "html";
      }
    }

    setAnyInode(fileNode, atomic);
    setFileNodeStats({
      fileNode,
      isAdd: true,
      atomic,
    });

    commit = await atomic.commit();
    commitIndex++;
  }
  return fileNode!;
}

export function isValidUploadDirEntry(
  entry: Deno.KvEntryMaybe<Inode>,
  user: User,
): entry is Deno.KvEntry<DirNode> {
  const inode = entry.value;
  return !!inode && inode.type === "dir" && !inode.isRootDir &&
    getPermissions({ user, resource: inode }).canCreate;
}

export function cleanupUnsavedFileNodes(
  uploads: s3.CompletedMultipartUpload[],
  completedUploadIds: string[] = [],
) {
  const s3KeysData = [];
  for (const upload of uploads) {
    if (!completedUploadIds.includes(upload.uploadId)) {
      s3KeysData.push({ name: upload.s3Key });
    }
  }
  if (s3KeysData.length) {
    return enqueue<QueueMsgDeleteS3Objects>({
      type: "delete-s3-objects",
      s3KeysData,
      bucket: INODES_BUCKET,
    }).commit();
  }
}
