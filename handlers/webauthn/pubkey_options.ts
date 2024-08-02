import { createPubKeyOptions, validateUsername } from "$webauthn";
import { setCookie } from "@std/http";
import { ulid } from "@std/ulid";
import {
  REG_STATUS,
  REG_TIMEOUT,
  USERNAME_CONSTRAINTS,
} from "../../static/webauthn.js";
import { REG_SESSION_COOKIE } from "../../utils/consts.ts";
import { kv, KV_KEYS } from "../../utils/db.ts";
import type { AppContext, RegSession } from "../../utils/types.ts";

export default async function pubkeyOptionsHandler({ req, url }: AppContext) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const { username } = JSON.parse(await req.text());

  if (!validateUsername(username, USERNAME_CONSTRAINTS)) {
    return new Response(null, { status: 400 });
  }

  const kvUser = await kv.get(KV_KEYS.usersByUsername(username));

  if (kvUser.value) {
    return new Response(REG_STATUS.UsernameTaken, { status: 400 });
  }

  const pubKeyOptions = createPubKeyOptions({
    username,
    url,
    timeout: REG_TIMEOUT,
  });

  const regSession: RegSession = {
    id: ulid(),
    username,
    webauthnUserId: pubKeyOptions.user.id,
    challenge: pubKeyOptions.challenge,
  };

  const kvRegSession = await kv.set(
    KV_KEYS.regSessions(regSession.id),
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
