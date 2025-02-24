import { s3DeleteObject } from "$aws";
import { newQueue } from "@henrygd/queue";
import { getSigner } from "../../aws.ts";

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
  const queue = newQueue(10);

  for (const s3Key of msg.s3Keys) {
    queue.add(() =>
      s3DeleteObject({
        s3Key,
        bucket: msg.bucket,
        signer: getSigner(),
      })
    );
  }

  return queue.done();
}
