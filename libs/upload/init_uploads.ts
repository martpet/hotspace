import { type AwsCredentials, s3 } from "$aws";
import { newQueue } from "@henrygd/queue";
import { DAY } from "@std/datetime";
import { getSignatureKey, getSignedUrl } from "aws_s3_presign";
import { AWSSignerV4 } from "deno_aws_sign_v4";
import type { SavedUpload, UploadInitData } from "./utils/types.ts";

const QUEUE_CONCURRENCY = 10;
const DEFAULT_SIGNED_URL_EXPIRES_IN = DAY / 1000;

interface Options {
  uploadsInitData: UploadInitData[];
  region: string;
  bucket: string;
  credentials: AwsCredentials;
  signer: AWSSignerV4;
  savedUploadExpiresIn: number;
  signedUrlExpiresIn?: number;
  s3Endpoint?: string;
  headersFn?: (u: UploadInitData) => Headers;
}

export async function initUploads(options: Options) {
  const {
    uploadsInitData,
    region,
    bucket,
    credentials,
    signer,
    savedUploadExpiresIn,
    signedUrlExpiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
    s3Endpoint,
    headersFn,
  } = options;

  const signedUrls: string[] = [];
  let uploadedSize = 0;

  const queue = newQueue(QUEUE_CONCURRENCY);
  const { accessKeyId, secretAccessKey } = credentials;

  const signatureKey = getSignatureKey({
    date: new Date(),
    region,
    secretAccessKey,
  });

  const uploadsResult = await Promise.all(
    uploadsInitData.map((uplaod) =>
      queue.add(async () => {
        const { numberOfParts, savedUpload } = uplaod;
        const finishedPartsNumbers = [];
        let uploadId;
        let s3Key;
        let createdOn;
        let finishedParts: s3.FinishedUploadPart[];

        if (isValidSavedUpload(savedUpload, savedUploadExpiresIn)) {
          ({ uploadId, s3Key, createdOn, finishedParts } = savedUpload);
          for (const { partSize, partNumber } of finishedParts) {
            uploadedSize += partSize;
            finishedPartsNumbers.push(partNumber);
          }
        } else {
          s3Key = crypto.randomUUID();
          uploadId = await s3.createMultipartUpload({
            s3Key,
            bucket,
            signer,
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
