import { newQueue } from "@henrygd/queue";
import deleteObject from "../../../lib/upload/utils/s3_api/delete_object.ts";
import { AWS_CREDENTIALS, AWS_REGION } from "../../consts.ts";
import { enqueue } from "../enqueue.ts";

export interface DeleteS3ObjectsQueueMsg {
  type: "delete-s3-objects";
  s3Keys: string[];
  bucket: string;
}

export function enqueueDeleteS3Objects(
  s3Keys: string[],
  bucket: string,
  atomic?: Deno.AtomicOperation,
) {
  const msg: Omit<DeleteS3ObjectsQueueMsg, "nonce"> = {
    type: "delete-s3-objects",
    s3Keys,
    bucket,
  };
  return enqueue(msg, atomic);
}

export function isDeleteS3Objects(
  msg: unknown,
): msg is DeleteS3ObjectsQueueMsg {
  const { type, s3Keys } = msg as Partial<DeleteS3ObjectsQueueMsg>;
  return typeof msg === "object" &&
    type === "delete-s3-objects" &&
    Array.isArray(s3Keys) && s3Keys.every((k) => typeof k === "string");
}

export function handleDeleteS3Objects(msg: DeleteS3ObjectsQueueMsg) {
  const { s3Keys, bucket } = msg;
  const queue = newQueue(10);

  s3Keys.forEach((s3Key) =>
    queue.add(() =>
      deleteObject({
        s3Key,
        bucket,
        credentials: AWS_CREDENTIALS,
        region: AWS_REGION,
      })
    )
  );

  return queue.done();
}
