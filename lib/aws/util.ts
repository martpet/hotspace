import { retry } from "@std/async";
import { STATUS_CODE } from "@std/http/status";

export function fetchWithRetry(req: Request) {
  return retry(async () => {
    const resp = await fetch(req);
    if (resp.status === STATUS_CODE.TooManyRequests) {
      throw new Error("Too many requests");
    }
    return resp;
  });
}
