import {
  type CompletedUpload,
  completeMultipartUpload,
  deleteObject,
  headObject,
  type S3Options,
} from "$aws";
import { newQueue } from "@henrygd/queue";

interface Options extends S3Options {
  uploads: CompletedUpload[];
}

export async function completeUploads(
  options: Options,
) {
  const queue = newQueue(10);
  const { uploads, ...s3Opt } = options;
  const completedUploads: ({ fileSize: number } & CompletedUpload)[] = [];
  const failedUploads: CompletedUpload[] = [];

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
        completedUploads.push({
          fileSize: Number(objHeaders["content-length"]),
          ...upload,
        });
      } catch (err) {
        console.error(err);
        failedUploads.push(upload);
      }
    });
  }

  await queue.done();

  return {
    completedUploads,
    failedUploads,
  };
}
