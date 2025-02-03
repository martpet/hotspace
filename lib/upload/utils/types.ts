import type { FinishedUploadPart } from "$aws";

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
  finishedParts: FinishedUploadPart[];
}
