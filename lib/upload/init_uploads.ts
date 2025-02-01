import { newQueue } from "@henrygd/queue";
import { DAY } from "@std/datetime";
import { getSignatureKey, getSignedUrl } from "aws_s3_presign";
import { createMultipartUpload } from "./utils/s3_api/create_multipart_upload.ts";
import type {
  FinishedUploadPart,
  S3Options,
  SavedUpload,
  UploadInitData,
} from "./utils/types.ts";

const QUEUE_CONCURRENCY = 10;
const DEFAULT_SIGNED_URL_EXPIRES_IN = DAY / 1000;

interface Options extends S3Options {
  uploads: UploadInitData[];
  savedUploadExpiresIn: number;
  signedUrlExpiresIn?: number;
  s3Endpoint?: string;
  headersFn?: (u: UploadInitData) => Headers;
}

export async function initUploads(options: Options) {
  const {
    uploads,
    region,
    bucket,
    credentials,
    savedUploadExpiresIn,
    signedUrlExpiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
    s3Endpoint,
    headersFn,
  } = options;

  const signedUrls: string[] = [];
  let uploadedSize = 0;

  const { accessKeyId, secretAccessKey } = credentials;
  const queue = newQueue(QUEUE_CONCURRENCY);

  const signatureKey = getSignatureKey({
    date: new Date(),
    region,
    secretAccessKey,
  });

  const uploadsResult = await Promise.all(
    uploads.map((uplaod) =>
      queue.add(async () => {
        const { numberOfParts, savedUpload } = uplaod;
        const finishedPartsNumbers = [];
        let uploadId;
        let s3Key;
        let createdOn;
        let finishedParts: FinishedUploadPart[];

        if (isValidSavedUpload(savedUpload, savedUploadExpiresIn)) {
          ({ uploadId, s3Key, createdOn, finishedParts } = savedUpload);
          for (const { partSize, partNumber } of finishedParts) {
            uploadedSize += partSize;
            finishedPartsNumbers.push(partNumber);
          }
        } else {
          s3Key = crypto.randomUUID();
          uploadId = await createMultipartUpload({
            s3Key,
            region,
            bucket,
            credentials,
            headers: headersFn?.(uplaod),
          });
          finishedParts = [];
          createdOn = Date.now();
        }

        for (let partNumber = 1; partNumber <= numberOfParts; partNumber++) {
          if (!finishedPartsNumbers.includes(partNumber)) {
            signedUrls.push(getSignedUrl({
              region,
              bucket,
              accessKeyId,
              secretAccessKey,
              signatureKey,
              ...(s3Endpoint && { endpoint: s3Endpoint }),
              key: s3Key,
              expiresIn: signedUrlExpiresIn,
              method: "PUT",
              queryParams: {
                uploadId,
                partNumber,
              },
            }));
          }
        }

        return {
          uploadId,
          s3Key,
          createdOn,
          finishedParts,
        };
      })
    ),
  );

  return {
    uploadsResult,
    signedUrls,
    uploadedSize,
  };
}

function isValidSavedUpload(
  upload: SavedUpload | undefined,
  savedUploadExpiresIn: number,
): upload is SavedUpload {
  return typeof upload !== "undefined" &&
    Date.now() - upload.createdOn < savedUploadExpiresIn;
}
