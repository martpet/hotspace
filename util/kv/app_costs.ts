import { kv, toKvSumBigInt } from "./kv.ts";

export const keys = {
  hourly_costs: (
    input: {
      year: number;
      month: number;
      day: number;
      hours: number;
    },
  ) => ["app_costs", input.year, input.month, input.day, input.hours],
};

export function setAppCost(
  costInDollars: number,
  atomic = kv.atomic(),
) {
  const date = new Date();
  const kvKey = keys.hourly_costs({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
  });
  const costInCents = Math.round(costInDollars * 100);
  atomic.sum(kvKey, toKvSumBigInt(costInCents));
  return atomic.commit();
}

export function listAppCostsEntriesInCents(input: {
  startDate: Date;
  endDate?: Date;
  listOptions?: Deno.KvListOptions;
}) {
  const { startDate, endDate, listOptions } = input;
  let iter;

  const start = keys.hourly_costs({
    year: startDate.getUTCFullYear(),
    month: startDate.getUTCMonth(),
    day: startDate.getUTCDate(),
    hours: startDate.getUTCHours(),
  });

  if (endDate) {
    const end = keys.hourly_costs({
      year: endDate.getUTCFullYear(),
      month: endDate.getUTCMonth(),
      day: endDate.getUTCDate(),
      hours: startDate.getUTCHours() + 1,
    });
    iter = kv.list<bigint>({ start, end }, listOptions);
  } else {
    const prefix = start.slice(0, 1);
    iter = kv.list<bigint>({ prefix, start }, listOptions);
  }

  return Array.fromAsync(iter);
}
