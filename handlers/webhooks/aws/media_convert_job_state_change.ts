import { enqueue } from "../../../util/kv/enqueue.ts";
import { QueueMsgMediaConvertEvent } from "../../queue/media_convert_event.ts";

interface MediaConvertJobStateChangeEvent {
  source: "aws.mediaconvert";
  "detail-type": "MediaConvert Job State Change";
  detail: {
    status: "COMPLETE" | "ERROR" | "STATUS_UPDATE";
    jobProgress?: {
      jobPercentComplete: number;
    };
    outputGroupDetails?: { outputDetails: { durationInMs: number }[] }[];
    userMetadata: {
      inodeId: string;
      origin: string;
    };
  };
}

export function isMediaConvertJobStateChange(
  event: unknown,
): event is MediaConvertJobStateChangeEvent {
  const { "detail-type": detailType } =
    event as MediaConvertJobStateChangeEvent;
  return typeof event === "object" &&
    detailType === "MediaConvert Job State Change";
}

export function handleMediaConvertJobStateChange(
  event: MediaConvertJobStateChangeEvent,
) {
  const { status } = event.detail;
  const jobPercentComplete = event.detail.jobProgress?.jobPercentComplete;
  const { inodeId, origin } = event.detail.userMetadata;
  const duratonInMs = event.detail.outputGroupDetails?.[0].outputDetails[0]
    .durationInMs;

  return enqueue<QueueMsgMediaConvertEvent>({
    type: "media-convert-event",
    inodeId,
    status,
    origin,
    jobPercentComplete,
    duratonInMs,
  }).commit();
}
