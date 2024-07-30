import { getCookies } from "cookie";
import type { Context } from "../../lib/app/types.ts";
import {
  REG_SESSION_COOKIE,
  type RegSession,
  verifyRegResponse,
} from "../../utils/webauthn.ts";
import { kv } from "../../utils/db.ts";

export default async function verifyPubKeyCredentialHandler(ctx: Context) {
  const { req, url } = ctx;

  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const regSessionId = getCookies(req.headers)[REG_SESSION_COOKIE];
  const resp401 = new Response(null, { status: 401 });

  if (!regSessionId) {
    return resp401;
  }

  const kvRegSession = await kv.get<RegSession>(["reg_sessions", regSessionId]);

  if (!kvRegSession.value) {
    return resp401;
  }

  const { verified, authData } = await verifyRegResponse({
    credential: await req.json(),
    expectedChallenge: kvRegSession.value.challenge,
    expectedOrigin: url.origin,
    expectedRpId: url.hostname,
  });

  console.log(authData);

  return verified ? new Response() : resp401;
}
