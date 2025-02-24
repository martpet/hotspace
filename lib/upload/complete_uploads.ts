import { s3 } from "$aws";
import { newQueue } from "@henrygd/queue";

interface Options extends s3.S3ReqOptions {
  uploads: s3.CompletedUpload[];
}

export async function completeUploads(
  options: Options,
) {
  const queue = newQueue(10);
  const { uploads, ...s3Opt } = options;
  const completedUploads: ({ fileSize: number } & s3.CompletedUpload)[] = [];
  const failedUploads: s3.CompletedUpload[] = [];

  for (const upload of uploads) {
    const { s3Key } = upload;
    queue.add(async () => {
      try {
        await s3.completeMultipartUpload({ ...upload, ...s3Opt });
        const objHeaders = await s3.headObject({ s3Key, ...s3Opt }).catch(
          async (err) => {
            await s3.deleteObject({ s3Key, ...s3Opt });
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
