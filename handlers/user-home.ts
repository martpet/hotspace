import { htmlResp } from "../utils/html.ts";
import type { Context } from "../utils/types.ts";

export default function userHomeHandler({ req, urlPattern }: Context) {
  const { username } = urlPattern!.exec(req.url)!.hostname.groups;

  return htmlResp(`
    <h1>${username}</h1>
  `);
}
