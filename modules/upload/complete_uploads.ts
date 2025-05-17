import { s3 } from "$aws";
import { newQueue } from "@henrygd/queue";
import { CompletedUpload } from "../aws/s3/types.ts";

interface Options extends Pick<s3.S3ReqOptions, "bucket" | "signer"> {
  uploads: s3.CompleteMultipartInit[];
}

export async function completeMultipartUploads(
  options: Options,
) {
  const queue = newQueue(10);
  const { uploads, ...s3Opt } = options;
  const completedUploads: CompletedUpload[] = [];

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
      }
    });
  }

  await queue.done();

  return completedUploads;
}
