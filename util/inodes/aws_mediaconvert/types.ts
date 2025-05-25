export interface JobUserMetaData {
  inodeId: string;
  inodeS3Key: string;
  appUrl: string;
}

interface JobOutputVideoDetails {
  widthInPx: number;
  heightInPx: number;
  averageBitrate: number;
}

export interface MediaConvertJobChangeStateDetail {
  jobId: string;
  timestamp: number;
  status: "STATUS_UPDATE" | "COMPLETE" | "ERROR";
  userMetadata: JobUserMetaData;
  jobProgress?: {
    jobPercentComplete: number;
  };
  outputGroupDetails?: [{
    outputDetails: Array<{
      durationInMs: number;
      videoDetails: JobOutputVideoDetails;
    }>;
  }];
}
