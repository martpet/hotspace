import { setCookie } from "cookie";
import { ulid } from "ulid";
import type { Context } from "../../lib/app/types.ts";
import {
  createPubKeyOptionsJson,
  REG_SESSION_COOKIE,
  REG_TIMEOUT,
  type RegSession,
  validateUsername,
} from "../../utils/webauthn.ts";
import { kv } from "../../utils/db.ts";

export default async function pubkeyOptions({ req }: Context) {
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const { username } = JSON.parse(await req.text());

  if (!validateUsername(username)) {
    return new Response(null, { status: 400 });
  }

  const existingUserEntry = await kv.get(["users_by_username"], username);

  if (existingUserEntry.value) {
    // todo: add specific error text for handling existing user in frontend
    return new Response("todo", { status: 400 });
  }

  const options = createPubKeyOptionsJson(username);

  const regSession: RegSession = {
    id: ulid(),
    username,
    webauthnUserId: options.user.id,
    challenge: options.challenge,
  };

  const kvSessionResult = await kv.set(
    ["reg_sessions", regSession.id],
    regSession,
    { expireIn: REG_TIMEOUT },
  );

  if (!kvSessionResult.ok) {
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

  return new Response(JSON.stringify(options), { headers });
}
