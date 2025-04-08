import type { s3 } from "$aws";

export interface UploadInitData {
  fileType: string;
  fileName: string;
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
