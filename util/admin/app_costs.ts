import { setAppCost } from "../kv/app_costs.ts";
import { getAppSettings, patchSettings } from "../kv/app_settings.ts";
import { AppSettings } from "../types.ts";
import { getBudgetsLiveCosts } from "./budgets.ts";

export async function addCost(input: {
  cost: number;
  atomic: Deno.AtomicOperation;
  settingsEntry?: Deno.KvEntryMaybe<AppSettings>;
}) {
  const { cost, atomic } = input;

  setAppCost(cost, atomic);

  const settingsEntry = input.settingsEntry || await getAppSettings("eventual");
  const settings = settingsEntry.value;
  if (!settings?.budgets) return;

  const budgetsLiveCosts = await getBudgetsLiveCosts(settings.budgets);
  let budgetIndex = 0;

  for (const { maxCost, autoDisableUplaod } of settings.budgets) {
    const cost = budgetsLiveCosts[budgetIndex];
    if (cost > maxCost && autoDisableUplaod) {
      await patchSettings(settingsEntry, { isUploadEnabled: false });
      break;
    }
    budgetIndex++;
  }
}
