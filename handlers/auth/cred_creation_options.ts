import type { FormFieldConstraints } from "$util";
import {
  createCredentialCreationOptions,
  CREDENTIAL_CREATION_SESSION_COOKIE,
  WEBAUTHN_TIMEOUT,
} from "$webauthn";
import { setCookie, STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { USERNAME_CONSTRAINTS } from "../../util/constraints.ts";
import { setCredentialCreationSession } from "../../util/kv/cred_creation_sessions.ts";
import { listPasskeysByUser } from "../../util/kv/passkeys.ts";
import { getUserByUsername } from "../../util/kv/users.ts";
import { reservedWords } from "../../util/reserved_words.ts";
import type {
  AppContext,
  CredentialCreationSession,
} from "../../util/types.ts";

export default async function credentialCreationOptionsHandler(
  ctx: AppContext,
) {
  const excludeCredentials: string[] = [];
  const user = ctx.state.user;
  let username = await ctx.req.text(); // for new account

  if (user) {
    username = user.username;
    const passkeys = await listPasskeysByUser(user.id);
    passkeys.forEach((pass) => excludeCredentials.push(pass.credId));
  } else if (!username) { // maybe session expired
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  } else if (!validateUsername(username, USERNAME_CONSTRAINTS)) {
    return ctx.respond("Invalid username", STATUS_CODE.BadRequest);
  } else if (reservedWords.includes(username)) {
    return ctx.respond(
      `Username '${username}' is not available`,
      STATUS_CODE.Conflict,
    );
  } else if ((await getUserByUsername(username)).value) {
    return ctx.respond(
      `Username '${username}' is taken`,
      STATUS_CODE.Conflict,
    );
  }

  const webauthnUserId = user?.webauthnUserId || crypto.randomUUID();

  const credCreationOptions = createCredentialCreationOptions({
    rpId: ctx.url.hostname,
    rpName: "HotSpace",
    userName: username,
    userDisplayName: username,
    webauthnUserId,
    excludeCredentials,
  });

  const creationSession: CredentialCreationSession = {
    id: ulid(),
    username,
    webauthnUserId,
    challenge: credCreationOptions.challenge,
  };

  const { ok } = await setCredentialCreationSession(creationSession);

  if (!ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  setCookie(ctx.resp.headers, {
    name: CREDENTIAL_CREATION_SESSION_COOKIE,
    value: creationSession.id,
    maxAge: WEBAUTHN_TIMEOUT / 1000,
    secure: !ctx.isLocalhostSafari,
    path: "/",
    httpOnly: true,
  });

  return ctx.json(credCreationOptions);
}

function validateUsername(
  username: string,
  constraints: Required<FormFieldConstraints>,
) {
  const { minLength, maxLength, pattern } = constraints;
  return username.length >= minLength &&
    username.length <= maxLength &&
    new RegExp(pattern).test(username);
}