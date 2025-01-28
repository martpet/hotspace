import { newQueue } from "@henrygd/queue";
import { DAY } from "@std/datetime";
import { getSignatureKey, getSignedUrl } from "aws_s3_presign";
import { createMultipartUpload } from "./utils/s3_api/create_multipart_upload.ts";
import type {
  FinishedUploadPart,
  S3Options,
  SavedUpload,
  UploadInitData,
  UploadInitResult,
} from "./utils/types.ts";

const QUEUE_CONCURRENCY = 10;
const DEFAULT_SIGNED_URL_EXPIRES_IN = DAY / 1000;

interface Options extends S3Options {
  uploadsInitData: UploadInitData[];
  savedUploadExpiresIn: number;
  signedUrlExpiresIn?: number;
}

export async function initUploads(
  options: Options,
): Promise<{
  uploads: UploadInitResult[];
  signedUrls: string[];
  uploadedSize: number;
}> {
  const {
    uploadsInitData,
    region,
    bucket,
    credentials,
    savedUploadExpiresIn,
    signedUrlExpiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
  } = options;
  const { accessKeyId, secretAccessKey } = credentials;
  const signatureKey = getSignatureKey({
    date: new Date(),
    region,
    secretAccessKey,
  });
  const queue = newQueue(QUEUE_CONCURRENCY);
  const signedUrls: string[] = [];
  let uploadedSize = 0;

  const uploads = await Promise.all(
    uploadsInitData.map((item) =>
      queue.add(async () => {
        const { fileType, numberOfParts, savedUpload } = item;
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
            fileType,
            region,
            bucket,
            credentials,
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
    uploads,
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
