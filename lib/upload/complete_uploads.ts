import { newQueue } from "@henrygd/queue";
import { completeMultipartUpload } from "./utils/s3_api/complete_multipart_upload.ts";
import deleteObject from "./utils/s3_api/delete_object.ts";
import headObject from "./utils/s3_api/head_object.ts";
import type {
  S3Options,
  UploadCompleteData,
  UploadsCompletedResult,
} from "./utils/types.ts";

interface Options extends S3Options {
  uploads: UploadCompleteData[];
}

export async function completeUploads(
  options: Options,
): Promise<UploadsCompletedResult> {
  const { uploads, ...s3Opt } = options;
  const queue = newQueue(10);
  const completedIds: string[] = [];
  const failedIds: string[] = [];
  let uploadedSize = 0;

  for (const upload of uploads) {
    const { s3Key } = upload;
    queue.add(async () => {
      try {
        await completeMultipartUpload({ ...upload, ...s3Opt });
        const objHeaders = await headObject({ s3Key, ...s3Opt }).catch(
          async (err) => {
            await deleteObject({ s3Key, ...s3Opt });
            throw err;
          },
        );
        completedIds.push(upload.uploadId);
        uploadedSize += Number(objHeaders["content-length"]);
      } catch (err) {
        console.error(err);
        failedIds.push(upload.uploadId);
      }
    });
  }

  await queue.done();

  return {
    completedIds,
    failedIds,
    uploadedSize,
  };
}
