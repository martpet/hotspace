import type { MediaConvertPricing } from "./types.ts";

interface JobCostInput {
  pricing: MediaConvertPricing;
  outputs: {
    durationInMs: number;
    widthInPx: number;
  }[];
}

export function estimateJobCost(input: JobCostInput) {
  const { outputs, pricing } = input;
  let totalCost = 0;
  for (const { durationInMs, widthInPx } of outputs) {
    const resolution = widthInPx > 3840 ? "4K" : widthInPx > 1280 ? "HD" : "SD";
    const durationInMinutes = durationInMs / 1000 / 60;
    const pricePerMinute = pricing[resolution] + pricing.audio;
    const costPerOutput = durationInMinutes * pricePerMinute;
    totalCost += costPerOutput;
  }
  return totalCost;
}
