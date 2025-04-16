import { fetchWithRetry } from "$util";
import { mapValues } from "@std/collections";
import { setPasskeysAaguidData } from "../kv/passkeys.ts";

export default async function fetchPasskeysAaguid() {
  const url =
    "https://passkeydeveloper.github.io/passkey-authenticator-aaguids/aaguid.json";

  const resp = await fetchWithRetry(url);

  if (!resp.ok) {
    throw new Error(`Error fetching ${url} (status: ${resp.status})`);
  }

  const data = await resp.json() as Record<string, { name: string }>;
  const namesById = mapValues(data, (it) => it.name);

  await setPasskeysAaguidData(namesById);
}
