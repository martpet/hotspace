import { retry, type RetryOptions } from "@std/async";
import { STATUS_CODE } from "@std/http";

interface Optinos extends RetryOptions {}

export function fetchWithRetry(
  input: Request | string | URL,
  { ...retryOpt }: Optinos = {},
) {
  const fn = async () => {
    const resp = await fetch(input);
    if (resp.status === STATUS_CODE.TooManyRequests) {
      throw new Error("Too many requests, retrying with backoff...");
    }
    return resp;
  };
  return retry(fn, retryOpt);
}
