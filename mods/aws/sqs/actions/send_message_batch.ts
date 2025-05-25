import { fetchWithRetry } from "$util";
import { newQueue } from "@henrygd/queue";
import { chunk } from "@std/collections";
import { HEADER } from "@std/http/unstable-header";
import type { AwsActionBase } from "../../types.ts";
import type { SqsMessageEntry } from "../types.ts";
import { getSqsBaseUrl } from "../util.ts";

interface Options extends AwsActionBase {
  messages: { body: string; id?: string }[];
  sqsUrl: string;
  region: string;
}

export async function sendMessageBatch(options: Options) {
  const { messages, sqsUrl, region, signer, retryOpt } = options;
  const url = getSqsBaseUrl(region);
  const queue = newQueue(5);
  const chunks = chunk(messages, 10);
  const failedIds: string[] = [];

  const results = await Promise.all(chunks.map((messages) => {
    const sqsEntries = messages.map((msg) => ({
      Id: msg.id || crypto.randomUUID(),
      MessageBody: msg.body,
    }));
    return send(sqsEntries);
  }));

  for (const result of results) {
    failedIds.push(...result.failedIds);
  }

  return failedIds;

  function send(
    sqsEntries: SqsMessageEntry[],
    retryCount = 0,
  ): Promise<{ failedIds: string[] }> {
    return queue.add(async () => {
      const req = new Request(url, {
        method: "post",
        body: JSON.stringify({
          QueueUrl: sqsUrl,
          Entries: sqsEntries,
        }),
        headers: {
          [HEADER.ContentType]: "application/x-amz-json-1.0",
          "X-Amz-Target": "AmazonSQS.SendMessageBatch",
        },
      });

      const signedReq = await signer.sign("sqs", req);
      const resp = await fetchWithRetry(signedReq, retryOpt);

      if (!resp.ok) {
        const respText = await resp.text();
        throw new Error(respText);
      }

      const respData = await resp.json();
      const failedSqsEntries = [];
      const failedIds = [];

      for (const { Id } of respData.Failed || []) {
        const entry = sqsEntries.find((it) => it.Id === Id);
        if (entry) failedSqsEntries.push(entry);
        failedIds.push(Id);
      }

      if (failedSqsEntries.length && retryCount < 3) {
        return send(failedSqsEntries, ++retryCount);
      }

      return { failedIds };
    });
  }
}
