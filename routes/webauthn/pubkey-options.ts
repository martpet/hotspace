import { setCookie } from "cookie";
import { ulid } from "ulid";
import type { Context } from "../../lib/app/types.ts";
import {
  createPubKeyOptions,
  REG_SESSION_COOKIE,
  REG_TIMEOUT,
  type RegSession,
  RegStatus,
  validateUsername,
} from "../../utils/webauthn.ts";
import { kv } from "../../utils/db.ts";

export default async function pubkeyOptionsHandler({ req }: Context) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const { username } = JSON.parse(await req.text());

  if (!validateUsername(username)) {
    return new Response(null, { status: 400 });
  }

  const existingUser = await kv.get(["users_by_username"], username);

  if (existingUser.value) {
    const error = { error: RegStatus.UsernameTaken };
    return new Response(JSON.stringify(error), { status: 400 });
  }

  const pubKeyOptions = createPubKeyOptions(username);

  const regSession: RegSession = {
    id: ulid(),
    username,
    webauthnUserId: pubKeyOptions.user.id,
    challenge: pubKeyOptions.challenge,
  };

  const kvRegSession = await kv.set(
    ["reg_sessions", regSession.id],
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
