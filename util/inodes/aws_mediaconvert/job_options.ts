import { INODES_BUCKET, MEDIACONVERT_ROLE } from "../../consts.ts";
import type { JobUserMetaData } from "./types.ts";

export interface JobOptionsInput {
  s3Key: string;
  userMetadata: JobUserMetaData;
}

export function createJobOptions(input: JobOptionsInput) {
  const { s3Key, userMetadata } = input;

  return {
    "UserMetadata": userMetadata,
    "Role": MEDIACONVERT_ROLE,
    "Settings": {
      "TimecodeConfig": {
        "Source": "ZEROBASED",
      },
      "OutputGroups": [
        {
          "Name": "Apple HLS",
          "Outputs": [
            {
              "ContainerSettings": {
                "Container": "M3U8",
                "M3u8Settings": {},
              },
              "VideoDescription": {
                "CodecSettings": {
                  "Codec": "H_264",
                  "H264Settings": {
                    "FramerateControl": "INITIALIZE_FROM_SOURCE",
                    "RateControlMode": "QVBR",
                    "SceneChangeDetect": "TRANSITION_DETECTION",
                    "QualityTuningLevel": "MULTI_PASS_HQ",
                  },
                },
              },
              "AudioDescriptions": [
                {
                  "CodecSettings": {
                    "Codec": "AAC",
                    "AacSettings": {
                      "Bitrate": 96000,
                      "CodingMode": "CODING_MODE_2_0",
                      "SampleRate": 48000,
                    },
                  },
                },
              ],
              "OutputSettings": {
                "HlsSettings": {},
              },
              "NameModifier": "/hls/",
            },
          ],
          "OutputGroupSettings": {
            "Type": "HLS_GROUP_SETTINGS",
            "HlsGroupSettings": {
              "SegmentLength": 10,
              "Destination": `s3://${INODES_BUCKET}/`,
              "MinSegmentLength": 0,
              "SegmentControl": "SINGLE_FILE",
            },
          },
          "AutomatedEncodingSettings": {
            "AbrSettings": {
              "MaxRenditions": 3,
              "MaxAbrBitrate": 50_000_000,
            },
          },
        },
      ],
      "FollowSource": 1,
      "Inputs": [
        {
          "AudioSelectors": {
            "Audio Selector 1": {
              "DefaultSelection": "DEFAULT",
            },
          },
          "VideoSelector": {},
          "TimecodeSource": "ZEROBASED",
          "FileInput": `s3://${INODES_BUCKET}/${s3Key}`,
        },
      ],
    },
    "BillingTagsSource": "JOB",
    "AccelerationSettings": {
      "Mode": "PREFERRED",
    },
    "StatusUpdateInterval": "SECONDS_10",
    "Priority": 0,
  };
}
