import { s3 } from "$aws";
import { getSigner } from "../../util/aws.ts";

export interface QueueMsgDeleteS3Objects {
  type: "delete-s3-objects";
  bucket: string;
  s3KeysData: {
    name: string;
    isPrefix?: boolean;
  }[];
}

export function isDeleteS3Objects(
  msg: unknown,
): msg is QueueMsgDeleteS3Objects {
  const { type, s3KeysData } = msg as Partial<QueueMsgDeleteS3Objects>;
  return typeof msg === "object" &&
    type === "delete-s3-objects" &&
    Array.isArray(s3KeysData) &&
    s3KeysData.every((it) => {
      return typeof it === "object" &&
          typeof it.name === "string" &&
          typeof it.isPrefix === "boolean" ||
        typeof it.isPrefix === "undefined";
    });
}

export async function handleDeleteS3Objects(msg: QueueMsgDeleteS3Objects) {
  const { bucket } = msg;
  const signer = getSigner();
  const s3Keys: string[] = [];

  for (const keyData of msg.s3KeysData) {
    if (keyData.isPrefix) {
      const prefix = keyData.name;
      const keys = await s3.listObjects({ prefix, bucket, signer });
      s3Keys.push(...keys);
    } else {
      s3Keys.push(keyData.name);
    }
  }

  return s3.deleteObjects({ s3Keys, bucket, signer });
}
