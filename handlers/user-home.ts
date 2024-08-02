import { htmlResp } from "../utils/html.ts";
import type { AppContext } from "../utils/types.ts";

export default function userHomeHandler({ req, urlPattern }: AppContext) {
  const { username } = urlPattern!.exec(req.url)!.hostname.groups;

  return htmlResp(`
    <h1>${username}</h1>
  `);
}
