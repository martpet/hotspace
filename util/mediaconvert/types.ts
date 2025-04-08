export interface MediaConvertPricing {
  SD: number;
  HD: number;
  "4K": number;
  audio: number;
}

export interface JobUserMetaData {
  "inodeId": string;
  "origin": string;
  "devUrl": string;
}

interface JobOutputVideoDetails {
  widthInPx: number;
  heightInPx: number;
  averageBitrate: number;
}

export interface MediaConvertJobChangeStateDetail {
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
