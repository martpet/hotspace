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
import { setAnyInode } from "./kv_wrappers.ts";
import { MIME_CONFS } from "./mime.ts";
import { isPostProcessedFileNode } from "./post_process/type_predicates.ts";
import type { CustomPostProcessor } from "./post_process/types.ts";
import type {
  DirNode,
  FileNode,
  Inode,
  PostProcessedFileNode,
} from "./types.ts";

interface CompletedUploadWithFileSize extends s3.CompletedMultipartUpload {
  fileSize: number;
}

interface CreatFileNodesFromUploadsOptions {
  dirEntry: Deno.KvEntryMaybe<Inode>;
  dirId: string;
  user: User;
  origin: string;
}

export async function createFileNodesFromUploads(
  uploads: CompletedUploadWithFileSize[],
  options: CreatFileNodesFromUploadsOptions,
) {
  const completedUploadIds = [];
  const processables: PostProcessedFileNode[] = [];

  for (const upload of uploads) {
    const inode = await createFileNode(upload, options);

    if (!inode) {
      await cleanupUnsavedFileNodes(uploads, completedUploadIds);
      break;
    }

    completedUploadIds.push(upload.uploadId);

    if (
      isPostProcessedFileNode(inode) &&
      inode.postProcess.proc !== "aws_mediaconvert"
    ) {
      processables.push(inode);
    }
  }

  const processablesByProc = Object.groupBy(
    processables,
    (it) => it.postProcess.proc,
  );

  for (const [proc, inodes] of Object.entries(processablesByProc)) {
    if (inodes.length) {
      await enqueue<QueueMsgPostProcessFileNodes>({
        type: "post-process-file-nodes",
        proc: proc as CustomPostProcessor,
        origin: options.origin,
        items: inodes.map((it) =>
          pick(it, ["id", "s3Key", "name", "mimeType"])
        ),
      }).commit();
    }
  }

  return completedUploadIds;
}

async function createFileNode(
  upload: CompletedUploadWithFileSize,
  options: CreatFileNodesFromUploadsOptions,
) {
  const { dirId, user, origin } = options;
  let dirEntry = options.dirEntry;
  let commit = { ok: false };
  let commitIndex = 0;
  let inode: FileNode;

  while (!commit.ok) {
    let fileNodeName = encodeURIComponent(upload.fileName);

    if (commitIndex) {
      fileNodeName += `-${commitIndex + 1}`;
      dirEntry = await getInodeById(dirId);
    }

    if (!isValidUploadDirEntry(dirEntry, user)) {
      return;
    }

    inode = {
      id: ulid(),
      type: "file",
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      s3Key: upload.s3Key,
      name: fileNodeName,
      parentDirId: dirId,
      ownerId: user.id,
      acl: dirEntry.value.acl,
      aclStats: dirEntry.value.aclStats,
    };

    const fileNodeNullCheck = {
      key: inodesKeys.byDir(dirEntry.value.id, inode.name),
      versionstamp: null,
    };

    const atomic = kv.atomic();
    atomic.check(dirEntry, fileNodeNullCheck);

    const mimeConf = MIME_CONFS[inode.mimeType];

    if (mimeConf?.proc) {
      inode.postProcess = {
        proc: mimeConf.proc,
        status: "PENDING",
      };

      if (mimeConf.to) {
        inode.postProcess.previewMimeType = mimeConf.to;
      }

      if (mimeConf.proc === "aws_mediaconvert") {
        enqueue<QueueMsgPostProcessVideoNodes>({
          type: "post-process-video-node",
          inodeId: inode.id,
          origin,
        }, atomic);
      }
    }

    setAnyInode(inode, atomic);
    setFileNodeStats({
      fileNode: inode,
      isAdd: true,
      atomic,
    });

    commit = await atomic.commit();
    commitIndex++;
  }
  return inode!;
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
