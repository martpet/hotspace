import { fetchWithRetry } from "$util";
import { mapEntries } from "@std/collections";
import { setPasskeysAaguidData } from "../kv/passkeys.ts";

export default async function fetchPasskeysAaguid() {
  const URL =
    "https://passkeydeveloper.github.io/passkey-authenticator-aaguids/aaguid.json";

  const resp = await fetchWithRetry(URL);

  if (!resp.ok) {
    throw new Error(`Error fetching Passkeys Aaguid. Status: ${resp.status}`);
  }

  const respData = await resp.json() as Record<string, { name: string }>;
  const namesById = mapEntries(respData, ([id, { name }]) => [id, name]);

  await setPasskeysAaguidData(namesById);
}
