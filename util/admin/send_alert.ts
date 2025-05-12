import { sns } from "$aws";
import { getSigner } from "../aws.ts";
import { ADMIN_ALERT_TOPIC_ARN, AWS_REGION } from "../consts.ts";

export default function sendAdminAlert(message: string) {
  return sns.Publish({
    topicArn: ADMIN_ALERT_TOPIC_ARN,
    message,
    signer: getSigner(),
    region: AWS_REGION,
  });
}
