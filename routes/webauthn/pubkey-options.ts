import { setCookie } from "cookie";
import { ulid } from "ulid";
import type { Context } from "../../lib/app/types.ts";
import { kv, kvKeys } from "../../utils/db.ts";
import {
  createPubKeyOptionsJson,
  REG_SESSION_COOKIE,
  type RegSession,
  validateUsername,
} from "../../utils/webauthn.ts";
import {
  REG_STATUS,
  REG_TIMEOUT,
  USERNAME_CONSTRAINTS,
} from "../../static/webauthn.js";

export default async function pubkeyOptionsHandler({ req, url }: Context) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const { username } = JSON.parse(await req.text());

  if (!validateUsername(username, USERNAME_CONSTRAINTS)) {
    return new Response(null, { status: 400 });
  }

  const kvUser = await kv.get(kvKeys.usersByUsername(username));

  if (kvUser.value) {
    return new Response(REG_STATUS.UsernameTaken, { status: 400 });
  }

  const pubKeyOptions = createPubKeyOptionsJson(username, url);

  const regSession: RegSession = {
    id: ulid(),
    username,
    webauthnUserId: pubKeyOptions.user.id,
    challenge: pubKeyOptions.challenge,
  };

  const kvRegSession = await kv.set(
    kvKeys.regSessions(regSession.id),
    regSession,
    { expireIn: REG_TIMEOUT },
  );

  if (!kvRegSession.ok) {
    return new Response(null, { status: 500 });
  }

  const headers = new Headers({
    "content-type": "application/json",
  });

  setCookie(headers, {
    name: REG_SESSION_COOKIE,
    value: regSession.id,
    path: "/",
    maxAge: REG_TIMEOUT / 1000,
    httpOnly: true,
  });

  return new Response(JSON.stringify(pubKeyOptions), { headers });
}
