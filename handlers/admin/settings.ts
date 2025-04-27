import { UnknownValues } from "$util";
import { STATUS_CODE } from "@std/http";
import { isSuperAdmin } from "../../util/admin/utils.ts";
import { BUDGET_PERIOD_TYPES } from "../../util/consts.ts";
import { extractFormDataArray } from "../../util/form.ts";
import type { MediaConvertPricing } from "../../util/inodes/mediaconvert/types.ts";
import { setAppSettings } from "../../util/kv/app_settings.ts";
import type { AppBudget, AppContext, AppSettings } from "../../util/types.ts";

export default async function postSettingsHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!isSuperAdmin(user)) {
    return ctx.respond(null, STATUS_CODE.NotFound);
  }

  const formData = await ctx.req.formData();
  const budgets = extractFormDataArray({ formData, prefix: "budgets" });

  const settings: UnknownValues<AppSettings> = {
    isUploadEnabled: formData.has("isUploadEnabled"),
    budgets: budgets.map((data) => ({
      maxCost: Number(data.get("maxCost")),
      period: Number(data.get("period")),
      periodType: data.get("periodType"),
      autoDisableUplaod: data.has("autoDisableUplaod"),
    })),
    mediaConvertPricing: {
      SD: Number(formData.get("mediaConvertPricingSD")),
      HD: Number(formData.get("mediaConvertPricingHD")),
      "4K": Number(formData.get("mediaConvertPricing4K")),
      audio: Number(formData.get("mediaConvertPricingAudio")),
    },
  };

  if (!isAppSettings(settings)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const atomic = setAppSettings(settings);
  await atomic.commit();

  ctx.setFlash("Saved");
  return ctx.redirectBack();
}

function isAppSettings(data: unknown): data is AppSettings {
  const { isUploadEnabled, budgets, mediaConvertPricing } = data as Partial<
    AppSettings
  >;
  return typeof data === "object" &&
    typeof isUploadEnabled === "boolean" &&
    (!budgets ||
      Array.isArray(budgets) && budgets.every((budget) => isBudget(budget))) &&
    isMediaConvertPricing(mediaConvertPricing);
}

function isBudget(data: unknown): data is AppBudget {
  const { maxCost, period, periodType, autoDisableUplaod } = data as Partial<
    AppBudget
  >;
  return typeof data === "object" &&
    typeof maxCost === "number" &&
    typeof period === "number" &&
    typeof periodType === "string" &&
    BUDGET_PERIOD_TYPES.includes(periodType) &&
    typeof autoDisableUplaod === "boolean";
}

function isMediaConvertPricing(data: unknown): data is MediaConvertPricing {
  const { HD, SD, "4K": fourK, audio } = data as Partial<MediaConvertPricing>;
  return typeof data === "object" &&
    typeof SD === "number" &&
    typeof HD === "number" &&
    typeof fourK === "number" &&
    typeof audio === "number";
}
