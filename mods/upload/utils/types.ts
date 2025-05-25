import type { s3 } from "$aws";

export interface UploadInitData {
  mimeType: string;
  fileName: string;
  fileSize: number;
  numberOfParts: number;
  savedUpload?: SavedUpload;
}

export interface SavedUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  createdOn: number;
  finishedParts: s3.FinishedUploadPart[];
}
