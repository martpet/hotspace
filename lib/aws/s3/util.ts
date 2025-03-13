import { ACCELERATED_ENDPOINT } from "./consts.ts";

export function getS3Endpoint(bucket: string, accelerated?: boolean) {
  const domain = accelerated ? ACCELERATED_ENDPOINT : "s3.amazonaws.com";
  return `https://${bucket}.${domain}`;
}
