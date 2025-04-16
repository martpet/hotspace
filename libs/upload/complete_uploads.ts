import { s3 } from "$aws";
import { newQueue } from "@henrygd/queue";

interface Options extends Pick<s3.S3ReqOptions, "bucket" | "signer"> {
  uploads: s3.CompletedMultipartUpload[];
}

export async function completeUploads(
  options: Options,
) {
  const queue = newQueue(10);
  const { uploads, ...s3Opt } = options;
  const completedUploads:
    ({ fileSize: number } & s3.CompletedMultipartUpload)[] = [];
  const failedUploads: s3.CompletedMultipartUpload[] = [];

  for (const upload of uploads) {
    const { s3Key } = upload;
    queue.add(async () => {
      try {
        await s3.completeMultipartUpload({ ...upload, ...s3Opt });
        const objResp = await s3.headObject({ s3Key, ...s3Opt })
          .catch(
            async (err) => {
              await s3.deleteObject({ s3Key, ...s3Opt });
              throw err;
            },
          );
        const fileSize = Number(objResp.headers.get("content-length"));
        completedUploads.push({ fileSize, ...upload });
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
