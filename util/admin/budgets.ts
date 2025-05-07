import { listAppCostsEntriesInCents } from "../kv/app_costs.ts";
import type { AppBudget } from "../types.ts";

export async function getBudgetsLiveCosts(
  budgets: AppBudget[],
  opt: { consistency?: Deno.KvConsistencyLevel } = {},
): Promise<number[]> {
  const now = Date.now();
  const consistency = opt.consistency || "eventual";

  const parsedBudgets: {
    startDate: Date;
    liveCost: number;
  }[] = [];

  let oldestStartDate: Date | undefined;

  for (const { period, periodType } of budgets) {
    const startDate = new Date(now);
    if (periodType === "days") {
      startDate.setDate(startDate.getDate() - period);
    } else {
      startDate.setHours(startDate.getHours() - period);
    }
    if (!oldestStartDate || oldestStartDate > startDate) {
      oldestStartDate = startDate;
    }
    parsedBudgets.push({
      startDate,
      liveCost: 0,
    });
  }

  if (!oldestStartDate) return [];

  const costsEntries = await listAppCostsEntriesInCents({
    startDate: oldestStartDate,
    listOptions: { consistency, reverse: true },
  });

  budgetsLoop: for (const budget of parsedBudgets) {
    for (const entry of costsEntries) {
      const [_, year, month, day, hours] = entry.key;
      const entryDate = new Date(now);
      entryDate.setUTCFullYear(year as number);
      entryDate.setUTCMonth(month as number);
      entryDate.setUTCDate(day as number);
      entryDate.setUTCHours(hours as number);
      if (budget.startDate > entryDate) {
        continue budgetsLoop;
      }
      budget.liveCost += Number(entry.value) / 100;
    }
  }

  return parsedBudgets.map(({ liveCost }) => liveCost);
}
