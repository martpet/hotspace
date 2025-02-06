import { s3DeleteObject } from "$aws";
import { newQueue } from "@henrygd/queue";
import { AWS_CREDENTIALS, AWS_REGION } from "../../consts.ts";

export interface QueueMsgDeleteS3Objects {
  type: "delete-s3-objects";
  s3Keys: string[];
  bucket: string;
}

export function isDeleteS3Objects(
  msg: unknown,
): msg is QueueMsgDeleteS3Objects {
  const { type, s3Keys } = msg as Partial<QueueMsgDeleteS3Objects>;
  return typeof msg === "object" &&
    type === "delete-s3-objects" &&
    Array.isArray(s3Keys) && s3Keys.every((k) => typeof k === "string");
}

export function handleDeleteS3Objects(msg: QueueMsgDeleteS3Objects) {
  const { s3Keys, bucket } = msg;

  const queue = newQueue(10);

  s3Keys.forEach((s3Key) =>
    queue.add(() =>
      s3DeleteObject({
        s3Key,
        bucket,
        credentials: AWS_CREDENTIALS,
        region: AWS_REGION,
      })
    )
  );

  return queue.done();
}
