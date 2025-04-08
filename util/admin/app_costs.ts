import { setAppCost } from "../kv/app_costs.ts";
import { getAppSettings, patchSettings } from "../kv/app_settings.ts";
import { AppSettings } from "../types.ts";
import { getBudgetsLiveCosts } from "./budgets.ts";

export async function addCost(input: {
  cost: number;
  settingsEntry?: Deno.KvEntryMaybe<AppSettings>;
}) {
  const { cost } = input;
  await setAppCost(cost);

  const settingsEntry = input.settingsEntry || await getAppSettings("eventual");
  const settings = settingsEntry.value;
  if (!settings?.budgets) return;

  const budgetsLiveCosts = await getBudgetsLiveCosts(settings.budgets);
  let budgetIndex = 0;

  for (const { maxCost, autoDisableUplaod } of settings.budgets) {
    const liveCost = budgetsLiveCosts[budgetIndex];
    if (liveCost > maxCost && autoDisableUplaod) {
      await patchSettings(settingsEntry, { isUploadEnabled: false });
      break;
    }
    budgetIndex++;
  }
}
