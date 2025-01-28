export interface S3Options {
  bucket: string;
  region: string;
  credentials: AwsCredentials;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface FinishedUploadPart {
  partNumber: number;
  partSize: number;
  etag: string;
}

export interface SavedUpload {
  uploadId: string;
  s3Key: string;
  checksum: string;
  createdOn: number;
  finishedParts: FinishedUploadPart[];
}

export interface UploadInitData {
  fileType: string;
  numberOfParts: number;
  savedUpload?: SavedUpload;
}

export interface UploadInitResult {
  uploadId: string;
  s3Key: string;
  createdOn: number;
  finishedParts: FinishedUploadPart[];
}

export interface UploadCompleteData {
  uploadId: string;
  s3Key: string;
  checksum: string;
  fileName: string;
  finishedParts: FinishedUploadPart[];
}

export interface UploadsCompletedResult {
  completedIds: string[];
  failedIds: string[];
  uploadedSize: number;
}
