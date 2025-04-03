import { patchAppSettings } from "../../../util/kv/app.ts";

interface BudgetEvent {
  source: "aws.budgets";
  detail: {
    budgetName: "AppBudget";
  };
}

export function isBudgetAlarm(event: unknown): event is BudgetEvent {
  const { source, detail } = event as Partial<BudgetEvent>;
  return typeof event === "object" &&
    source === "aws.budgets" &&
    detail?.budgetName === "AppBudget";
}

export function handleBudgetAlarm() {
  return patchAppSettings({ isUploadEnabled: false });
}
