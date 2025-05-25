import {
  createCredentialRequestOptions,
  CREDENTIAL_REQUEST_SESSION_COOKIE,
  WEBAUTHN_TIMEOUT,
} from "$webauthn";
import { setCookie } from "@std/http";
import type { AppContext } from "../../util/types.ts";

export default function credentialRequestOptionsHandler(ctx: AppContext) {
  const credRequestOptions = createCredentialRequestOptions({
    rpId: ctx.url.hostname,
  });

  setCookie(ctx.resp.headers, {
    name: CREDENTIAL_REQUEST_SESSION_COOKIE,
    value: credRequestOptions.challenge,
    maxAge: WEBAUTHN_TIMEOUT / 1000,
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "Strict",
  });

  return ctx.respondJson(credRequestOptions);
}
