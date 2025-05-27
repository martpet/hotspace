import { sns } from "$aws";
import { getSigner } from "../aws.ts";
import {
  ADMIN_EMAIL_ALERT_TOPIC,
  ADMIN_SMS_ALERT_TOPIC,
  AWS_REGION,
} from "../consts.ts";

export interface QueueMsgAdminAlert {
  type: "admin-alert";
  message: string;
  isSms?: boolean;
  emailSubject?: string;
}

export function isAdminAlert(
  msg: unknown,
): msg is QueueMsgAdminAlert {
  const { type, message, isSms, emailSubject } = msg as Partial<
    QueueMsgAdminAlert
  >;
  return typeof msg === "object" &&
    type === "admin-alert" &&
    typeof message === "string" &&
    (typeof isSms === "boolean" || typeof isSms === "undefined") &&
    (typeof emailSubject === "string" || typeof emailSubject === "undefined");
}

export function handleAdminAlert(msg: QueueMsgAdminAlert) {
  const { message, isSms, emailSubject } = msg;

  return sns.publish({
    signer: getSigner(),
    topicArn: isSms ? ADMIN_SMS_ALERT_TOPIC : ADMIN_EMAIL_ALERT_TOPIC,
    region: AWS_REGION,
    message,
    emailSubject,
  });
}
